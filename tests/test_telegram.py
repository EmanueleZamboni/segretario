"""Prova della logica Telegram senza rete: un bot con l'API finta riceve gli update come li manderebbe
Telegram e deve reagire nel modo giusto (un solo utente, comandi, proposte con bottoni, inoltro a Claude).
Esegui: python tests/test_telegram.py"""

import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-tg-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": ""})

import server  # noqa: E402  (avvia la memoria sulla cartella temporanea, non il server HTTP)
import telegram_bot  # noqa: E402


class FakeTelegram(telegram_bot.Telegram):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.calls = []

    def api(self, method, **params):
        self.calls.append((method, params))
        if method == "sendMessage":
            return {"message_id": len(self.calls)}
        return {}

    def download(self, file_id):
        return b"OggS fake"


def sent(bot):
    return [p["text"] for m, p in bot.calls if m == "sendMessage"]


def msg(from_id, text=None, **extra):
    m = {"from": {"id": from_id}, "chat": {"id": from_id, "type": "private"}}
    if text is not None:
        m["text"] = text
    m.update(extra)
    return {"update_id": 1, "message": m}


def main():
    fired = []
    hooks = dict(server.make_bot("x").hooks)  # gli stessi hook del server vero
    hooks["fire"] = lambda text: fired.append(text) or "https://claude.ai/code/session_test"
    hooks["transcribe"] = lambda data, name: "ricordami di comprare la tahina"
    bot = FakeTelegram("TOKEN", DATA, hooks, chat_id="", daily_cap=50)

    # 1. prima del /start tutto è ignorato; il primo /start fissa il chat id
    assert bot.handle(msg(999, "ciao")) == "ignorato" and sent(bot) == []
    assert bot.handle(msg(42, "/start")) == "collegato" and bot.chat_id == 42
    # 2. un altro utente è ignorato anche dopo
    assert bot.handle(msg(999, "/start")) == "ignorato"
    assert bot.handle(msg(999, "ciao")) == "ignorato"
    # 3. comandi
    assert bot.handle(msg(42, "/regole")) == "comando" and "Non dare mai per fatto" in sent(bot)[-1]
    assert bot.handle(msg(42, "/sessioni")) == "comando"
    assert bot.handle(msg(42, "/stato")) == "comando" and "regole" in sent(bot)[-1]
    # 4. testo -> Claude
    assert bot.handle(msg(42, "cosa ho domani?")) == "inoltrato"
    assert fired and "cosa ho domani?" in fired[-1] and "Ricevuto" in sent(bot)[-1]
    # 5. vocale -> trascrizione -> Claude
    assert bot.handle(msg(42, voice={"file_id": "f1", "duration": 12})) == "inoltrato"
    assert "Ho capito: ricordami" in sent(bot)[-2] and "tahina" in fired[-1]
    assert bot.handle(msg(42, voice={"file_id": "f2", "duration": 999})) == "troppo-lungo"
    # 6. proposta di regola -> bottoni -> approvazione via callback
    server.bot = bot
    prop = server.regola_proponi("Rispondi sempre in italiano su Telegram", "detto il 4/11")
    last_method, last_params = bot.calls[-1]
    assert last_method == "sendMessage" and "inline_keyboard" in last_params["reply_markup"]
    data = last_params["reply_markup"]["inline_keyboard"][0][0]["callback_data"]
    assert data == f"regola:{prop['id']}:si", data
    cq = {"update_id": 2, "callback_query": {"id": "cq1", "from": {"id": 42}, "data": data,
                                             "message": {"message_id": 7, "text": "Nuova regola proposta"}}}
    assert bot.handle(cq) == "approvata"
    assert "Rispondi sempre in italiano su Telegram" in server.memoria_leggi("regole")
    cq_bad = {"update_id": 3, "callback_query": {"id": "cq2", "from": {"id": 999}, "data": data}}
    assert bot.handle(cq_bad) == "ignorato"
    # 7. notify e limite giornaliero
    r = server.notify("Brief di prova")
    assert r["inviato"] and (DATA / "notify.log").exists()
    bot.state["sent"] = {next(iter(bot.state["sent"])): 50}
    try:
        server.notify("uno di troppo")
        raise SystemExit("il limite giornaliero non ha funzionato")
    except RuntimeError as err:
        assert "limite" in str(err)
    # 8. stato persistito e riletto
    bot2 = FakeTelegram("TOKEN", DATA, hooks)
    assert bot2.chat_id == 42
    print("TELEGRAM OK")


if __name__ == "__main__":
    main()
