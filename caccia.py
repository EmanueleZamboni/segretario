"""Caccia agli affari su Vinted, sul server (24/7, anche a PC spento). Niente intelligenza artificiale: regole fisse.

Le regole NON stanno nel repo (è pubblico): stanno in /data/caccia/regole.json e si cambiano dal tool caccia_regole.
Forma delle regole:
  {"ricerche": [{"cerca": "ccd-tr918", "max": 80, "deve": "tr.?918", "gruppo": "camere"}, ...],
   "escludi": "regex (accessori, difetti, cose che Ema ha già)",
   "per_giro": 14, "orari": ["09:00", "21:00"], "gia_visti": [id, ...]}
Un annuncio è un affare quando: il titolo contiene `deve` (o tutte le parole di `cerca`), il prezzo è <= `max`
(oppure, senza `max`, <= `mediana` x la mediana dei prezzi di quella ricerca), non tocca `escludi`, non è un vestito,
e non è già stato visto. Un giro cerca al massimo `per_giro` termini (a rotazione), una pagina ciascuno, lentamente.
Vinted (Cloudflare) blocca chi corre: una pagina ogni PAUSA secondi e, se ci blocca, il giro si ferma subito; dopo
FERMO_DOPO giri bloccati di fila la caccia si ferma da sola e lo dice in stato()."""

from __future__ import annotations

import gzip
import http.cookiejar
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Callable

DOMINIO = "www.vinted.it"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")
PAUSA = 6.0          # secondi tra due pagine di ricerca (ognuna ~7 MB): sul PC 4-5 s non ha mai bloccato
MAX_PER_GIRO = 20    # tetto duro, qualunque cosa dicano le regole
MAX_SEMPRE = 8       # ricerche "sempre" (ogni giro) al massimo
MAX_TROVATI_MSG = 6  # affari per messaggio: solo i migliori (Ema 17/11: "only the top 4 or 8", niente "+N more")
MAX_PUNTI = 10.0      # sotto 1/10 del valore solito è quasi sempre un ricambio, un manuale o una scatola
SOGLIA = 2.0        # con "vale": affare solo se il prezzo è al massimo metà del valore solito (vale / prezzo >= SOGLIA)
FERMO_DOPO = 3       # giri bloccati di fila prima di fermarsi da soli

BLOCCO = ("just a moment", "cf-browser-verification", "challenge-platform", "attention required",
          "enable javascript and cookies", "/cdn-cgi/challenge")
MARCA_ITEMS = '"items":{"items":['
MARCA_ESC = rb'\"items\":{\"items\":['  # la stessa, com'è scritta (escapata) dentro la pagina
# Vestiti, scarpe, roba per bambini e orologi hanno una taglia prima di " · " nella riga della condizione.
TAGLIA_RE = re.compile(r"^(?!taglia unica|one size|taille unique|talla única|einheitsgr)[^·]{1,40}·", re.I)
# Accessori, carte, gadget (IT FR ES DE EN NL), come skip_accessories del Vinted MCP del PC. Una ricerca con
# "accessori": true li tiene (quando l'accessorio È la cosa cercata, es. un adattatore della lista della spesa).
ACCESSORI_RE = re.compile(
    r"batter(y|ia|ie|ij)|\bakku|bater[ií]a|\baccu\b|caricabatt|charger|chargeur|cargador|lader?ger[äa]t|\blader\b|"
    r"alimentator|power ?supply|netzteil|adapt(er|ateur|ador|atore)|\bcav[oi]\b|\bcable|câble|\bkabel|\bborsa|"
    r"\bbag\b|sacoche|sac de|\btasche|\bbolsa|\bfunda\b|housse|custodia|[ée]tui\b|\bcase\b|\bcover\b|coque|"
    r"cassett|\btape\b|\bcinta|\bk7\b|telecomando|remote|t[ée]l[ée]commande|\bmando\b|fernbedienung|manual|"
    r"manuel|mode d.emploi|anleitung|istruzioni|\bnotice\b|handleiding|\blibro|\bbook\b|\bbuch\b|spare part|"
    r"pi[eè]ces d[ée]tach|\bparts\b|ersatzteil|repuesto|\bstand\b|supporto|soporte|\bsupport\b|dust ?cover|"
    r"sticker|adesivo|poster|t-?shirt|maglia|maglietta|felpa|hoodie|paraluce|lens hood|treppiede|tripod|"
    r"tr[ée]pied|stativ|memory card|scheda di memoria|catalogo|catalogue|display|schermo|pellicola protettiva|"
    r"scatola vuota|empty box|solo scatola|\bbox only|"
    # 18/11: ricambi, manuali e carta in DE ES PT FR (un manuale del Nikon D1 a 1,50 € finiva primo)
    r"handbuch|bedienungs|instruc|instru[çc][õo]es|operation guide|user guide|\bcd ?(de|d.|di|da)\b|cd-?rom|"
    r"\bsoftware\b|\bdriver\b|\bcaja\b|\bcaixa\b|borracha|altifalante|ecr[ãa]\b|[ée]cran\b|pantalla|carcasa|"
    r"scocca|keypad|tastier|tastatur|\bantena\b|\bpe[çc]as?\b|\bpi[eè]ces?\b|\bpiezas?\b|pellicola|protector|"
    r"rivista|magazine|zeitschrift|pubblicit|publicit|werbung|p[áa]gina|gurt\b|\bsupports\b|suportes|soportes|desk insert|\bcd installa|installation cd|\bstrap\b|tracolla|cinghia|"
    r"dragonne|pare-soleil|sonnenblende|algorithm card|nanoblock|\blego\b|ladekabel|carregador|headset|"
    r"auricolar|kopfh[öo]rer|[ée]couteur|tragetasche|hoesje|\bmic\b|\bjack\b", re.I)
