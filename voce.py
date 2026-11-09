"""Il cervello della Voce: l'interfaccia vocale del Segretario (pagina /<segreto>/voce).

Ema parla (o scrive), il testo arriva qui con un po' di storia della conversazione e una fotografia della sua
giornata; Claude risponde usando in sola lettura gli stessi dati del connettore (memoria, progetti, sessioni,
calendario, Keep). La risposta è pensata per essere letta ad alta voce.

Il silenzio è garantito dal codice, non dalla buona volontà del modello: se Claude chiama il tool `silenzio`,
qualunque testo abbia scritto viene buttato e la pagina non dice niente. Con "finche_chiamato" la pagina smette
anche di mandare qui quello che Ema dice, finché non pronuncia il nome (lo filtra il browser: zero costi).

Chiave: ANTHROPIC_API_KEY nelle Impostazioni. Senza chiave la pagina funziona lo stesso (dati e grafica) e la
Voce risponde con un messaggio fisso che spiega cosa manca.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Callable

MODEL = "claude-opus-5-5"
MAX_STORIA = 16  # turni (Ema + Segretario) rimandati a ogni domanda

SYSTEM = """{identita}

=== LA VOCE ===
Quanto sopra è chi sei: il Segretario di Ema, lo stesso della chat Secretary. Adesso però Ema ti sta parlando dalla pagina Voce (sul computer o sul telefono), e qui valgono in più queste regole.

COME PARLI
- La risposta può essere letta da una sintesi vocale: scrivi come parleresti. Frasi brevi e naturali, di solito una o tre. Più lungo solo se te lo chiede.
- Niente elenchi puntati, titoli, markdown, emoji, trattini lunghi, link, codici o id tecnici. Orari e date come si dicono: "alle dieci e mezza", "martedì 10".
- Rispondi nella lingua in cui ti parla (italiano o inglese). Ema è uomo: usa il maschile.
- Un tono calmo, asciutto, presente. Non ripetere la domanda, non riassumere quello che stai per fare, non chiudere con "fammi sapere se...".
- La trascrizione della voce sbaglia i nomi: interpreta dal contesto, e se resta ambiguo chiedi, una domanda sola.

IL TONO (la pagina cambia colore e luce con quello che dici: segnalo tu, con poca punteggiatura speciale)
- All'inizio di una frase puoi mettere un segno di tono: [!] importante o urgente, [?] una domanda che fai a Ema, [~] calmo o rassicurante, [+] buona notizia, [-] brutta notizia o un problema. Senza segno la frase è neutra. Non più di un segno per frase, e la maggior parte delle frasi resta senza.
- Le parole che diresti con enfasi (un orario, un nome, il punto della frase) vanno tra asterischi: *alle dieci e mezza*. Al massimo una o due per frase, zero se non serve.
- Esempio: "[!] Fra *venti minuti* hai la call con Stostudio. Il resto del pomeriggio è libero. [?] Vuoi che ti legga le email?"
- Questi segni non vengono letti ad alta voce: la pagina li toglie. Niente altro markup.

COSA SAI E COSA PUOI FARE
- In fondo al messaggio di Ema trovi la fotografia di adesso (ora, calendario di oggi, task di oggi, chi aspetta lui). Per tutto il resto usa i tool prima di rispondere: progetti, persone, sessioni Claude, oggetti, diario, spesa, altri giorni del calendario. Non inventare mai: se un dato non c'è, dillo.
- Da qui puoi solo leggere. Non puoi mandare messaggi, email o WhatsApp, né scrivere in Keep, nel calendario o nella memoria. Se Ema te lo chiede, dillo in una frase e proponi di farlo dalla chat Secretary.
- Non dare mai per fatto un impegno o un task finché Ema non dice che è fatto.

SILENZIO
- Se Ema ti chiede di non rispondere, di stare zitto, di ascoltare e basta, o sta chiaramente parlando con qualcun altro e non con te, chiama il tool silenzio e non scrivere nient'altro. "Non rispondere a Marco" o "non rispondere a quella mail" NON sono richieste di silenzio: sono domande normali.
- silenzio(durata="turno") per non rispondere solo a questo messaggio; durata="finche_chiamato" quando ti chiede di stare zitto finché non ti chiama per nome ("stai zitto finché non ti chiamo", "pausa", "dormi").

