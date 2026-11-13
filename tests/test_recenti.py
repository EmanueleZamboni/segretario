"""Le chat recenti (13/11/2026): aperture segnate, unione con sessioni e progetti, indirizzi per l'estensione.
Esegui: python tests/test_recenti.py"""

import os
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-rec-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "localhost", "SEGRETARIO_EXTRA_HOSTS": "testserver",
                   "SEGRETARIO_PUBLIC_PREFIX": "", "TELEGRAM_BOT_TOKEN": "", "WHATSAPP_TOKEN": "", "KEEP_MCP_URL": ""})

from starlette.testclient import TestClient  # noqa: E402

import recenti  # noqa: E402
import server  # noqa: E402

CHAT = "https://claude.ai/chat/0b9c1d2e-1111-2222-3333-444455556666"
CODE = "claude://claude.ai/epitaxy/local_21cfb982-a7c1-46b4-8770-5c9727a7c6a1"


def main():
    # 1. solo link di claude.ai / dell'app Claude, solo i due tipi
    a = recenti.Aperte(DATA / "prova.json")
    n = a.segna([
        {"titolo": "Preventivo Careisgold", "tipo": "claude.ai", "link": CHAT, "quando": "2026-11-13 10:00"},
        {"titolo": "STOSTUDIO WEBSITE", "tipo": "claude code", "link": CODE, "quando": "2026-11-13 11:52", "in_corso": True},
        {"titolo": "phishing", "tipo": "claude.ai", "link": "https://evil.example/chat/abcdefgh"},
        {"titolo": "x", "tipo": "altro", "link": CHAT},
    ], "2026-11-13 12:00")
    assert n == 2, n
    a.segna([{"titolo": "", "tipo": "claude.ai", "link": CHAT, "quando": "2026-11-13 09:00"}], "2026-11-13 12:00")
    d = a.leggi()
    assert d[CHAT]["titolo"] == "Preventivo Careisgold" and d[CHAT]["visto"] == "2026-11-13 10:00", d[CHAT]  # non torna indietro

    # 2. un elenco solo: la chat con il suo stato nel Segretario, la sessione senza link, il progetto senza chat
    sessioni = [
        {"nome": "STOSTUDIO WEBSITE", "progetto": "Stostudio", "stato": "aspetta Ema", "dove_sono": "home nuova",
         "prossimo_passo": "Ema guarda", "domanda_per_ema": "Ti piace?", "aggiornato": "2026-11-13 11:50"},
        {"nome": "Lista musica", "progetto": "", "stato": "in corso", "dove_sono": "20 brani", "aggiornato": "2026-11-12 09:00"},
        {"nome": "Vecchia", "progetto": "", "stato": "finita", "dove_sono": "fatto", "aggiornato": "2026-11-01 09:00"},
    ]
    progetti = [{"id": "stostudio", "nome": "Stostudio", "stato": "aspetta Ema", "dove_sono": "call fatta", "prossimo_passo": "x", "aggiornato": "2026-11-13 12:39"},
                {"id": "easy-rave", "nome": "EASY RAVE", "stato": "in corso", "dove_sono": "guide online", "prossimo_passo": "y", "aggiornato": "2026-11-07 12:26"},
                {"id": "scambio", "nome": "Scambio", "stato": "in corso", "dove_sono": "", "prossimo_passo": "", "aggiornato": "2026-11-13 13:00"}]
    r = recenti.recenti(a.leggi(), sessioni, progetti)
    titoli = [x["titolo"] for x in r]
    assert titoli == ["STOSTUDIO WEBSITE", "Preventivo Careisgold", "Lista musica", "EASY RAVE"], titoli
    s = r[0]
    assert s["tipo"] == "claude code" and s["link"] == CODE and s["aspetta"] and s["domanda"] == "Ti piace?" and s["in_corso"], s
    assert r[2]["link"] == "" and r[3]["tipo"] == "progetto", r

    # 3. gli indirizzi per l'estensione: chiusi senza browser fidato, aperti con
    c = TestClient(server.app, base_url="http://testserver")
    assert c.get("/pagine/chat-recenti.json").status_code == 401
    assert c.post("/pagine/chat-aperta", json={"titolo": "x", "link": CHAT}).status_code == 401
    server._write_json(server.DATA / "dispositivi.json", {"fidato": {"dal": time.time()}})
    c.cookies.set(server.DEVICE_COOKIE, "fidato")
    r1 = c.post("/pagine/chat-aperta", json={"titolo": "Viaggio a Lanzarote", "link": CHAT})
    assert r1.status_code == 200 and r1.json()["segnate"] == 1, r1.text
    r2 = c.get("/pagine/chat-recenti.json")
    assert r2.status_code == 200 and r2.json()["chat"][0]["titolo"] == "Viaggio a Lanzarote", r2.text
    assert server.chat_aperte([{"titolo": "BUILDING SEGRETARIO", "tipo": "claude code", "link": CODE}])["segnate"] == 1
    assert any(x["link"] == CODE for x in server.chat_recenti(10))
    print("RECENTI OK")


if __name__ == "__main__":
    main()


def test_recenti():
    main()