DIFETTI_RE = re.compile(r"defekt|difettos|non funzion|for parts|pour pi[eè]ces|para piezas|ricambi|"
                        r"not working|ne fonctionne|no funciona|kaputt|guast|rott[oa]\b|\bhs\b", re.I)


class Bloccato(RuntimeError):
    """Cloudflare rifiuta il server (pagina di sfida al posto dei risultati)."""


# ------------------------------------------------------------------ rete

class Vinted:
    """Un browser minimo: prende i cookie dalla home una volta, poi una pagina di ricerca ogni PAUSA secondi."""

    def __init__(self, pausa: float = PAUSA, apri: Callable | None = None):
        self.pausa = pausa
        self._ultimo = 0.0
        self._pronto = False
        jar = http.cookiejar.CookieJar()
        self._op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        self._op.addheaders = [("User-Agent", UA), ("Accept-Language", "it-IT,it;q=0.9,en;q=0.8"),
                               ("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")]
        self._apri = apri or self._apri_vero

    def _apri_vero(self, url: str) -> bytes:
        try:
            r = self._op.open(urllib.request.Request(url), timeout=40)
            data = r.read()
        except urllib.error.HTTPError as e:  # 403/429 con la pagina di Cloudflare = blocco
            corpo = e.read()[:4000].decode("utf-8", "replace").lower()
            if e.code in (403, 429, 503) and (any(m in corpo for m in BLOCCO) or e.headers.get("cf-mitigated")):
                raise Bloccato(f"HTTP {e.code} da Cloudflare") from None
            raise
        if r.headers.get("Content-Encoding") == "gzip":
            data = gzip.decompress(data)
        return data

    def _get(self, url: str) -> bytes | str:
        attesa = self.pausa - (time.time() - self._ultimo)
        if attesa > 0:
            time.sleep(attesa)
        self._ultimo = time.time()
        return self._apri(url)

    def cerca(self, termine: str, prezzo_max: float | None = None) -> list[dict]:
        if not self._pronto:
            casa = self._get(f"https://{DOMINIO}/")
            if isinstance(casa, bytes):
                casa = casa[:4000].decode("utf-8", "replace")
            if any(m in casa[:4000].lower() for m in BLOCCO):
                raise Bloccato("la home di Vinted risponde con la pagina di Cloudflare")
            self._pronto = True
        q = {"search_text": termine, "page": 1, "currency": "EUR", "order": "newest_first"}
        if prezzo_max is not None:
            q["price_to"] = prezzo_max
        return annunci(self._get(f"https://{DOMINIO}/catalog?" + urllib.parse.urlencode(q)))


FLIGHT_INIZIO = b'self.__next_f.push([1,"'


def _pezzi_flight(pagina: bytes):
    """Il testo di ogni self.__next_f.push([1,"..."]) (ancora escapato). Scansione a mano: una regex con gruppo
    ripetuto su pezzi di qualche MB faceva salire la memoria di quasi 200 MB."""
    i = 0
    while True:
        i = pagina.find(FLIGHT_INIZIO, i)
        if i < 0:
            return
        j = k = i + len(FLIGHT_INIZIO)
        while True:
            k = pagina.find(b'"', k)
            if k < 0:
                return
            n = 0
            while pagina[k - 1 - n] == 92:  # backslash: le virgolette escapate non chiudono
                n += 1
            if n % 2 == 0:
                break
            k += 1
        yield pagina[j:k]
        i = k


