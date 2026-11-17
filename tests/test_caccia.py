"""Caccia Vinted sul server, senza rete: un finto Vinted risponde con pagine come quelle vere (dati Next.js), con una
pagina di blocco Cloudflare, e i giri devono trovare solo gli affari giusti, ruotare, ricordare i visti, fermarsi.
Esegui: python tests/test_caccia.py"""

import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-caccia-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "LINKS_STATS_KEY": ""})

import caccia  # noqa: E402


def pagina(items):
    """Una pagina di ricerca finta: i risultati spezzati in due chunk self.__next_f.push come fa Next.js."""
    wrapped = [{"productItem": {"id": i, "title": t, "price": {"amount": str(p), "currency_code": "EUR"},
                                "itemBox": {"firstLine": "Sony", "secondLine": cond},
                                "user": {"id": 1, "isBusiness": shop}, "url": f"/items/{i}-x"}}
               for i, t, p, cond, shop in items]
    flight = '0:["x"]\n5:{"items":{"items":' + json.dumps(wrapped) + ',"total":%d}}' % len(items)
    half = len(flight) // 2
    chunks = "".join('<script>self.__next_f.push([1,%s])</script>' % json.dumps(c) for c in (flight[:half], flight[half:]))
    return "<html>" + "x" * 60_000 + chunks + "</html>"


BLOCCATA = "<html><title>Just a moment...</title>challenge-platform</html>"
CATALOGO = {
    "ccd-tr918": [(1001, "Sony CCD-TR918E Hi8 handycam", 45, "Buone", False),
                  (1002, "Sony CCD-TR918E defekt", 10, "Discrete", False),
                  (1003, "Batteria per CCD-TR918", 8, "Nuovo", False),
                  (1004, "Sony CCD-TR918 completa", 95, "Ottime", False)],
    "videocamera sony": [(2001, "Videocamera Sony vecchia", 15, "Buone", False),
                         (2002, "Sony CCD-SC55 cubo", 20, "Buone", True),
                         (2003, "Felpa Sony", 5, "M · Buone", False)],
    "nokia n91": [(3001, "Nokia N91", 100, "Buone", False), (3002, "Nokia N91 8GB", 110, "Buone", False),
                  (3003, "Nokia N91 nero", 95, "Buone", False), (3004, "Nokia N91 usato", 40, "Buone", False),
                  (3005, "Cover Nokia N91", 4, "Nuovo", False)],
}
CHIAMATE = []
MODO = {"blocca": False}


class FintoVinted(caccia.Vinted):
    def __init__(self):
        super().__init__(pausa=0, apri=self._finto)

    def _finto(self, url):
        CHIAMATE.append(url)
        if MODO["blocca"]:
            return BLOCCATA
        if url.endswith(".it/"):
            return "<html>home</html>"
        q = caccia.urllib.parse.parse_qs(caccia.urllib.parse.urlsplit(url).query)
        assert q["order"] == ["newest_first"], q
        return pagina(CATALOGO.get(q["search_text"][0], []))


REGOLE = {"ricerche": [{"cerca": "ccd-tr918", "max": 80, "gruppo": "camere"},
                       {"cerca": "videocamera sony", "max": 30, "deve": r"ccd-?sc5|tr918", "gruppo": "camere"},
                       {"cerca": "nokia n91", "mediana": 0.5, "gruppo": "lista"}],
          "escludi": r"batteri", "per_giro": 2, "orari": ["09:00", "21:00"], "gia_visti": ["9999"]}


