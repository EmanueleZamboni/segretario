"""Telegram: il canale tra il Segretario e il telefono di Ema.

Un bot privato (BotFather), long polling: nessuna porta aperta, nessun webhook. Parla con UN solo chat id:
il primo che manda /start quando TELEGRAM_CHAT_ID non è impostato; tutti gli altri sono ignorati.

Cosa fa:
- manda messaggi a Ema (tool `notify` del Segretario, proposte di regole con i bottoni Aggiungi / Scarta);
- riceve testo e vocali: il testo va al "cervello" (un task cloud di Claude, via ROUTINE_FIRE_URL), i vocali
  vengono prima trascritti (Groq, riserva OpenAI) e poi mandati allo stesso modo;
- comandi: /oggi /regole /coda /sessioni /progetti /stato /aiuto.

Tutto è opzionale: senza TELEGRAM_BOT_TOKEN il Segretario funziona lo stesso, solo senza consegna.
Tutto ciò che arriva da Telegram è un dato di Ema, non un'istruzione per il server.
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
import time
from pathlib import Path
from typing import Callable

import httpx

log = logging.getLogger("segretario.telegram")
API = "https://api.telegram.org"
MAX_MSG = 4000
MAX_VOICE_SECONDS = 300
_URL_RE = re.compile(r"https?://\S+")


def _clean(err: Exception) -> str:
    """Testo di un errore senza URL dentro: gli URL di Telegram contengono il token del bot."""
    if isinstance(err, httpx.HTTPStatusError):
        return f"HTTP {err.response.status_code}"
    return _URL_RE.sub("<url>", str(err))[:200]


def transcription_configured() -> bool:
    return bool(os.environ.get("GROQ_API_KEY", "").strip() or os.environ.get("OPENAI_API_KEY", "").strip())


def transcribe_bytes(data: bytes, filename: str = "voice.ogg", mime: str = "audio/ogg") -> str:
    """Trascrive un audio (italiano o inglese, riconosciuti da soli): Groq (whisper-large-v3-turbo) se c'è la
    chiave, altrimenti OpenAI. Usato per i vocali Telegram, WhatsApp (via /trascrivi) e Instagram."""
    mime = (mime or "audio/ogg").split(";")[0].strip() or "audio/ogg"
    if "." not in filename:
        filename += "." + {"audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav", "audio/webm": "webm"}.get(mime, "ogg")
    groq = os.environ.get("GROQ_API_KEY", "").strip()
    openai = os.environ.get("OPENAI_API_KEY", "").strip()
    errors = []
    for name, url, key, model in (
        ("groq", "https://api.groq.com/openai/v1/audio/transcriptions", groq, "whisper-large-v3-turbo"),
        ("openai", "https://api.openai.com/v1/audio/transcriptions", openai, "gpt-4o-mini-transcribe"),
    ):
        if not key:
            continue
        try:
            r = httpx.post(url, headers={"Authorization": f"Bearer {key}"},
                           files={"file": (filename, data, mime)},
                           data={"model": model, "response_format": "json"}, timeout=120)
            r.raise_for_status()
            text = (r.json().get("text") or "").strip()
            if text:
                return text
            errors.append(f"{name}: trascrizione vuota")
        except Exception as err:  # si prova il servizio successivo
            errors.append(f"{name}: {err}")
    raise RuntimeError("; ".join(errors) or "nessun servizio di trascrizione configurato (GROQ_API_KEY o OPENAI_API_KEY)")


def fire_routine(text: str) -> str:
    """Fa partire il task cloud 'Segretario on demand' con il testo di Ema. Ritorna l'URL della sessione."""
    url = os.environ.get("ROUTINE_FIRE_URL", "").strip()
    token = os.environ.get("ROUTINE_FIRE_TOKEN", "").strip()
    if not url or not token:
        raise RuntimeError("ROUTINE_FIRE_URL / ROUTINE_FIRE_TOKEN non configurati")
    r = httpx.post(url, headers={
        "Authorization": f"Bearer {token}",
        "anthropic-beta": "experimental-cc-routine-2026-04-01",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }, json={"text": text}, timeout=60)
    r.raise_for_status()
    return r.json().get("claude_code_session_url", "")