def _grezzi(pagina: bytes) -> list | None:
    """Solo i pezzi di dati Next.js dal primo che contiene i risultati in poi, uno alla volta (una pagina è ~7 MB:
    decodificarla tutta costava ~250 MB di memoria, troppi per il server)."""
    pezzi: list[str] = []
    for grezzo in _pezzi_flight(pagina):
        if not pezzi and MARCA_ESC not in grezzo:
            continue
        try:
            pezzi.append(json.loads(b'"' + grezzo + b'"'))
        except ValueError:
            continue
        flight = "".join(pezzi)
        at = flight.find(MARCA_ITEMS)
        try:
            return json.JSONDecoder().raw_decode(flight, at + len(MARCA_ITEMS) - 1)[0]
        except ValueError:
            if len(pezzi) > 40:
                return None
            continue  # l'elenco continua nel pezzo dopo
    return None


def annunci(pagina: bytes | str) -> list[dict]:
    """I risultati di una pagina di ricerca (dati Next.js nella pagina). Pagina senza risultati e piccola = blocco."""
    if isinstance(pagina, str):
        pagina = pagina.encode("utf-8")
    grezzi = _grezzi(pagina)
    if grezzi is None:
        testa = pagina[:4000].decode("utf-8", "replace").lower()
        if any(m in testa for m in BLOCCO) or len(pagina) < 50_000:
            raise Bloccato(f"pagina di blocco o sfida ({len(pagina)} byte, nessun risultato)")
        raise RuntimeError("la pagina di ricerca di Vinted ha cambiato forma: va aggiornato caccia.annunci")
    out = []
    for w in grezzi:
        p = w.get("productItem") or {}
        box = p.get("itemBox") or {}
        prezzo = p.get("price")
        if isinstance(prezzo, dict):
            prezzo = prezzo.get("amount")
        try:
            prezzo = float(prezzo)
        except (TypeError, ValueError):
            continue
        if not p.get("id"):
            continue
        out.append({"id": int(p["id"]), "titolo": (p.get("title") or "").strip(), "prezzo": prezzo,
                    "marca": box.get("firstLine") or "", "condizione": box.get("secondLine") or "",
                    "url": f"https://{DOMINIO}/items/{p['id']}",
                    "negozio": bool((p.get("user") or {}).get("isBusiness"))})
    return out


# ------------------------------------------------------------------ regole

def controlla_regole(r: dict) -> dict:
    """Valida e normalizza le regole (errore leggibile se qualcosa non va)."""
    if not isinstance(r, dict):
        raise ValueError("le regole devono essere un oggetto JSON")
    ric = r.get("ricerche")
    if not isinstance(ric, list) or not ric:
        raise ValueError("servono 'ricerche': una lista di {cerca, max | mediana, deve?, gruppo?}")
    pulite = []
    for i, x in enumerate(ric):
        if not isinstance(x, dict) or not str(x.get("cerca", "")).strip():
            raise ValueError(f"ricerca {i}: manca 'cerca'")
        y = {"cerca": str(x["cerca"]).strip()[:80], "gruppo": str(x.get("gruppo", "")).strip()[:30]}
        if x.get("max") is not None:
            y["max"] = float(x["max"])
        elif x.get("mediana") is not None:
            y["mediana"] = float(x["mediana"])
            if not 0 < y["mediana"] <= 1:
                raise ValueError(f"ricerca {i}: 'mediana' va tra 0 e 1 (es. 0.5 = metà del prezzo tipico)")
        else:
            raise ValueError(f"ricerca {i} ({y['cerca']}): serve 'max' (euro) o 'mediana'")
        if x.get("vale") is not None:
            y["vale"] = float(x["vale"])
            if y["vale"] <= 0:
                raise ValueError(f"ricerca {i} ({y['cerca']}): 'vale' (prezzo solito in euro) deve essere > 0")
        if x.get("nome"):
            y["nome"] = str(x["nome"]).strip()[:60]
        if x.get("accessori"):
            y["accessori"] = True
        if x.get("sempre"):
            y["sempre"] = True
        if x.get("nominate"):
            y["nominate"] = True
        if x.get("deve"):
            re.compile(x["deve"])
            y["deve"] = str(x["deve"])
        pulite.append(y)
    soglia = float(r.get("soglia") or SOGLIA)
    if not 1 <= soglia <= 10:
        raise ValueError("'soglia' va tra 1 e 10 (2 = prezzo al massimo metà del valore solito)")
    out = {"ricerche": pulite, "escludi": str(r.get("escludi") or ""), "soglia": soglia,
           "per_giro": max(1, min(int(r.get("per_giro") or 14), MAX_PER_GIRO)),
           "orari": [o for o in (r.get("orari") or ["09:00", "21:00"]) if re.fullmatch(r"\d\d:\d\d", str(o))][:4],
           "gia_visti": [int(v) for v in (r.get("gia_visti") or []) if str(v).isdigit()][:5000]}
    if out["escludi"]:
        re.compile(out["escludi"])
    return out


