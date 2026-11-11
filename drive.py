"""Copia fuori dal server del backup cifrato: su Google Drive di Ema, cartella "Backup Segretario".

Nessuna chiave di Google sul server. Nell'account di Ema c'è un piccolo Apps Script (scripts/drive_backup.gs) pubblicato
come app web: il server gli chiede "voglio caricare segretario-AAAA-MM-GG.tar.gz.age, N byte"; lo script tiene in ordine
la cartella (30 file) e risponde con un indirizzo di caricamento di Google valido per QUEL file solo. Il server ci manda il
file, che è cifrato con la chiave pubblica di Ema: su Drive è illeggibile senza la sua chiave privata.

L'indirizzo dell'app web (DRIVE_BACKUP_URL) si incolla nelle Impostazioni > Backup.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

PREFISSO = "https://script.google.com/macros/s/"
UPLOAD = "https://www.googleapis.com/upload/drive/"
PEZZO = 1 << 20


def indirizzo() -> str:
    return os.environ.get("DRIVE_BACKUP_URL", "").strip()


def valido(u: str) -> bool:
    return u.startswith(PREFISSO) and u.split("?")[0].endswith("/exec") and " " not in u


def _leggi(file: Path):
    with open(file, "rb") as f:
        while True:
            b = f.read(PEZZO)
            if not b:
                return
            yield b


def copia(file: Path) -> str:
    """Carica `file` su Drive. Ritorna l'id del file su Drive; solleva RuntimeError con un motivo leggibile."""
    u = indirizzo()
    if not valido(u):
        raise RuntimeError("l'indirizzo dello script di Drive non è un'app web di script.google.com")
    dim = file.stat().st_size
    try:
        r = httpx.post(u, json={"nome": file.name, "dimensione": dim}, follow_redirects=True, timeout=90)
    except httpx.HTTPError as err:
        raise RuntimeError(f"script di Drive irraggiungibile: {type(err).__name__}") from None
    if r.status_code != 200:
        raise RuntimeError(f"script di Drive: HTTP {r.status_code}")
    try:
        j = r.json()
    except ValueError:
        raise RuntimeError("lo script di Drive non ha risposto JSON (è pubblicato con accesso \"Anyone\"?)") from None
    if not j.get("ok"):
        raise RuntimeError(f"script di Drive: {str(j.get('errore', '?'))[:150]}")
    sessione = str(j.get("sessione") or "")
    if not sessione.startswith(UPLOAD):
        raise RuntimeError("lo script non ha dato un indirizzo di caricamento di Google")
    try:
        r2 = httpx.put(sessione, content=_leggi(file), timeout=900,
                       headers={"Content-Length": str(dim), "Content-Type": "application/octet-stream"})
    except httpx.HTTPError as err:
        raise RuntimeError(f"caricamento interrotto: {type(err).__name__}") from None
    if r2.status_code not in (200, 201):
        raise RuntimeError(f"caricamento: HTTP {r2.status_code}")
    try:
        return str(r2.json().get("id") or "")
    except ValueError:
        return ""


class Stato:
    """/data/drive.json: l'ultimo file copiato e l'ultimo errore (per stato() e le Impostazioni)."""

    def __init__(self, path: Path):
        self.path = path

    def leggi(self) -> dict:
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def scrivi(self, d: dict) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def da_fare(self, nome: str, adesso: float | None = None) -> bool:
        """Copiare `nome`? Sì se non è già su Drive e l'ultimo tentativo fallito è di più di un'ora fa."""
        d = self.leggi()
        if d.get("ultimo") == nome:
            return False
        t = adesso if adesso is not None else time.time()
        return not (d.get("tentato") == nome and t - float(d.get("tentato_alle", 0)) < 3600)

    def descrivi(self) -> str:
        if not indirizzo():
            return "non collegato"
        d = self.leggi()
        s = f"{d['ultimo']} copiato il {d.get('quando', '?')}" if d.get("ultimo") else "ancora nessuna copia"
        if d.get("errore") and d.get("tentato") != d.get("ultimo"):
            s += f"; ultimo tentativo fallito: {d['errore']}"
        return s