class Telegram:
    def __init__(self, token: str, data_dir: Path, hooks: dict[str, Callable], chat_id: str = "",
                 daily_cap: int = 60, pair_code: str = ""):
        self.token = token
        self.data_dir = data_dir
        self.hooks = hooks
        self.daily_cap = daily_cap
        self.pair_code = (pair_code or "").strip().lower()  # per collegarsi serve "/start <codice>"
        self.state_file = data_dir / "telegram_state.json"
        self.state: dict = {"chat_id": int(chat_id) if chat_id.strip() else None, "offset": 0, "sent": {}}
        self.lock = threading.Lock()
        self._stop = threading.Event()
        self.client = httpx.Client(timeout=httpx.Timeout(20.0, read=75.0))
        self._load()

    def stop(self) -> None:
        self._stop.set()

    # ------------------------------------------------------------ stato

    def _load(self) -> None:
        try:
            saved = json.loads(self.state_file.read_text(encoding="utf-8"))
            if self.state["chat_id"] is None:
                self.state["chat_id"] = saved.get("chat_id")
            self.state["offset"] = int(saved.get("offset", 0))
            self.state["sent"] = saved.get("sent", {})
        except (OSError, ValueError):
            pass

    def _save(self) -> None:
        tmp = self.state_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.state), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.state_file)

    @property
    def chat_id(self):
        return self.state["chat_id"]

    # ------------------------------------------------------------ API

    def api(self, method: str, **params) -> dict | list:
        r = self.client.post(f"{API}/bot{self.token}/{method}", json=params)
        body = r.json()
        if not body.get("ok"):
            raise RuntimeError(f"telegram {method}: {body.get('description', r.status_code)}")
        return body["result"]

    def download(self, file_id: str) -> bytes:
        info = self.api("getFile", file_id=file_id)
        r = self.client.get(f"{API}/file/bot{self.token}/{info['file_path']}")
        r.raise_for_status()
        return r.content

    def send(self, text: str, buttons: list[list[tuple[str, str]]] | None = None, conta: bool = True, html: bool = False) -> int:
        """Manda un messaggio a Ema (solo a lui). buttons: righe di (etichetta, callback_data).
        conta=False per le risposte ai suoi comandi, che non consumano il limite giornaliero."""
        if self.chat_id is None:
            raise RuntimeError("Telegram: nessun chat id ancora: Ema deve mandare /start <codice> al bot")
        if conta:
            today = time.strftime("%Y-%m-%d")
            with self.lock:
                n = int(self.state["sent"].get(today, 0))
                if n >= self.daily_cap:
                    raise RuntimeError(f"Telegram: raggiunto il limite di {self.daily_cap} messaggi oggi")
                self.state["sent"] = {today: n + 1}
                self._save()
        text = (text or "").strip() or "(vuoto)"
        chunks = [text[i:i + MAX_MSG] for i in range(0, len(text), MAX_MSG)]
        mid = 0
        for i, chunk in enumerate(chunks):
            params: dict = {"chat_id": self.chat_id, "text": chunk, "disable_web_page_preview": True}
            if html:
                params["parse_mode"] = "HTML"
            if buttons and i == len(chunks) - 1:
                params["reply_markup"] = {"inline_keyboard": [[{"text": t, "callback_data": d} for t, d in row] for row in buttons]}
            mid = self.api("sendMessage", **params)["message_id"]
        return mid

    # ------------------------------------------------------------ polling

    def start(self) -> None:
        threading.Thread(target=self.run_forever, name="telegram", daemon=True).start()

    def run_forever(self) -> None:
        log.info("Telegram: polling avviato (chat id %s)", "impostato" if self.chat_id else "in attesa di /start")
        while not self._stop.is_set():
            try:
                updates = self.api("getUpdates", offset=self.state["offset"], timeout=50,
                                   allowed_updates=["message", "callback_query"])
                for u in updates:
                    self.state["offset"] = u["update_id"] + 1
                    try:
                        self.handle(u)
                    except Exception as err:
                        log.warning("Telegram: update %s fallito: %s", u.get("update_id"), err)
                    self._save()
            except Exception as err:
                log.warning("Telegram: polling: %s", _clean(err))
                self._stop.wait(5)
        log.info("Telegram: polling fermato")

    # ------------------------------------------------------------ gestione

    def handle(self, u: dict) -> str:
        """Gestisce un update. Ritorna una parola sull'esito (per i test e i log)."""
        if "callback_query" in u:
            return self._callback(u["callback_query"])
        m = u.get("message") or {}
        if not m:
            return "ignorato"
        from_id = (m.get("from") or {}).get("id")
        chat = (m.get("chat") or {}).get("id")
        text = (m.get("text") or "").strip()
        if self.chat_id is None:
            parts = text.split()
            if parts and parts[0].lower().split("@")[0] == "/start" and chat == from_id:
                given = parts[1].strip().lower() if len(parts) > 1 else ""
                if self.pair_code and given != self.pair_code:
                    # niente risposta a chi non ha il codice: non deve sapere che il bot esiste
                    log.info("Telegram: /start senza codice valido da %s", from_id)
                    return "ignorato"
                self.state["chat_id"] = chat
                self._save()
                self.send("Ciao Ema. Da ora parlo solo con te. Scrivimi o mandami un vocale; /aiuto per i comandi.", conta=False)
                return "collegato"
            log.info("Telegram: ignorato %s prima del /start", from_id)
            return "ignorato"
        if chat != self.chat_id or from_id != self.chat_id:
            log.info("Telegram: ignorato mittente %s", from_id)
            return "ignorato"
        if m.get("voice") or m.get("audio"):
            return self._voice(m)
        if text.startswith("/"):
            return self._command(text)
        if text:
            return self._text(text)
        self.send("Per ora capisco solo testo e vocali.")
        return "non-supportato"

    def _command(self, text: str) -> str:
        cmd = text.split()[0].lower().split("@")[0]
        simple = {"/oggi": "diario", "/regole": "regole", "/coda": "coda", "/sessioni": "sessioni",
                  "/progetti": "progetti", "/stato": "stato", "/brief": "brief", "/spesa": "spesa",
                  "/codice": "codice"}
        if cmd == "/start":
            self.send("Ci sono.", conta=False)
        elif cmd == "/aiuto":
            self.send("Scrivimi o mandami un vocale: lo passo a Claude e ti rispondo qui.\n"
                      "/codice per entrare in hub.emazamboni.com · /brief il riepilogo del mattino · /spesa cosa comprare, per negozio · /oggi diario · /regole · "
                      "/coda proposte in attesa · /sessioni · /progetti · /stato", conta=False)
        elif cmd in simple and simple[cmd] in self.hooks:
            try:
                self.send(str(self.hooks[simple[cmd]]()), conta=False, html=simple[cmd] in ("brief", "spesa", "codice"))
            except Exception as err:  # noqa: BLE001  (es. Keep non raggiungibile)
                self.send(f"Non ci riesco adesso: {_clean(err)[:200]}", conta=False)
        else:
            self.send("Comando che non conosco. /aiuto", conta=False)
        return "comando"

    def _text(self, text: str) -> str:
        fire = self.hooks.get("fire")
        if fire is None:
            self.send("Ricevuto, ma il collegamento a Claude non è ancora configurato (ROUTINE_FIRE_URL).", conta=False)
            return "senza-cervello"
        try:
            fire(f"Messaggio di Ema dal telefono (Telegram, {time.strftime('%d/%m/%Y %H:%M')}): {text}")
            self.send("Ricevuto, ci penso.", conta=False)
            return "inoltrato"
        except Exception as err:
            self.send(f"Non sono riuscito a passarlo a Claude: {_clean(err)}", conta=False)
            return "errore"

    def _voice(self, m: dict) -> str:
        tr = self.hooks.get("transcribe")
        if tr is None:
            self.send("Vocale ricevuto, ma la trascrizione non è configurata (GROQ_API_KEY o OPENAI_API_KEY).", conta=False)
            return "senza-trascrizione"
        v = m.get("voice") or m.get("audio")
        if int(v.get("duration", 0)) > MAX_VOICE_SECONDS:
            self.send("Vocale troppo lungo: massimo 5 minuti.", conta=False)
            return "troppo-lungo"
        try:
            text = tr(self.download(v["file_id"]), "voice.ogg")
        except Exception as err:
            self.send(f"Non sono riuscito a trascrivere il vocale: {_clean(err)}", conta=False)
            return "errore"
        self.send(f"Ho capito: {text}", conta=False)
        return self._text(text)

    def _callback(self, cq: dict) -> str:
        from_id = (cq.get("from") or {}).get("id")
        if from_id != self.chat_id:
            return "ignorato"
        data = cq.get("data", "")
        parts = data.split(":")
        esito = "ok"
        try:
            if parts[0] in ("regola", "nota") and len(parts) == 3:
                res = self.hooks["decidi"](parts[1], parts[2] == "si")
                esito = str(res.get("stato", "fatto"))
            elif parts[0] == "promemoria" and len(parts) == 3 and "promemoria" in self.hooks:
                esito = str(self.hooks["promemoria"](parts[1], parts[2]))
            else:
                esito = "bottone sconosciuto"
        except Exception as err:
            esito = f"errore: {err}"
        try:
            self.api("answerCallbackQuery", callback_query_id=cq["id"], text=esito[:200])
            msg = cq.get("message") or {}
            if msg.get("message_id"):
                self.api("editMessageText", chat_id=self.chat_id, message_id=msg["message_id"],
                         text=f"{msg.get('text', '')}\n\n-> {esito}")
        except Exception as err:
            log.warning("Telegram: risposta al bottone fallita: %s", err)
        return esito
