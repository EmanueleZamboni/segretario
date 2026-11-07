"""Prova del brief e della spesa fatti dal server: Keep finto, niente rete.
Esegui: python tests/test_brief.py"""

import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-brief-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "KEEP_MCP_URL": ""})

import brief  # noqa: E402
import keep  # noqa: E402
import server  # noqa: E402

TASKS = ("TODAY'S TASKS\n- Chiamare riparazione VHS\n- Spedire lettore a Pablo\n\nGENERAL\n- Bolletta\n\n"
         "REEL DA MONTARE\n- iPhone 5c #iphone5c\n")
SPESA = [{"text": "Tahina", "checked": False}, {"text": "Semini", "checked": False}, {"text": "Ceci", "checked": False},
         {"text": "Cipolla", "checked": False}, {"text": "Shampoo", "checked": False}, {"text": "Pasta", "checked": True},
         {"text": "Cera per surf", "checked": False}]


def fake_note(title):
    if title.lower() == "tasks":
        return {"title": "TASKS", "text": TASKS}
    if title.lower() == "spesa":
        return {"title": "SPESA", "items": SPESA}
    raise RuntimeError(f"Keep: nota {title!r} non trovata")


def main():
    # 1. sezione di una nota
    assert keep.section(TASKS, "TODAY'S TASKS") == ["Chiamare riparazione VHS", "Spedire lettore a Pablo"]
    assert keep.section(TASKS, "REEL DA MONTARE") == ["iPhone 5c #iphone5c"]
    assert keep.section(TASKS, "NIENTE") == []
    # 2. PSICO mai
    try:
        keep.note("PSICO")
        raise SystemExit("PSICO non va letta")
    except RuntimeError as e:
        assert "personale" in str(e)
    # 3. spesa per negozio: solo le non spuntate, negozi noti, resto da assegnare
    mapping = brief.negozi(DATA / "memoria")
    groups = brief.spesa_per_negozio(SPESA, mapping)
    assert groups["Lidl"] == ["Tahina", "Semini", "Ceci"], groups
    assert groups["Mercato agricolo"] == ["Cipolla"] and groups["DM"] == ["Shampoo"]
    assert groups["Da assegnare a un negozio"] == ["Cera per surf"]
    assert "Pasta" not in str(groups)
    testo = brief.spesa_testo(SPESA, mapping)
    assert testo.index("Lidl") < testo.index("Mercato") < testo.index("DM") < testo.index("Da assegnare")
    assert testo.startswith("<b>Spesa</b>") and "<b>Lidl</b>: Tahina, Semini, Ceci" in testo
    assert "Niente da comprare" in brief.spesa_testo([{"text": "Pasta", "checked": True}], mapping)
    # 4. insegnare un negozio (tool) -> file negozi.json nella memoria, usato dopo
    r = server.spesa_negozio("Cera per surf", "Decathlon")
    assert r == {"prodotto": "cera per surf", "negozio": "Decathlon"}
    mapping2 = brief.negozi(server.MEMORIA)
    assert brief.negozio_di("Cera per surf", mapping2) == "Decathlon"
    server.spesa_negozio("Tahina", "DM")
    mapping3 = brief.negozi(server.MEMORIA)
    assert brief.negozio_di("Tahina", mapping3) == "DM" and "tahina" not in mapping3["Lidl"]
    # 5. il brief: senza Keep configurato parte lo stesso; con Keep finto include TASKS e SPESA
    adesso = datetime(2026, 11, 7, 7, 30)
    sess = [{"nome": "VIDEO MATCH", "stato": "aspetta Ema", "domanda_per_ema": "posso fare il test render?"},
            {"nome": "ALTRA", "stato": "in corso"}]
    props = [{"stato": "in attesa"}, {"stato": "approvata"}]
    reqs = [{"stato": "aperta"}, {"stato": "aperta"}, {"stato": "fatta"}]
    diario = "- 18:44 [brief] brief inviato\n- 18:46 [chat] Brief disattivato\n"
    t1 = brief.costruisci(adesso, server.MEMORIA, sess, props, reqs, diario)
    assert t1.startswith("<b>Sabato 7 novembre</b>") and "VIDEO MATCH: posso fare il test render?" in t1
    assert "1 regole da approvare · 2 richieste in lavorazione" in t1
    assert "<b>Ieri</b>\n• brief inviato\n• Brief disattivato" in t1 and "Oggi" not in t1, t1
    os.environ["KEEP_MCP_URL"] = "http://172.17.0.1:8765/x/mcp"
    keep.note = fake_note
    t2 = brief.costruisci(adesso, server.MEMORIA, sess, props, reqs, diario)
    assert "<b>Oggi</b>\n• Chiamare riparazione VHS\n• Spedire lettore a Pablo" in t2, t2
    assert "<b>Mercato agricolo</b>: Cipolla" in t2 and "Bolletta" not in t2 and "#iphone5c" not in t2
    # Keep rotto: il brief parte lo stesso e lo dice
    keep.note = lambda title: (_ for _ in ()).throw(RuntimeError("Keep: nessuna risposta"))
    t3 = brief.costruisci(adesso, server.MEMORIA, sess, props, reqs, diario)
    assert "<b>Sabato" in t3 and "VIDEO MATCH" in t3 and "<i>Keep non letto: Keep: nessuna risposta</i>" in t3
    keep.note = fake_note
    assert "<b>Oggi</b>" in server.brief_testo()
    # 6. quando mandarlo: all'ora, una volta al giorno, mai dopo mezzogiorno, mai se spento
    assert brief.dovuto(datetime(2026, 11, 7, 7, 30), "07:30", "") is True
    assert brief.dovuto(datetime(2026, 11, 7, 7, 29), "07:30", "") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "07:30", "2026-11-07") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "07:30", "2026-11-06") is True
    assert brief.dovuto(datetime(2026, 11, 7, 12, 1), "07:30", "") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "", "") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "boh", "") is False
    assert server.stato()["brief_ora"] == "spento"
    print("BRIEF OK")


if __name__ == "__main__":
    main()
