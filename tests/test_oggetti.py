"""Prova di oggetti (tag unico) e compiti tra progetti. Esegui: python tests/test_oggetti.py"""

import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-ogg-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": ""})

import server  # noqa: E402


def main():
    # 1. oggetti: tag normalizzato, scheda aggiornabile a pezzi, prestiti
    o = server.oggetto_segna("Sony VAIO P", "Sony Vaio P (2009)", dove="scatola grigia, armadio studio")
    assert o["tag"] == "#sony-vaio-p" and o["dove"].startswith("scatola grigia")
    o = server.oggetto_segna("#sony-vaio-p", prestato_a="Francesco")
    assert o["nome"] == "Sony Vaio P (2009)" and o["prestato_a"] == "Francesco", o
    o = server.oggetto_segna("sony vaio p", prestato_a="nessuno")
    assert o["prestato_a"] == ""
    server.diario_scrivi("girato il TikTok sul Vaio #sony-vaio-p", origine="chat", progetto="Video")
    r = server.oggetto_leggi("SONY-VAIO-P")
    assert r["scheda"]["dove"].startswith("scatola") and any("#sony-vaio-p" in h["testo"] for h in r["righe"]), r
    assert (server.MEMORIA / "oggetti.md").read_text(encoding="utf-8").count("#sony-vaio-p") == 1
    server.oggetto_segna("iphone5c", "iPhone 5c", prestato_a="Francesco")
    assert [x["tag"] for x in server.oggetti_lista(solo_prestati=True)] == ["#iphone5c"]
    assert len(server.oggetti_lista()) == 2
    try:
        server.oggetto_segna("###")
        raise SystemExit("tag vuoto doveva fallire")
    except ValueError:
        pass
    # 2. compiti: consegna, lettura per progetto, chiusura, istruzioni che li segnalano
    c = server.compito_assegna("Stostudio", "Rispondere alla mail di Anna sul preventivo", da="chat Secretary")
    assert c["stato"] == "aperto" and c["progetto"] == "Stostudio"
    server.compito_assegna("EASY RAVE", "Provare il drag and drop degli accordi")
    assert [x["testo"] for x in server.compiti_lista("stostudio")] == ["Rispondere alla mail di Anna sul preventivo"]
    assert len(server.compiti_lista()) == 2
    instr = server.build_instructions()
    assert "2 compiti consegnati a progetti (EASY RAVE, Stostudio)" in instr, instr[-300:]
    done = server.compito_chiudi(c["id"], "risposto il 7/11, preventivo mandato")
    assert done["stato"] == "fatto" and done["chiuso"]
    assert len(server.compiti_lista()) == 1 and len(server.compiti_lista(solo_aperti=False)) == 2
    assert "1 compiti consegnati" in server.build_instructions()
    try:
        server.compito_chiudi("cxxxxxx", "x")
        raise SystemExit("id inesistente doveva fallire")
    except ValueError:
        pass
    assert "[fatto]" in (server.MEMORIA / "compiti.md").read_text(encoding="utf-8")
    print("OGGETTI OK")


if __name__ == "__main__":
    main()
