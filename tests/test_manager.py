"""Prova del manager (chiavi senza terminale), di /trascrivi e dei vocali Instagram, senza rete.
Esegui: python tests/test_manager.py"""

import json
import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-mgr-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1", "SEGRETARIO_EXTRA_HOSTS": "testserver",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "OPENAI_API_KEY": "", "LINKS_STATS_KEY": ""})

from starlette.testclient import TestClient  # noqa: E402

import server  # noqa: E402
import telegram_bot  # noqa: E402


def main():
    c = TestClient(server.app, base_url="http://testserver")
    s = server.secret
    # 1. la pagina esiste solo con il segreto, non ha script, elenca le chiavi
    assert c.get("/nope/manager").status_code in (404, 405)
    r = c.get(f"/{s}/manager")
    assert r.status_code == 200 and "<script" not in r.text and "Chiave Groq" in r.text and "non impostata" in r.text
    assert "form-action 'self'" in r.headers["content-security-policy"]
    # 2. salvare una chiave dal modulo: validata, applicata, mai mostrata se è una password
    r = c.post(f"/{s}/manager", data={"chiave": "GROQ_API_KEY", "valore": "sbagliata", "azione": "salva"})
    assert "inizia con gsk_" in r.text and not os.environ.get("GROQ_API_KEY")
    r = c.post(f"/{s}/manager", data={"chiave": "GROQ_API_KEY", "valore": "gsk_provaprovaprova", "azione": "salva"})
    assert "Chiave Groq: salvata" in r.text and os.environ["GROQ_API_KEY"] == "gsk_provaprovaprova" and "gsk_prova" not in r.text
    assert json.loads((DATA / "config.json").read_text())["GROQ_API_KEY"] == "gsk_provaprovaprova"
    r = c.post(f"/{s}/manager", data={"chiave": "BRIEF_ORA", "valore": "07:30", "azione": "salva"})
    assert 'value="07:30"' in r.text and server.stato()["brief_ora"] == "07:30"
    r = c.post(f"/{s}/manager", data={"chiave": "BRIEF_ORA", "valore": "", "azione": "cancella"})
    assert "Brief del mattino: cancellata" in r.text and server.stato()["brief_ora"] == "spento"
    r = c.post(f"/{s}/manager", data={"chiave": "SEGRETARIO_SECRET", "valore": "x", "azione": "salva"})
    assert "chiave sconosciuta" in r.text
    # 3. /trascrivi: 503 senza chiave, poi il testo con un trascrittore finto
    os.environ.pop("GROQ_API_KEY")
    assert c.post(f"/{s}/trascrivi", content=b"OggS", headers={"content-type": "audio/ogg"}).status_code == 503
    os.environ["GROQ_API_KEY"] = "gsk_provaprovaprova"
    seen = []
    telegram_bot.transcribe_bytes = lambda data, filename="voice", mime="audio/ogg": seen.append((len(data), mime)) or "ci vediamo alle nove"
    r = c.post(f"/{s}/trascrivi", content=b"OggS fake", headers={"content-type": "audio/ogg; codecs=opus"})
    assert r.status_code == 200 and r.json() == {"testo": "ci vediamo alle nove"} and seen == [(9, "audio/ogg; codecs=opus")]
    assert c.post(f"/{s}/trascrivi", content=b"", headers={"content-type": "audio/ogg"}).status_code == 400
    # 4. vocali Instagram: l'allegato audio viene scaricato e trascritto una volta sola (cache per id)
    import httpx
    calls = []

    class FakeResp:
        content = b"AUDIO"
        headers = {"content-type": "audio/mp4"}

        def raise_for_status(self):
            pass

    httpx.get = lambda url, **kw: calls.append(url) or FakeResp()
    msgs = [{"id": "m1", "text": "", "attachments": [{"type": "audio", "mime": "audio/mp4", "url": "https://cdn/x.m4a"}]},
            {"id": "m2", "text": "ciao", "attachments": []}]
    server._ig_trascrivi(msgs)
    assert msgs[0]["vocale"] == "ci vediamo alle nove" and "vocale" not in msgs[1] and calls == ["https://cdn/x.m4a"]
    server._ig_trascrivi([{"id": "m1", "text": "", "attachments": [{"type": "audio", "url": "https://cdn/x.m4a"}]}])
    assert calls == ["https://cdn/x.m4a"], "la seconda volta viene dalla cache"
    assert json.loads((DATA / "ig_vocali.json").read_text())["m1"] == "ci vediamo alle nove"
    os.environ.pop("GROQ_API_KEY")
    m = [{"id": "m3", "text": "", "attachments": [{"type": "audio", "url": "https://cdn/y.m4a"}]}]
    server._ig_trascrivi(m)
    assert "manca la chiave Groq" in m[0]["vocale"] and calls == ["https://cdn/x.m4a"]
    print("MANAGER OK")


if __name__ == "__main__":
    main()