def _deve(ric: dict) -> re.Pattern:
    if ric.get("deve"):
        return re.compile(ric["deve"], re.I)
    parole = [re.escape(p) for p in re.split(r"[\s\-]+", ric["cerca"].lower()) if p]
    return re.compile("".join(f"(?=.*{p})" for p in parole), re.I | re.S)


def _mediana(valori: list[float]) -> float | None:
    v = sorted(valori)
    if not v:
        return None
    m = len(v) // 2
    return v[m] if len(v) % 2 else (v[m - 1] + v[m]) / 2


def _scartato(a: dict, ric: dict, tetto: float, esc: re.Pattern | None, visti: set[int]) -> bool:
    testo = f"{a['titolo']} {a['marca']}"
    return (a["id"] in visti or a["prezzo"] > tetto or a["prezzo"] <= 0 or bool(DIFETTI_RE.search(testo))
            or bool(esc and esc.search(testo)) or (not ric.get("accessori") and bool(ACCESSORI_RE.search(a["titolo"]))))


def _affare(a: dict, ric: dict, tetto: float, tipico: float | None, cercato: str, soglia: float) -> dict | None:
    """L'annuncio con il suo punteggio (quante volte il valore solito sta nel prezzo); None se non vale abbastanza."""
    vale = ric.get("vale") or tipico
    punti = (vale or tetto) / a["prezzo"]
    if ric.get("vale") and punti < soglia:  # Ema 17/11: niente "affari" al prezzo normale
        return None
    if vale and punti > MAX_PUNTI:  # 18/11: a meno di 1/10 del valore è un pezzo o un manuale, non l'oggetto
        return None
    m = _deve(ric).search(a["titolo"])
    return {**a, "gruppo": ric.get("gruppo", ""), "cercato": cercato, "tetto": round(tetto, 2),
            "nome": ric.get("nome") or (m.group(0).strip() if m and m.group(0).strip() else ric["cerca"]),
            "punti": round(punti, 2), **({"tipico": round(vale, 2)} if vale else {})}


def affari(ric: dict, trovati: list[dict], escludi: str, visti: set[int], nominate: list[dict] | None = None,
           soglia: float = SOGLIA) -> list[dict]:
    """Gli annunci di una ricerca che passano le regole. Una ricerca larga con "nominate": true giudica ogni annuncio
    con la prima ricerca nominata (con "max") il cui `deve` è nel titolo: il suo tetto, il suo valore, il suo nome."""
    esc = re.compile(escludi, re.I) if escludi else None
    vestiti = [a for a in trovati if not TAGLIA_RE.match(a["condizione"])]
    out = []
    if ric.get("nominate"):
        for a in vestiti:
            r2 = next((n for n in (nominate or []) if n.get("max") is not None and _deve(n).search(a["titolo"])), None)
            if r2 is None:
                continue
            tetto = min(r2["max"], ric["max"]) if ric.get("max") is not None else r2["max"]
            if not _scartato(a, r2, tetto, esc, visti):
                x = _affare(a, r2, tetto, None, ric["cerca"], soglia)
                if x:
                    out.append(x)
        return out
    deve = _deve(ric)
    pertinenti = [a for a in vestiti if deve.search(a["titolo"])]
    tetto = ric.get("max")
    med = _mediana([a["prezzo"] for a in pertinenti])
    tipico = med if med is not None and len(pertinenti) >= 4 else None  # con meno annunci il prezzo tipico non dice nulla
    if tetto is None:
        if tipico is None:
            return []
        tetto = tipico * ric["mediana"]
    for a in pertinenti:
        if not _scartato(a, ric, tetto, esc, visti):
            x = _affare(a, ric, tetto, tipico, ric["cerca"], soglia)
            if x:
                out.append(x)
    return out


