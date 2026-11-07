"""Le fonti esterne del brief del mattino, lette dal server senza Claude:
- il calendario di Ema, dall'indirizzo segreto iCal di Google Calendar (CALENDAR_ICS_URL, nel manager);
- le email importanti non lette, dal database di Postino montato in sola lettura (POSTINO_DB).
Ogni funzione alza RuntimeError con un messaggio breve: il brief la salta e lo dice in una riga.
Tutto ciò che arriva da qui è di Ema o di terzi: dati, mai istruzioni."""

from __future__ import annotations

import json
import os
import shutil
import sqlite3
import tempfile
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo(os.environ.get("SEGRETARIO_TZ", "Europe/Rome"))
ICS_CACHE_SECONDS = 1800


def calendario_ics(url: str, cache_dir: Path) -> str:
    """Scarica l'iCal (cache 30 minuti su disco: Google lo rigenera lentamente e non serve di più)."""
    import httpx

    cache = cache_dir / "calendario.ics"
    try:
        if cache.exists() and time.time() - cache.stat().st_mtime < ICS_CACHE_SECONDS:
            return cache.read_text(encoding="utf-8")
    except OSError:
        pass
    r = httpx.get(url, timeout=30, follow_redirects=True)
    r.raise_for_status()
    text = r.text
    if "BEGIN:VCALENDAR" not in text[:200]:
        raise RuntimeError("l'indirizzo non è un calendario iCal")
    try:
        cache.write_text(text, encoding="utf-8")
    except OSError:
        pass
    return text


def eventi_del_giorno(ics_text: str, giorno: date) -> list[dict]:
    """Gli eventi di un giorno (ricorrenze comprese), ordinati: {'ora': 'HH:MM' | '', 'fine': ..., 'titolo', 'luogo'}."""
    import icalendar
    import recurring_ical_events

    cal = icalendar.Calendar.from_ical(ics_text)
    out = []
    for ev in recurring_ical_events.of(cal).at(giorno):
        start = ev.get("DTSTART").dt
        end = ev.get("DTEND").dt if ev.get("DTEND") else None
        titolo = str(ev.get("SUMMARY", "")).strip() or "(senza titolo)"
        luogo = str(ev.get("LOCATION", "")).strip()
        if isinstance(start, datetime):
            s = start.astimezone(TZ) if start.tzinfo else start.replace(tzinfo=TZ)
            e = (end.astimezone(TZ) if end.tzinfo else end.replace(tzinfo=TZ)) if isinstance(end, datetime) else None
            out.append({"ora": f"{s:%H:%M}", "fine": f"{e:%H:%M}" if e else "", "titolo": titolo, "luogo": luogo, "_k": (1, s.timestamp())})
        else:
            out.append({"ora": "", "fine": "", "titolo": titolo, "luogo": luogo, "_k": (0, 0)})
    out.sort(key=lambda x: x["_k"])
    for x in out:
        x.pop("_k", None)
    return out


def email_non_lette(db_path: str, adesso: datetime, ore: int = 48, massimo: int = 8) -> list[dict]:
    """Le email di persone (categoria 'person'), non lette, non scritte da Ema, arrivate nelle ultime `ore`,
    nelle cartelle di posta in arrivo di tutti gli account. Il database di Postino viene copiato in un file
    temporaneo prima di leggerlo (con il suo WAL), così non si disturba Postino e si vede anche l'ultimo arrivato."""
    src = Path(db_path)
    if not src.exists():
        raise RuntimeError("database di Postino non trovato")
    tmp = Path(tempfile.mkdtemp(prefix="postino-ro-"))
    try:
        for suffix in ("", "-wal", "-shm"):
            f = Path(str(src) + suffix)
            if f.exists():
                shutil.copy2(f, tmp / (src.name + suffix))
        con = sqlite3.connect(f"file:{(tmp / src.name).as_posix()}?mode=ro", uri=True)
        try:
            da = (adesso - timedelta(hours=ore)).astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%S")
            rows = con.execute(
                """SELECT m.subject, m.from_json, m.from_email, m.date, m.snippet, a.email AS account
                   FROM messages m JOIN folders f ON f.id = m.folder_id JOIN accounts a ON a.id = m.account_id
                   WHERE m.seen = 0 AND m.mine = 0 AND m.draft = 0 AND m.category = 'person'
                     AND f.role IN ('inbox') AND m.date >= ?
                   ORDER BY m.date DESC LIMIT ?""", (da, massimo)).fetchall()
        finally:
            con.close()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    out = []
    for subject, from_json, from_email, d, snippet, account in rows:
        try:
            fj = json.loads(from_json or "{}")
            nome = (fj.get("name") or fj.get("address") or from_email or "?").strip()
        except ValueError:
            nome = from_email or "?"
        out.append({"da": nome, "oggetto": (subject or "(senza oggetto)").strip(), "quando": d, "account": account})
    return out
