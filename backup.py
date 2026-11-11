"""Backup notturno cifrato del Segretario: la memoria, le impostazioni e la copia di WhatsApp in un unico file
.tar.gz.age, cifrato con la chiave PUBBLICA di Ema (age, X25519). Sul server non c'è niente che lo possa aprire:
la chiave privata ce l'ha solo Ema. Nessun file in chiaro passa dal disco (tar -> pipe -> cifratura).
Se ne tengono 7 nel volume; Ema scarica l'ultimo dalle Impostazioni (Sicurezza)."""

from __future__ import annotations

import os
import tarfile
import threading
from pathlib import Path

import pyrage
from pyrage import x25519

TENERE = 7
ESCLUSI = {"backup", "cache", "__pycache__"}
WA_ESCLUSI = {"media"}  # foto e video scaricati: si riprendono da WhatsApp, pesano troppo


def destinatario() -> str:
    return os.environ.get("BACKUP_DESTINATARIO", "").strip()


def cartella(data: Path) -> Path:
    d = data / "backup"
    d.mkdir(exist_ok=True)
    return d


def elenco(data: Path) -> list[Path]:
    d = data / "backup"
    return sorted(d.glob("segretario-*.tar.gz.age")) if d.exists() else []


def crea(data: Path, wa: Path | None, nome: str, lock: threading.Lock | None = None) -> Path:
    """Scrive data/backup/<nome>.tar.gz.age e tiene solo gli ultimi TENERE. `lock` = il lock della memoria (git)."""
    rec = destinatario()
    if not rec:
        raise RuntimeError("manca la chiave pubblica del backup (BACKUP_DESTINATARIO)")
    recipient = x25519.Recipient.from_str(rec)
    out = cartella(data) / f"{nome}.tar.gz.age"
    tmp = out.with_suffix(".tmp")
    r_fd, w_fd = os.pipe()
    errore: list[BaseException] = []

    def scrivi_tar() -> None:
        try:
            with os.fdopen(w_fd, "wb") as w, tarfile.open(fileobj=w, mode="w|gz") as tar:
                def filtro(base_esclusi):
                    def f(ti: tarfile.TarInfo):
                        parti = Path(ti.name).parts
                        return None if len(parti) > 1 and parti[1] in base_esclusi else ti
                    return f
                if lock is not None:
                    with lock:
                        tar.add(str(data), arcname="segretario", filter=filtro(ESCLUSI))
                else:
                    tar.add(str(data), arcname="segretario", filter=filtro(ESCLUSI))
                if wa is not None and wa.exists():
                    tar.add(str(wa), arcname="whatsapp", filter=filtro(WA_ESCLUSI))
        except BaseException as err:  # noqa: BLE001  (riportato sotto)
            errore.append(err)

    t = threading.Thread(target=scrivi_tar, name="backup-tar", daemon=True)
    t.start()
    with os.fdopen(r_fd, "rb") as r, open(tmp, "wb") as o:
        pyrage.encrypt_io(r, o, [recipient])
    t.join()
    if errore:
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f"backup non riuscito: {errore[0]}")
    os.chmod(tmp, 0o600)
    tmp.replace(out)
    for vecchio in elenco(data)[:-TENERE]:
        vecchio.unlink(missing_ok=True)
    return out