def migliori(trovati: list[dict], n: int = MAX_TROVATI_MSG) -> list[dict]:
    """I primi n per punteggio (il più sotto al valore solito in cima), un annuncio una volta sola e UN SOLO annuncio
    per modello (Ema 18/11: sei link della stessa Minolta DiMAGE 7 in un messaggio)."""
    visti, modelli, out = set(), set(), []
    for a in sorted(trovati, key=lambda a: (-a.get("punti", 0), a["prezzo"])):
        modello = (a.get("nome") or a.get("titolo", "")).lower()
        if a["id"] not in visti and modello not in modelli:
            visti.add(a["id"])
            modelli.add(modello)
            out.append(a)
    return out[:n]


def da_segnare(trovati: list[dict], mandati: list[dict]) -> list[dict]:
    """Quelli da segnare come visti: i mandati e gli altri annunci degli STESSI modelli (se no tornano uno per giro).
    Gli annunci di modelli rimasti fuori dal messaggio restano liberi per un giro successivo."""
    modelli = {(a.get("nome") or a.get("titolo", "")).lower() for a in mandati}
    return [a for a in trovati if (a.get("nome") or a.get("titolo", "")).lower() in modelli]


# ------------------------------------------------------------------ stato e giro

class Caccia:
    def __init__(self, cartella: Path, adesso: Callable[[], datetime], vinted_factory: Callable[[], Vinted] = Vinted):
        self.dir = cartella
        self.adesso = adesso
        self.vinted_factory = vinted_factory
        self.in_corso = False

    # file
    def _leggi(self, nome: str, default):
        try:
            return json.loads((self.dir / nome).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return default

    def _scrivi(self, nome: str, obj) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        tmp = self.dir / (nome + ".tmp")
        tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(self.dir / nome)

    def regole(self) -> dict | None:
        r = self._leggi("regole.json", None)
        return r if isinstance(r, dict) and r.get("ricerche") else None

    def salva_regole(self, r: dict) -> dict:
        r = controlla_regole(r)
        self._scrivi("regole.json", r)
        return r

    def stato(self) -> dict:
        s = self._leggi("stato.json", {})
        r = self.regole()
        return {"attiva": bool(r) and not s.get("fermo"), "regole": len(r["ricerche"]) if r else 0,
                "orari": r["orari"] if r else [], "in_corso": self.in_corso, **s}

    def dovuto(self) -> bool:
        """È l'ora di un giro (ogni orario delle regole, una volta al giorno ciascuno)?"""
        r = self.regole()
        s = self._leggi("stato.json", {})
        if not r or s.get("fermo") or self.in_corso:
            return False
        t = self.adesso()
        fatti = s.get("orari_fatti", {})
        for o in r["orari"]:
            if t.strftime("%H:%M") >= o and fatti.get(o) != t.strftime("%Y-%m-%d"):
                return True
        return False

    def giro(self, manuale: bool = False) -> dict:
        """Un giro completo. Ritorna {esito, cercati, annunci, trovati:[...]}; non manda messaggi (lo fa chi chiama)."""
        r = self.regole()
        if not r:
            return {"esito": "nessuna regola"}
        self.in_corso = True
        s = self._leggi("stato.json", {})
        t = self.adesso()
        try:
            fatti = s.get("orari_fatti", {})
            for o in r["orari"]:
                if t.strftime("%H:%M") >= o:
                    fatti[o] = t.strftime("%Y-%m-%d")
            s["orari_fatti"] = fatti
            visti_d = self._leggi("visti.json", {})
            visti = {int(k) for k in visti_d} | set(r["gia_visti"])
            # "sempre": ricerche larghe che girano ogni volta (lì escono gli annunci nuovi); le altre a turno
            sempre = [x for x in r["ricerche"] if x.get("sempre")][:MAX_SEMPRE]
            ric = [x for x in r["ricerche"] if not x.get("sempre")] or [None]
            da = s.get("prossimo", 0) % len(ric)
            n_rot = min(max(r["per_giro"] - len(sempre), 0), len(ric))
            turno = sempre + [x for x in (ric[(da + i) % len(ric)] for i in range(n_rot)) if x]
            nominate = [x for x in r["ricerche"] if not x.get("sempre")]
            v = self.vinted_factory()
            trovati, cercati, letti, esito = [], 0, 0, "ok"
            for x in turno:
                try:
                    pagina = v.cerca(x["cerca"], x.get("max"))
                except Bloccato as e:
                    esito = f"bloccato da Vinted ({e})"
                    break
                except Exception as e:  # noqa: BLE001  una ricerca rotta non ferma le altre
                    esito = f"errore su '{x['cerca']}': {str(e)[:120]}"
                    cercati += 1
                    continue
                cercati += 1
                letti += len(pagina)
                for a in affari(x, pagina, r["escludi"], visti, nominate, r.get("soglia", SOGLIA)):
                    trovati.append(a)
                    visti.add(a["id"])
            s["prossimo"] = (da + max(cercati - len(sempre), 0)) % len(ric)
            # solo i migliori vanno a Ema e diventano "visti"; gli altri buoni restano liberi per un giro successivo
            tutti, buoni = len(trovati), trovati
            trovati = migliori(buoni)
            for a in da_segnare(buoni, trovati):
                visti_d[str(a["id"])] = t.strftime("%Y-%m-%d")
            if len(visti_d) > 20_000:
                visti_d = dict(list(visti_d.items())[-20_000:])
            self._scrivi("visti.json", visti_d)
            bloccato = esito.startswith("bloccato")
            s["bloccati_di_fila"] = s.get("bloccati_di_fila", 0) + 1 if bloccato else 0
            if s["bloccati_di_fila"] >= FERMO_DOPO:
                s["fermo"] = f"Vinted ha rifiutato il server {FERMO_DOPO} giri di fila: caccia ferma ({t:%Y-%m-%d %H:%M})"
            s["ultimo_giro"] = {"quando": t.strftime("%Y-%m-%d %H:%M"), "manuale": manuale, "esito": esito,
                                "cercati": cercati, "di": len(turno), "annunci_letti": letti, "trovati": len(trovati),
                                "buoni_in_tutto": tutti}
            storia = (s.get("storia") or [])[-29:]
            s["storia"] = storia + [s["ultimo_giro"]]
            if trovati:
                s["ultimi_trovati"] = ([{k: a.get(k) for k in ("id", "nome", "titolo", "prezzo", "tipico", "url")}
                                        | {"quando": t.strftime("%Y-%m-%d")}
                                        for a in trovati] + (s.get("ultimi_trovati") or []))[:20]
            self._scrivi("stato.json", s)
            return {**s["ultimo_giro"], "lista": trovati}
        finally:
            self.in_corso = False

    def segna(self, **campi) -> None:
        """Aggiorna qualche campo dello stato (None = toglilo)."""
        s = self._leggi("stato.json", {})
        for k, v in campi.items():
            if v is None:
                s.pop(k, None)
            else:
                s[k] = v
        self._scrivi("stato.json", s)

    def riattiva(self) -> None:
        s = self._leggi("stato.json", {})
        s.pop("fermo", None)
        s["bloccati_di_fila"] = 0
        self._scrivi("stato.json", s)


def _euro(x: float) -> str:
    return f"€{x:.0f}" if float(x).is_integer() else f"€{x:.2f}"


def messaggio(trovati: list[dict]) -> str:
    """Il messaggio Telegram per Ema (HTML, inglese semplice): solo i migliori, il più conveniente in cima, nessun
    "+N more". Per ognuno: il modello in grassetto, prezzo e valore solito, il titolo del venditore, un link corto."""
    from html import escape
    top = migliori(trovati)
    righe = [f"<b>Vinted: {len(top)} good find{'s' if len(top) != 1 else ''}</b> (best deal first)"]
    for i, a in enumerate(top, 1):
        nome = escape(str(a.get("nome") or a["titolo"]))
        prezzo = _euro(a["prezzo"])
        if a.get("tipico"):
            prezzo += f" · usually ~{_euro(round(a['tipico']))}"
        extra = [x for x in ("from your shopping list" if a.get("gruppo") == "lista" else "",
                             "shop" if a.get("negozio") else "") if x]
        if extra:
            prezzo += " · " + ", ".join(extra)
        righe.append(f"\n{i}. <b>{nome}</b>\n{prezzo}\n<i>{escape(a['titolo'][:70])}</i>\n"
                     f"<a href=\"{escape(a['url'], quote=True)}\">Open on Vinted</a>")
    righe.append("\n<i>Picked by model name and price only: check photos and condition before buying.</i>")
    return "\n".join(righe)