LE REGOLE DI EMA (valgono sempre)
{regole}
"""


TONI = {"!": "forte", "?": "domanda", "~": "calmo", "+": "bene", "-": "male"}
_SEGNO = re.compile(r"\[([!?~+\-])\]")
_FRASE = re.compile(r"[^.!?…\n]+[.!?…]*\s*", re.S)


def segmenta(grezzo: str) -> dict:
    """Dal testo con i segni di tono al pacchetto per la pagina.
    {"testo": pulito, "segmenti": [{"testo": frase pulita, "tono": ..., "enfasi": [[inizio, fine], ...]}]}
    Gli intervalli di enfasi sono indici di carattere nella frase pulita (servono alla sintesi vocale)."""
    segmenti = []
    tono = "neutro"
    pos = 0
    grezzo = (grezzo or "").strip()
    # i segni di tono valgono dalla loro posizione fino al segno successivo; spezziamo lì
    pezzi = []
    for m in _SEGNO.finditer(grezzo):
        pezzi.append((tono, grezzo[pos:m.start()]))
        tono = TONI[m.group(1)]
        pos = m.end()
    pezzi.append((tono, grezzo[pos:]))
    for t, blocco in pezzi:
        for n, frase in enumerate(_FRASE.findall(blocco)):
            if not frase.strip():
                continue
            if n:
                t = "neutro"  # il segno vale per la frase che apre, non per quelle dopo
            pulita, enfasi, i = [], [], 0
            for parte in re.split(r"(\*[^*\n]{1,80}\*)", frase):
                if len(parte) >= 3 and parte.startswith("*") and parte.endswith("*"):
                    parola = parte[1:-1]
                    enfasi.append([i, i + len(parola)])
                    pulita.append(parola); i += len(parola)
                else:
                    parte = parte.replace("*", "")
                    pulita.append(parte); i += len(parte)
            testo = "".join(pulita).strip()
            if testo:
                salto = len("".join(pulita)) - len("".join(pulita).lstrip())
                segmenti.append({"testo": testo, "tono": t, "enfasi": [[a - salto, b - salto] for a, b in enfasi if b - salto > 0]})
    return {"testo": " ".join(s["testo"] for s in segmenti), "segmenti": segmenti}


def _j(x: Any) -> str:
    return x if isinstance(x, str) else json.dumps(x, ensure_ascii=False, default=str)[:12000]


def configurata() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())


def _strumenti(f: dict[str, Callable], stato: dict) -> list:
    """I tool di sola lettura, chiusi sulle funzioni del server (passate in `f`), più il tool del silenzio."""
    from anthropic import beta_tool

    def safe(nome: str, *a, **k) -> str:
        try:
            return _j(f[nome](*a, **k))
        except Exception as err:  # noqa: BLE001: un tool che fallisce diventa un testo, mai un crash
            return f"errore: {str(err)[:200]}"

    @beta_tool
    def memoria_leggi(nome: str, giorno: str = "", ultimi_giorni: int = 2) -> str:
        """Legge la memoria di Ema.

        Args:
            nome: regole, persone, progetti, diario, oggetti o compiti.
            giorno: solo per il diario: AAAA-MM-GG, 'oggi' o 'ieri'.
            ultimi_giorni: per il diario senza giorno: quanti giorni (max 14).
        """
        if nome not in ("regole", "persone", "progetti", "diario", "oggetti", "compiti"):
            return "nome non valido"
        return safe("memoria_leggi", nome, giorno, ultimi_giorni)

    @beta_tool
    def memoria_cerca(testo: str) -> str:
        """Cerca una parola o un tag (#oggetto) in tutta la memoria: diario, progetti, documenti, persone.

        Args:
            testo: la parola o il tag da cercare.
        """
        return safe("memoria_cerca", testo, 15)

    @beta_tool
    def progetto_leggi(nome: str) -> str:
        """Tutto un progetto (cercato per nome o alias): stato, dove siamo, prossimo passo, diario, sessioni Claude.

        Args:
            nome: il nome o un alias del progetto (es. EASY RAVE, Video Match, Stostudio).
        """
        return safe("progetto_leggi", nome, 14)

    @beta_tool
    def progetti_lista() -> str:
        """I progetti aperti con stato, dove siamo e prossimo passo; prima quelli che aspettano Ema."""
        return safe("progetti_lista", True)

    @beta_tool
    def sessioni_lista() -> str:
        """Le sessioni Claude aperte: dove sono arrivate, prossimo passo, la domanda che aspettano da Ema."""
        return safe("sessioni_lista", True)

    @beta_tool
    def calendario(giorno: str) -> str:
        """Gli eventi del calendario di Ema in un giorno.

        Args:
            giorno: AAAA-MM-GG.
        """
        return safe("calendario", giorno)

    @beta_tool
    def tasks() -> str:
        """La nota Keep TASKS di Ema, intera: TODAY'S TASKS, GENERAL, WORK e le altre sezioni."""
        return safe("tasks")

    @beta_tool
    def spesa_lista() -> str:
        """Cosa manca in casa (Keep SPESA, voci non spuntate), raggruppato per negozio."""
        return safe("spesa_lista")

    @beta_tool
    def oggetto_leggi(tag: str) -> str:
        """Un oggetto di Ema con il suo tag unico (es. #sony-vaio-p): dove sta, a chi è prestato, dove compare.

        Args:
            tag: il tag dell'oggetto, con o senza #.
        """
        return safe("oggetto_leggi", tag)

    @beta_tool
    def email_non_lette() -> str:
        """Le email importanti non lette delle ultime 48 ore (mittente e oggetto)."""
        return safe("email")

    @beta_tool
    def silenzio(durata: str = "turno") -> str:
        """Non rispondere. Usalo quando Ema ti chiede di stare zitto o non sta parlando con te.

        Args:
            durata: 'turno' = solo questo messaggio; 'finche_chiamato' = finché Ema non ti chiama per nome.
        """
        stato["silenzio"] = "finche_chiamato" if durata == "finche_chiamato" else "turno"
        return "ok: resti in silenzio. Non scrivere niente."

    return [memoria_leggi, memoria_cerca, progetto_leggi, progetti_lista, sessioni_lista, calendario, tasks,
            spesa_lista, oggetto_leggi, email_non_lette, silenzio]


def _messaggi(storia: list[dict], testo: str, contesto: str) -> list[dict]:
    """La storia (dal browser) diventa una conversazione valida: alterna i ruoli e parte da Ema."""
    msgs: list[dict] = []
    for t in storia[-MAX_STORIA:]:
        ruolo = "assistant" if t.get("ruolo") == "segretario" else "user"
        txt = str(t.get("testo") or "").strip()[:2000]
        if not txt:
            continue
        if msgs and msgs[-1]["role"] == ruolo:
            msgs[-1]["content"] += "\n" + txt
        else:
            msgs.append({"role": ruolo, "content": txt})
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    domanda = f"{testo.strip()[:4000]}\n\n<adesso>\n{contesto}\n</adesso>"
    if msgs and msgs[-1]["role"] == "user":
        msgs[-1]["content"] += "\n" + domanda
    else:
        msgs.append({"role": "user", "content": domanda})
    return msgs


def rispondi(testo: str, storia: list[dict], contesto: str, regole: str, f: dict[str, Callable], identita: str = "") -> dict:
    """{"testo": "..."} oppure {"silenzio": "turno" | "finche_chiamato"}; {"errore": "..."} se qualcosa non va."""
    if not configurata():
        return {"testo": "Per parlare con me serve la chiave di Claude nelle Impostazioni, alla voce Voce del Segretario. "
                         "Il resto della pagina funziona già.", "manca_chiave": True}
    import anthropic

    stato: dict = {}
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"].strip(), timeout=90.0, max_retries=1)
    try:
        runner = client.beta.messages.tool_runner(
            model=MODEL,
            max_tokens=8000,
            system=[{"type": "text", "text": SYSTEM.replace("{identita}", identita.strip() or "Sei il Segretario di Ema (Emanuele Zamboni, Bologna).").replace("{regole}", regole.strip() or "(nessuna)"),
                     "cache_control": {"type": "ephemeral"}}],
            tools=_strumenti(f, stato),
            messages=_messaggi(storia, testo, contesto),
            output_config={"effort": "low"},  # voce: risposte rapide; i tool fanno il lavoro
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            max_iterations=8,
        )
        finale = runner.until_done()
    except anthropic.AuthenticationError:
        return {"errore": "La chiave di Claude nelle Impostazioni non è valida."}
    except anthropic.RateLimitError:
        return {"errore": "Troppe domande di fila: riprova fra un minuto."}
    except anthropic.APIStatusError as err:
        return {"errore": f"Claude non ha risposto ({err.status_code})."}
    except anthropic.APIConnectionError:
        return {"errore": "Non riesco a raggiungere Claude: rete."}

    # Il silenzio vince su tutto: il testo che il modello avesse scritto comunque non esce da qui.
    if stato.get("silenzio"):
        return {"silenzio": stato["silenzio"]}
    if finale.stop_reason == "refusal":
        return {"testo": "Su questo non posso aiutarti."}
    out = " ".join(b.text for b in finale.content if getattr(b, "type", "") == "text").strip()
    if not out:
        return {"testo": "…", "segmenti": []}
    return segmenta(out)