def main():
    ora = {"t": datetime(2026, 11, 17, 8, 0)}
    c = caccia.Caccia(DATA / "caccia", lambda: ora["t"], FintoVinted)
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
            print("FAIL:", msg)

    # 1. senza regole: spenta, nessun giro dovuto
    ok(not c.dovuto() and c.stato()["attiva"] is False, "senza regole deve essere spenta")
    # 2. regole sbagliate rifiutate con un messaggio chiaro
    for cattiva in ({}, {"ricerche": [{"cerca": "x"}]}, {"ricerche": [{"cerca": "x", "max": 5, "deve": "("}]},
                    {"ricerche": [{"cerca": "x", "mediana": 3}]}):
        try:
            c.salva_regole(cattiva)
            ok(False, f"doveva rifiutare {cattiva}")
        except (ValueError, Exception):  # re.error è un Exception
            pass
    c.salva_regole(REGOLE)
    ok(c.stato()["attiva"] and c.stato()["regole"] == 3, "regole salvate")
    # 3. orari: alle 08:00 niente, alle 09:05 sì, dopo il giro no fino alle 21
    ok(not c.dovuto(), "08:00 non è ora")
    ora["t"] = datetime(2026, 11, 17, 9, 5)
    ok(c.dovuto(), "09:05 è ora")
    out = c.giro()
    trovati = {a["id"]: a for a in out["lista"]}
    # tr918 a 45 sì; defekt no; batteria no (escludi); 95 > 80 no. Vaga: solo il CCD-SC55 (match 'deve'), felpa no.
    ok(set(trovati) == {1001, 2002}, f"trovati sbagliati: {sorted(trovati)}")
    ok(out["cercati"] == 2 and out["esito"] == "ok", out)
    ok(not c.dovuto(), "dopo il giro delle 9 non deve ripartire")
    # 4. rotazione: il giro dopo parte dalla terza ricerca (nokia, regola mediana: tipico ~95-100, metà = ~48)
    ora["t"] = datetime(2026, 11, 17, 21, 1)
    out2 = c.giro()
    ids2 = {a["id"] for a in out2["lista"]}
    ok(ids2 == {3004}, f"nokia: solo il 40 sotto metà del prezzo tipico, cover esclusa dal titolo? {ids2}")
    ok(out2["lista"][0].get("tipico") and out2["lista"][0]["gruppo"] == "lista", out2["lista"][0])
    # 5. i visti non tornano: il giro successivo (ricerche 1-2 di nuovo) non ritrova 1001 e 2002
    ora["t"] = datetime(2026, 11, 18, 9, 1)
    out3 = c.giro()
    ok(not out3["lista"], f"visti ripetuti: {out3['lista']}")
    # 6. messaggio: inglese, link completi, max 4, 'shopping list'
    msg = caccia.messaggio(list(trovati.values()) + out2["lista"])
    ok("https://www.vinted.it/items/1001" in msg and "shopping list" in msg and "EUR 45.00" in msg, msg)
    molti = [dict(out2["lista"][0], id=i) for i in range(7)]
    ok("+3 more" in caccia.messaggio(molti), "oltre 4 affari: '+N more'")
    # 7. blocco Cloudflare: il giro si ferma subito, dopo 3 giri bloccati la caccia si ferma da sola
    MODO["blocca"] = True
    n_prima = len(CHIAMATE)
    for g in range(3):
        b = c.giro(manuale=True)
        ok(b["esito"].startswith("bloccato"), b)
    ok(len(CHIAMATE) - n_prima == 3, f"con il blocco una sola pagina per giro, fatte {len(CHIAMATE) - n_prima}")
    st = c.stato()
    ok(st["attiva"] is False and "fermo" in st, st)
    ora["t"] = datetime(2026, 11, 19, 9, 1)
    ok(not c.dovuto(), "ferma: niente giri automatici")
    c.riattiva()
    MODO["blocca"] = False
    ok(c.dovuto() and c.stato()["attiva"], "riattivata")
    # 8. pagina piccola senza risultati = blocco; pagina grande cambiata = errore diverso
    try:
        caccia.annunci("<html>vuota</html>")
        ok(False, "pagina piccola doveva dire blocco")
    except caccia.Bloccato:
        pass
    try:
        caccia.annunci("<html>" + "y" * 60_000 + "</html>")
        ok(False, "pagina grande senza dati doveva dare errore di forma")
    except caccia.Bloccato:
        ok(False, "pagina grande non è un blocco")
    except RuntimeError:
        pass
    # 9. server: tool e stato collegati, /health non espone le regole
    import asyncio
    import server
    nomi = {t.name for t in asyncio.run(server.mcp.list_tools())}
    ok({"caccia_regole", "caccia_stato"} <= nomi, "tool mancanti")
    server.caccia_regole(json.dumps(REGOLE))
    ok(server.caccia_regole()["ricerche"][0]["cerca"] == "ccd-tr918", "regole lette dal tool")
    try:
        server.caccia_regole("{non json")
        ok(False, "json rotto doveva essere rifiutato")
    except ValueError:
        pass
    # le regole dal documento "regole" del progetto Caccia Vinted: buone = usate, rotte = ignorate con l'errore
    doc = server.MEMORIA / "progetti" / "caccia-vinted" / "regole.md"
    doc.parent.mkdir(parents=True, exist_ok=True)
    doc.write_text(json.dumps({"ricerche": [{"cerca": "da documento", "max": 9}]}), encoding="utf-8")
    server._caccia_regole_da_documento()
    ok(server.caccia_regole()["ricerche"][0]["cerca"] == "da documento", "regole dal documento non prese")
    doc.write_text("{rotto", encoding="utf-8")
    server._caccia_regole_da_documento()
    ok(server.caccia_regole()["ricerche"][0]["cerca"] == "da documento" and "regole_errore" in server.CACCIA.stato(),
       "un documento rotto non deve toccare le regole")
    server.caccia_regole(json.dumps(REGOLE))
    ok("regole_errore" not in server.CACCIA.stato(), "salvare dal tool toglie l'errore")
    st = server.stato()["caccia_vinted"]
    ok(st["attiva"] is True and "ricerche" not in json.dumps(st), st)
    # 10. "sempre": la ricerca larga gira ogni volta, le altre a turno
    c2 = caccia.Caccia(DATA / "caccia2", lambda: ora["t"], FintoVinted)
    c2.salva_regole({"ricerche": [{"cerca": "videocamera sony", "max": 30, "deve": "sc55", "sempre": True},
                                  {"cerca": "ccd-tr918", "max": 80}, {"cerca": "nokia n91", "max": 50},
                                  {"cerca": "x3", "max": 5}], "per_giro": 2})
    giri = []
    for _ in range(4):
        n0 = len(CHIAMATE)
        c2.giro(manuale=True)
        giri.append([caccia.urllib.parse.parse_qs(caccia.urllib.parse.urlsplit(u).query).get("search_text", ["home"])[0]
                     for u in CHIAMATE[n0:]])
    termini = [[g for g in giro if g != "home"] for giro in giri]
    ok(termini == [["videocamera sony", "ccd-tr918"], ["videocamera sony", "nokia n91"], ["videocamera sony", "x3"],
                   ["videocamera sony", "ccd-tr918"]], termini)
    print("CACCIA OK" if not fails else f"CACCIA: {fails} errori")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
