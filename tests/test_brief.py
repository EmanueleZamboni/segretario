"""Prova del brief del mattino (ordine di Ema: calendario, oggi, se hai tempo, Claude aspetta te, email),
della spesa per negozio, del calendario iCal e delle email non lette da un database come quello di Postino.
Senza rete. Esegui: python tests/test_brief.py"""

import os
import sqlite3
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-brief-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "KEEP_MCP_URL": "",
                   "CALENDAR_ICS_URL": "", "POSTINO_DB": ""})

import brief  # noqa: E402
import fonti  # noqa: E402
import keep  # noqa: E402
import server  # noqa: E402

TASKS = ("TODAY'S TASKS\n- Chiamare riparazione VHS\n- Spedire lettore a Pablo\n\nGENERAL\n- Bolletta Gera\n- Satispay\n\n"
         "WORK\n- 2FA GitHub\n\nREEL DA MONTARE\n- iPhone 5c #iphone5c\n")
SPESA = [{"text": "Tahina", "checked": False}, {"text": "Semini", "checked": False}, {"text": "Ceci", "checked": False},
         {"text": "Cipolla", "checked": False}, {"text": "Shampoo", "checked": False}, {"text": "Pasta", "checked": True},
         {"text": "Cera per surf", "checked": False}]
ICS = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//
BEGIN:VEVENT
UID:1
DTSTART;TZID=Europe/Rome:20261107T103000
DTEND;TZID=Europe/Rome:20261107T113000
SUMMARY:Dentista
LOCATION:Via Roma 1
END:VEVENT
BEGIN:VEVENT
UID:2
DTSTART;VALUE=DATE:20261107
DTEND;VALUE=DATE:20261108
SUMMARY:Compleanno Marco
END:VEVENT
BEGIN:VEVENT
UID:3
DTSTART;TZID=Europe/Rome:20261003T090000
DTEND;TZID=Europe/Rome:20261003T093000
RRULE:FREQ=WEEKLY;BYDAY=SA
SUMMARY:Palestra
END:VEVENT
BEGIN:VEVENT
UID:4
DTSTART;TZID=Europe/Rome:20261108T090000
DTEND;TZID=Europe/Rome:20261108T100000
SUMMARY:Domani, non oggi
END:VEVENT
END:VCALENDAR
"""


def fake_note(title):
    if title.lower() == "tasks":
        return {"title": "TASKS", "text": TASKS}
    if title.lower() == "spesa":
        return {"title": "SPESA", "items": SPESA}
    raise RuntimeError(f"Keep: nota {title!r} non trovata")


def postino_db(path: Path, adesso: datetime):
    con = sqlite3.connect(path)
    con.executescript("""
    CREATE TABLE accounts (id INTEGER PRIMARY KEY, email TEXT);
    CREATE TABLE folders (id INTEGER PRIMARY KEY, role TEXT);
    CREATE TABLE messages (id INTEGER PRIMARY KEY, account_id INTEGER, folder_id INTEGER, subject TEXT, from_json TEXT,
      from_email TEXT, date TEXT, seen INTEGER, mine INTEGER, draft INTEGER, category TEXT, snippet TEXT);
    INSERT INTO accounts VALUES (1, 'ema@example.com');
    INSERT INTO folders VALUES (1, 'inbox'), (2, 'spam');
    """)
    recent = adesso.strftime("%Y-%m-%dT06:00:00")
    old = "2026-10-01T10:00:00"
    rows = [
        (1, 1, "Preventivo video", '{"name":"Anna Rossi","address":"anna@x.it"}', "anna@x.it", recent, 0, 0, 0, "person", ""),
        (1, 1, "Letta già", '{"name":"Paolo"}', "p@x.it", recent, 1, 0, 0, "person", ""),
        (1, 1, "Offerta -50%", '{"name":"Shop"}', "shop@x.it", recent, 0, 0, 0, "newsletter", ""),
        (1, 2, "Spam", '{"name":"Spam"}', "s@x.it", recent, 0, 0, 0, "person", ""),
        (1, 1, "Vecchia", '{"name":"Vecchia"}', "v@x.it", old, 0, 0, 0, "person", ""),
        (1, 1, "Mia bozza", '{"name":"Ema"}', "ema@example.com", recent, 0, 1, 1, "person", ""),
        (1, 1, "Postino server: rapporto", '{"name":"ezamboni96"}', "ema@example.com", recent, 0, 0, 0, "person", ""),
        (1, 1, "Re: Preventivo video", '{"name":"Anna Rossi"}', "anna@x.it", recent, 0, 0, 0, "person", ""),
    ]
    con.executemany("INSERT INTO messages (account_id, folder_id, subject, from_json, from_email, date, seen, mine, draft, category, snippet) VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows)
    con.commit()
    con.close()


def main():
    adesso = datetime(2026, 11, 7, 7, 30, tzinfo=fonti.TZ)
    # 1. sezioni di una nota
    assert keep.section(TASKS, "TODAY'S TASKS") == ["Chiamare riparazione VHS", "Spedire lettore a Pablo"]
    assert keep.section(TASKS, "GENERAL") == ["Bolletta Gera", "Satispay"] and keep.section(TASKS, "NIENTE") == []
    try:
        keep.note("PSICO")
        raise SystemExit("PSICO non va letta")
    except RuntimeError as e:
        assert "personale" in str(e)
    # 2. spesa per negozio (solo non spuntate; resto da assegnare; insegnare un negozio)
    mapping = brief.negozi(DATA / "memoria")
    groups = brief.spesa_per_negozio(SPESA, mapping)
    assert groups["Lidl"] == ["Tahina", "Semini", "Ceci"] and groups["Mercato agricolo"] == ["Cipolla"] and groups["DM"] == ["Shampoo"]
    assert groups["Da assegnare a un negozio"] == ["Cera per surf"] and "Pasta" not in str(groups)
    testo = brief.spesa_testo(SPESA, mapping)
    assert testo.startswith("<b>Spesa</b>") and "<b>Lidl</b>: Tahina, Semini, Ceci" in testo
    assert "Niente da comprare" in brief.spesa_testo([{"text": "Pasta", "checked": True}], mapping)
    assert server.spesa_negozio("Cera per surf", "Decathlon") == {"prodotto": "cera per surf", "negozio": "Decathlon"}
    assert brief.negozio_di("Cera per surf", brief.negozi(server.MEMORIA)) == "Decathlon"
    # 3. calendario: solo gli eventi di oggi, ricorrenze comprese, ordinati (tutto il giorno prima)
    ev = fonti.eventi_del_giorno(ICS, date(2026, 11, 7))
    assert [e["titolo"] for e in ev] == ["Compleanno Marco", "Palestra", "Dentista"], ev
    assert ev[2] == {"ora": "10:30", "fine": "11:30", "titolo": "Dentista", "luogo": "Via Roma 1"} and ev[0]["ora"] == ""
    assert fonti.eventi_del_giorno(ICS, date(2026, 11, 9)) == []
    assert fonti.calendari("https://a/basic.ics, https://b/basic.ics\nhttp://no") == ["https://a/basic.ics", "https://b/basic.ics"]
    ics2 = ICS.replace("PRODID:-//test//", "PRODID:-//test//\nX-WR-CALNAME:Stostudio")
    assert [e["titolo"] for e in fonti.eventi_del_giorno(ics2, date(2026, 11, 7), etichetta=True)][-1] == "[Stostudio] Dentista"
    fonti.calendario_ics = lambda url, cache_dir: ics2 if "b/" in url else ICS
    tutti = fonti.eventi_di_oggi("https://a/basic.ics https://b/basic.ics", date(2026, 11, 7), DATA)
    assert len(tutti) == 6 and tutti[0]["ora"] == "" and "[Stostudio]" in str(tutti)
    # 4. email non lette: persone, in arrivo, ultime 48 ore, non mie
    dbp = DATA / "postino.db"
    postino_db(dbp, adesso)
    mails = fonti.email_non_lette(str(dbp), adesso)
    assert [m["oggetto"] for m in mails] == ["Preventivo video"], mails
    assert mails[0]["da"] == "Anna Rossi" and mails[0]["account"] == "ema@example.com"
    try:
        fonti.email_non_lette(str(DATA / "no.db"), adesso)
        raise SystemExit("db mancante doveva fallire")
    except RuntimeError:
        pass
    # 5. il brief completo, nell'ordine di Ema
    os.environ["KEEP_MCP_URL"] = "http://172.17.0.1:8765/x/mcp"
    keep.note = fake_note
    sess = [{"nome": "VIDEO MATCH", "stato": "aspetta Ema", "domanda_per_ema": "posso fare il test render?"}, {"nome": "ALTRA", "stato": "in corso"}]
    t = brief.costruisci(adesso, server.MEMORIA, sess, [], [], calendario=ev, email=mails)
    blocks = t.split("\n\n")
    assert blocks[0] == "<b>Sabato 7 novembre</b>"
    assert blocks[1].startswith("<b>Calendario</b>\n• tutto il giorno  Compleanno Marco\n• 09:00–09:30  Palestra\n• 10:30–11:30  Dentista · Via Roma 1"), blocks[1]
    assert blocks[2] == "<b>Oggi</b>\n• Chiamare riparazione VHS\n• Spedire lettore a Pablo"
    assert blocks[3] == "<b>Se hai tempo</b>\n• Bolletta Gera\n• Satispay\n• 2FA GitHub"
    assert blocks[4] == "<b>Claude aspetta te</b>\n• VIDEO MATCH: posso fare il test render?"
    assert blocks[5] == "<b>Email da leggere</b>\n• Anna Rossi: Preventivo video" and len(blocks) == 6, t
    assert "#iphone5c" not in t and "Spesa" not in t
    # senza calendario e senza email configurati, quei blocchi non compaiono; con liste vuote dicono "niente"
    t2 = brief.costruisci(adesso, server.MEMORIA, [], [], [], calendario=[], email=[])
    assert "Niente in programma" in t2 and "Nessuna email importante" in t2 and "aspetta te" not in t2
    t3 = brief.costruisci(adesso, server.MEMORIA, [], [], [])
    assert "Calendario" not in t3 and "Email" not in t3 and "<b>Oggi</b>" in t3
    # Keep rotto: il brief parte lo stesso e lo dice in fondo
    keep.note = lambda title: (_ for _ in ()).throw(RuntimeError("Keep: nessuna risposta"))
    t4 = brief.costruisci(adesso, server.MEMORIA, sess, [], [], calendario=ev, email=mails, note=["calendario non letto: x"])
    assert "<b>Sabato" in t4 and "VIDEO MATCH" in t4 and t4.endswith("<i>calendario non letto: x · Keep non letto: Keep: nessuna risposta</i>")
    keep.note = fake_note
    assert "<b>Oggi</b>" in server.brief_testo()
    # 6. quando mandarlo
    assert brief.dovuto(datetime(2026, 11, 7, 7, 30), "07:30", "") is True
    assert brief.dovuto(datetime(2026, 11, 7, 7, 29), "07:30", "") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "07:30", "2026-11-07") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "07:30", "2026-11-06") is True
    assert brief.dovuto(datetime(2026, 11, 7, 12, 1), "07:30", "") is False
    assert brief.dovuto(datetime(2026, 11, 7, 9, 0), "", "") is False and brief.dovuto(datetime(2026, 11, 7, 9, 0), "boh", "") is False
    print("BRIEF OK")


if __name__ == "__main__":
    main()
