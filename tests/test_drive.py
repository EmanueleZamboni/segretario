"""Copia del backup su Google Drive: indirizzi ammessi, quando ritentare, e il giro completo con uno script finto."""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

import drive  # noqa: E402


def test_indirizzi():
    assert drive.valido("https://script.google.com/macros/s/AKfycbx123/exec")
    assert not drive.valido("https://evil.example/macros/s/x/exec")
    assert not drive.valido("https://script.google.com/macros/s/x/dev")
    assert not drive.valido("http://script.google.com/macros/s/x/exec")


def test_da_fare(tmp_path):
    s = drive.Stato(tmp_path / "drive.json")
    assert s.da_fare("segretario-2026-11-12.tar.gz.age")
    s.scrivi({"ultimo": "segretario-2026-11-12.tar.gz.age"})
    assert not s.da_fare("segretario-2026-11-12.tar.gz.age")
    s.scrivi({"tentato": "segretario-2026-11-13.tar.gz.age", "tentato_alle": 1000.0, "errore": "x"})
    assert not s.da_fare("segretario-2026-11-13.tar.gz.age", adesso=1000.0 + 600)
    assert s.da_fare("segretario-2026-11-13.tar.gz.age", adesso=1000.0 + 3700)
    assert oct(os.stat(tmp_path / "drive.json").st_mode & 0o777) in ("0o600", "0o666")  # 0o666 su Windows


def test_giro_completo(tmp_path, monkeypatch):
    f = tmp_path / "segretario-2026-11-12.tar.gz.age"
    f.write_bytes(b"age-encryption.org/v1\n" + os.urandom(3 * drive.PEZZO + 17))
    monkeypatch.setenv("DRIVE_BACKUP_URL", "https://script.google.com/macros/s/PROVA/exec")
    visto = {}

    def post(url, json=None, **kw):
        visto["richiesta"] = json
        return httpx.Response(200, json={"ok": True, "sessione": "https://www.googleapis.com/upload/drive/v3/files?upload_id=X"})

    def put(url, content=None, headers=None, **kw):
        visto["byte"] = b"".join(content)
        visto["headers"] = headers
        return httpx.Response(200, json={"id": "drive123"})

    monkeypatch.setattr(drive.httpx, "post", post)
    monkeypatch.setattr(drive.httpx, "put", put)
    assert drive.copia(f) == "drive123"
    assert visto["richiesta"] == {"nome": f.name, "dimensione": f.stat().st_size}
    assert visto["byte"] == f.read_bytes() and visto["headers"]["Content-Length"] == str(f.stat().st_size)


def test_sessione_non_google(tmp_path, monkeypatch):
    f = tmp_path / "segretario-2026-11-12.tar.gz.age"
    f.write_bytes(b"x")
    monkeypatch.setenv("DRIVE_BACKUP_URL", "https://script.google.com/macros/s/PROVA/exec")
    monkeypatch.setattr(drive.httpx, "post", lambda *a, **k: httpx.Response(200, json={"ok": True, "sessione": "https://evil.example/u"}))
    try:
        drive.copia(f)
    except RuntimeError as err:
        assert "Google" in str(err)
    else:
        raise AssertionError("doveva rifiutare")


def test_errore_dello_script(tmp_path, monkeypatch):
    f = tmp_path / "segretario-2026-11-12.tar.gz.age"
    f.write_bytes(b"x")
    monkeypatch.setenv("DRIVE_BACKUP_URL", "https://script.google.com/macros/s/PROVA/exec")
    monkeypatch.setattr(drive.httpx, "post", lambda *a, **k: httpx.Response(200, text="<html>login</html>"))
    try:
        drive.copia(f)
    except RuntimeError as err:
        assert "JSON" in str(err)
    else:
        raise AssertionError("doveva fallire")
    assert json.dumps({"a": 1})
