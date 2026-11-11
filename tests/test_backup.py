"""Il backup cifrato: contiene memoria e WhatsApp (senza i media), si apre solo con la chiave privata, ne restano 7.
Esegui: python tests/test_backup.py"""

import io
import os
import sys
import tarfile
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from pyrage import decrypt, x25519  # noqa: E402

import backup  # noqa: E402


def main():
    ident = x25519.Identity.generate()
    os.environ["BACKUP_DESTINATARIO"] = str(ident.to_public())
    root = Path(tempfile.mkdtemp(prefix="segretario-bk-"))
    data, wa = root / "data", root / "wa"
    (data / "memoria" / "diario").mkdir(parents=True)
    (data / "memoria" / "diario" / "2026-11-11.md").write_text("- 22:00 prova riga del diario\n", encoding="utf-8")
    (data / "config.json").write_text('{"GROQ_API_KEY": "gsk_segreto"}', encoding="utf-8")
    (wa / "media").mkdir(parents=True)
    (wa / "store.db").write_bytes(b"SQLite format 3\0" + b"x" * 1000)
    (wa / "media" / "foto.jpg").write_bytes(b"JPEG" * 1000)
    out = backup.crea(data, wa, "segretario-2026-11-11")
    raw = out.read_bytes()
    assert b"prova riga" not in raw and b"gsk_segreto" not in raw, "il file deve essere cifrato"
    with tarfile.open(fileobj=io.BytesIO(decrypt(raw, [ident])), mode="r:gz") as tar:
        names = tar.getnames()
        diario = tar.extractfile("segretario/memoria/diario/2026-11-11.md").read().decode()
    assert "prova riga" in diario
    assert "whatsapp/store.db" in names and not any("media" in n for n in names), names
    assert not any(n.startswith("segretario/backup") for n in names), "un backup non contiene i backup"
    try:
        decrypt(raw, [x25519.Identity.generate()])
        raise SystemExit("un'altra chiave non deve aprirlo")
    except Exception as err:  # noqa: BLE001
        assert "SystemExit" not in type(err).__name__
    for d in range(1, 10):
        backup.crea(data, wa, f"segretario-2026-11-{d:02d}")
    assert len(backup.elenco(data)) == 7
    print("BACKUP OK")


if __name__ == "__main__":
    main()
