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
    # 2. con Telegram collegato: la prima apertura manda il codice e chiede di scriverlo
    bot = FakeTelegram("TOKEN", DATA, server.make_bot("x").hooks, chat_id="42", daily_cap=50, pair_code="abc123")
    server.bot = bot
    os.environ["TELEGRAM_BOT_TOKEN"] = "TOKEN"  # così apply_config (dopo un salvataggio) tiene il bot finto
    c = TestClient(server.app, base_url="http://testserver")
    r = c.get(f"/{s}/manager")
    assert r.status_code == 401 and "6 cifre" in r.text and "Chiave Groq" not in r.text
    sent = [p["text"] for m, p in bot.calls if m == "sendMessage"]
    assert len(sent) == 1 and "Codice per aprire" in sent[0]
    code = sent[0].split("<b>")[1].split("</b>")[0]
    assert len(code) == 6 and code.isdigit()
    r2 = c.get(f"/{s}/cruscotto")
    assert r2.status_code == 401 and len(bot.calls) == 1, "entro un minuto non rimanda il codice"
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
    assert c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": code}).status_code == 401
    new_code = [p["text"] for m, p in bot.calls if m == "sendMessage"][-1].split("<b>")[1].split("</b>")[0]
    for _ in range(5):
        c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": "111111"})
    assert c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": new_code}).status_code == 401, "5 tentativi poi basta"
    # 6. "rimanda" genera un codice nuovo
    n = len(bot.calls)
    c2.post(f"/{s}/manager", data={"azione": "rimanda"})
    assert len(bot.calls) == n + 1
    newest = bot.calls[-1][1]["text"].split("<b>")[1].split("</b>")[0]
    assert newest != new_code
    r = c2.post(f"/{s}/manager", data={"azione": "verifica", "codice": newest}, follow_redirects=False)
    assert r.status_code == 303
    print("OTP OK")


if __name__ == "__main__":
    main()
