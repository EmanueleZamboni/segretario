"""Prova del codice Telegram per cruscotto e manager (secondo fattore). Esegui: python tests/test_otp.py"""

import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-otp-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1", "SEGRETARIO_EXTRA_HOSTS": "testserver",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "SEGRETARIO_PUBLIC_PREFIX": ""})

from starlette.testclient import TestClient  # noqa: E402

import server  # noqa: E402
import telegram_bot  # noqa: E402


class FakeTelegram(telegram_bot.Telegram):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.calls = []

    def api(self, method, **params):
        self.calls.append((method, params))
        return {"message_id": len(self.calls)}


def main():
    s = server.secret
    # 1. senza Telegram: nessun secondo fattore possibile, la pagina si apre con il solo segreto
    c = TestClient(server.app, base_url="http://testserver")
    assert c.get(f"/{s}/manager").status_code == 200 and c.get(f"/{s}/cruscotto").status_code == 200
    # 2. con Telegram collegato: la pagina non manda MAI niente (è pubblica); il codice lo chiede Ema con /codice
    bot = FakeTelegram("TOKEN", DATA, server.make_bot("x").hooks, chat_id="42", daily_cap=50, pair_code="abc123")
    server.bot = bot
    os.environ["TELEGRAM_BOT_TOKEN"] = "TOKEN"  # così apply_config (dopo un salvataggio) tiene il bot finto
    c = TestClient(server.app, base_url="http://testserver")
    r = c.get(f"/{s}/manager")
    assert r.status_code == 401 and "/codice" in r.text and "Chiave Groq" not in r.text
    assert r.headers.get("x-robots-tag", "").startswith("noindex")
    for az in ("manda", "rimanda", "qualsiasi"):
        assert c.post(f"/{s}/manager", data={"azione": az}).status_code == 401
    assert not [1 for m, p in bot.calls if m == "sendMessage"], "la pagina non deve mandare codici, mai"
    # senza un codice chiesto da Ema, nessun codice è giusto
    assert c.post(f"/{s}/manager", data={"azione": "verifica", "codice": "000000"}).status_code == 401

    def chiedi():
        bot.handle({"message": {"message_id": 1, "chat": {"id": 42}, "from": {"id": 42}, "text": "/codice"}})
        last = [p for m, p in bot.calls if m == "sendMessage"][-1]
        assert "Codice per entrare" in last["text"] and last.get("parse_mode") == "HTML"
        return last["text"].split("<b>")[1].split("</b>")[0]

    code = chiedi()
    assert len(code) == 6 and code.isdigit()
    # 3. codice sbagliato, poi giusto: redirect, cookie, pagina aperta; il cookie vale anche per il cruscotto
    r = c.post(f"/{s}/manager", data={"azione": "verifica", "codice": "000000"})
    assert r.status_code == 401 and "sbagliato" in r.text
    r = c.post(f"/{s}/manager", data={"azione": "verifica", "codice": code}, follow_redirects=False)
    assert r.status_code == 303 and server.DEVICE_COOKIE in r.headers.get("set-cookie", "")
    assert "HttpOnly" in r.headers["set-cookie"] and f"Path={server.PUBLIC_PREFIX}/{s}" in r.headers["set-cookie"]
    assert c.get(f"/{s}/manager").status_code == 200 and "Vocali in testo" in c.get(f"/{s}/manager").text
    assert c.get(f"/{s}/cruscotto").status_code == 200
    # 4. il modulo del manager funziona ancora con il cookie
    r = c.post(f"/{s}/manager", data={"chiave": "BRIEF_ORA", "valore": "07:30", "azione": "salva"})
    assert r.status_code == 200 and "Riepilogo del mattino: salvata" in r.text
    # 5. un altro browser (senza cookie) resta fuori; il codice usato non vale più; dopo 5 errori serve un codice nuovo
    c2 = TestClient(server.app, base_url="http://testserver")
    assert c2.get(f"/{s}/manager").status_code == 401
    assert c2.get(f"/{s}/cruscotto.json").status_code == 401, "i dati della dashboard non si leggono senza codice"
    assert c.get(f"/{s}/cruscotto.json").status_code == 200
    assert c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": code}).status_code == 401
    new_code = chiedi()
    assert new_code != code
    for _ in range(5):
        c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": "111111"})
    assert c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": new_code}).status_code == 401, "5 tentativi poi basta"
    # 6. un altro /codice ne fa uno nuovo che funziona
    newest = chiedi()
    assert newest != new_code
    r = c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": newest}, follow_redirects=False)
    assert r.status_code == 303
    print("OTP OK")


if __name__ == "__main__":
    main()
