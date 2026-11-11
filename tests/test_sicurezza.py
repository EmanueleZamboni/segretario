"""Le protezioni dell'11/11: interruttore (blocco), guardia sugli indirizzi, login OAuth con il codice Telegram,
manuale non riscrivibile, approvazione usa-e-getta, WhatsApp e Keep girati dal Segretario. Senza rete.
Esegui: python tests/test_sicurezza.py"""

import asyncio
import base64
import hashlib
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-sic-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "localhost", "SEGRETARIO_EXTRA_HOSTS": "testserver",
                   "SEGRETARIO_PUBLIC_PREFIX": "", "TELEGRAM_BOT_TOKEN": "TOKEN", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "",
                   "SEGRETARIO_OAUTH": "1", "WHATSAPP_TOKEN": "", "KEEP_MCP_URL": "", "SEGRETARIO_MCP_MAX_5MIN": "50"})

from mcp import types  # noqa: E402
from starlette.testclient import TestClient  # noqa: E402

import server  # noqa: E402
import telegram_bot  # noqa: E402

ANTHROPIC_IP = "160.79.104.10"


class FakeTelegram(telegram_bot.Telegram):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.calls = []

    def api(self, method, **params):
        self.calls.append((method, params))
        return {"message_id": len(self.calls)}

    def ultimo(self):
        return [p["text"] for m, p in self.calls if m == "sendMessage"][-1]


def tg(bot, testo):
    return bot.handle({"message": {"message_id": 1, "chat": {"id": 42}, "from": {"id": 42}, "text": testo}})


def mcp_post(c, body, token=None, ip=ANTHROPIC_IP):
    h = {"content-type": "application/json", "accept": "application/json, text/event-stream", "x-forwarded-for": ip,
         "host": "localhost"}
    if token:
        h["authorization"] = f"Bearer {token}"
    return c.post(f"/{server.secret}/mcp", content=json.dumps(body), headers=h)


INIT = {"jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}}}


def main():
    bot = FakeTelegram("TOKEN", DATA, server.make_bot("x").hooks, chat_id="42", daily_cap=50, pair_code="abc123")
    server.bot = bot
    with TestClient(server.app, base_url="http://localhost") as c:
        prove(bot, c, server.secret)
    print("SICUREZZA OK")


def prove(bot, c, s):

    # ---- 1. OAuth: senza token il connettore risponde 401 e dice dove trovare il login
    r = mcp_post(c, INIT)
    assert r.status_code == 401, r.status_code
    assert "resource_metadata" in r.headers.get("www-authenticate", ""), r.headers
    md = c.get("/.well-known/oauth-authorization-server").json()
    assert md["authorization_endpoint"].endswith("/authorize") and md["registration_endpoint"].endswith("/register")
    # registrazione: solo indirizzi di ritorno di claude.ai / claude.com
    bad = c.post("/register", json={"redirect_uris": ["https://evil.example/cb"], "client_name": "x",
                                    "token_endpoint_auth_method": "none", "grant_types": ["authorization_code", "refresh_token"]})
    assert bad.status_code == 400, bad.text
    # solo authorization_code: completato con refresh_token invece di rifiutare; il ritorno locale delle app desktop va bene
    ok1 = c.post("/register", json={"redirect_uris": ["http://localhost:33418/callback"], "client_name": "Claude Desktop",
                                    "token_endpoint_auth_method": "none", "grant_types": ["authorization_code"]})
    assert ok1.status_code == 201 and "refresh_token" in ok1.json()["grant_types"], ok1.text
    assert server._tentativi_reg[-1]["esito"] == 201 and server._tentativi_reg[-2]["esito"] == 400
    reg = c.post("/register", json={"redirect_uris": ["https://claude.ai/api/mcp/auth_callback"], "client_name": "Claude",
                                    "token_endpoint_auth_method": "none", "grant_types": ["authorization_code", "refresh_token"],
                                    "response_types": ["code"]})
    assert reg.status_code == 201, reg.text
    cid = reg.json()["client_id"]
    verifier = "v" * 64
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    a = c.get("/authorize", params={"response_type": "code", "client_id": cid, "redirect_uri": "https://claude.ai/api/mcp/auth_callback",
                                    "code_challenge": challenge, "code_challenge_method": "S256", "state": "st1"}, follow_redirects=False)
    assert a.status_code in (302, 307), a.text
    login = urlparse(a.headers["location"])
    assert login.path == "/accesso", login
    rid = parse_qs(login.query)["r"][0]
    page = c.get(f"/accesso?r={rid}")
    assert page.status_code == 200 and "/codice" in page.text and "frame-ancestors 'none'" in page.headers["content-security-policy"]
    # codice sbagliato: niente
    p = c.post("/accesso", data={"r": rid, "azione": "consenti", "codice": "000000"}, follow_redirects=False)
    assert p.status_code == 200 and "sbagliato" in p.text
    # da un altro sito: rifiutato (anche un sottodominio fratello), con o senza Sec-Fetch-Site
    p = c.post("/accesso", data={"r": rid, "azione": "consenti", "codice": "000000"}, headers={"origin": "https://evil.example"})
    assert p.status_code == 403
    p = c.post("/accesso", data={"r": rid, "azione": "consenti", "codice": "000000"},
               headers={"origin": "null", "sec-fetch-site": "same-site"})
    assert p.status_code == 403
    # il NOSTRO modulo: con no-referrer il browser manda Origin null, ma Sec-Fetch-Site dice same-origin
    p = c.post("/accesso", data={"r": rid, "azione": "consenti", "codice": "000000"},
               headers={"origin": "null", "sec-fetch-site": "same-origin"})
    assert p.status_code == 200 and "sbagliato" in p.text
    # il codice vero arriva SOLO da /codice su Telegram
    tg(bot, "/codice")
    code6 = bot.ultimo().split("<b>")[1].split("</b>")[0]
    p = c.post("/accesso", data={"r": rid, "azione": "consenti", "codice": code6}, follow_redirects=False)
    assert p.status_code == 303, p.text
    back = urlparse(p.headers["location"])
    assert back.netloc == "claude.ai" and parse_qs(back.query)["state"] == ["st1"]
    assert "Nuovo collegamento" in bot.ultimo()
    authcode = parse_qs(back.query)["code"][0]
    tok = c.post("/token", data={"grant_type": "authorization_code", "code": authcode, "client_id": cid, "code_verifier": verifier,
                                 "redirect_uri": "https://claude.ai/api/mcp/auth_callback"})
    assert tok.status_code == 200, tok.text
    access, refresh = tok.json()["access_token"], tok.json()["refresh_token"]
    again = c.post("/token", data={"grant_type": "authorization_code", "code": authcode, "client_id": cid, "code_verifier": verifier,
                                   "redirect_uri": "https://claude.ai/api/mcp/auth_callback"})
    assert again.status_code == 400, "un codice vale una volta sola"
    r = mcp_post(c, INIT, token=access)
    assert r.status_code == 200, (r.status_code, r.text[:200])
    assert mcp_post(c, INIT, token="falso").status_code == 401
    # rinnovo: ruota, il vecchio non vale più
    new = c.post("/token", data={"grant_type": "refresh_token", "refresh_token": refresh, "client_id": cid})
    assert new.status_code == 200, new.text
    assert c.post("/token", data={"grant_type": "refresh_token", "refresh_token": refresh, "client_id": cid}).status_code == 400
    access = new.json()["access_token"]
    assert mcp_post(c, INIT, token=access).status_code == 200
    assert len(server.PROVIDER.collegamenti()) == 1
    # nel file solo hash, mai i token
    raw = (DATA / "oauth.json").read_text()
    assert access not in raw and new.json()["refresh_token"] not in raw

    # ---- 2. guardia: il connettore usato fuori da Anthropic = qualcuno ha l'indirizzo -> spento tutto
    r = mcp_post(c, INIT, token=access, ip="203.0.113.7")
    assert r.status_code == 403 and server.BLOCCO.attivo
    assert "203.0.113.7" in bot.ultimo() and "SPENTO" in bot.ultimo()
    assert c.get("/blocco").json() == {"bloccato": True}
    assert mcp_post(c, INIT, token=access).status_code == 503, "da spento, anche Anthropic resta fuori"
    assert c.get(f"/{s}/hub").status_code == 503 and c.get("/health").status_code == 200
    # solo Ema riaccende, da Telegram
    tg(bot, "/riaccendi")
    assert not server.BLOCCO.attivo and "Riacceso" in bot.ultimo()
    assert mcp_post(c, INIT, token=access).status_code == 200

    # ---- 3. /spegni da Telegram, e il pulsante rosso nell'hub
    tg(bot, "/spegni")
    assert server.BLOCCO.attivo and c.get("/blocco").json()["bloccato"] is True
    tg(bot, "/riaccendi")
    server._write_json(server.DATA / "dispositivi.json", {"fidato": {"dal": time.time()}})
    c.cookies.set(server.DEVICE_COOKIE, "fidato")
    h = c.get(f"/{s}/hub")
    assert h.status_code == 200 and "Spegni tutto" in h.text and s[:6] not in h.text
    r = c.post(f"/{s}/hub", data={"azione": "spegni"})
    assert r.status_code == 503 and server.BLOCCO.attivo
    tg(bot, "/riaccendi")

    # ---- 4. troppe chiamate in 5 minuti -> spento
    for _ in range(60):
        r = mcp_post(c, INIT, token=access)
        if r.status_code == 503:
            break
    assert server.BLOCCO.attivo and "uso strano" in server.BLOCCO.stato["motivo"]
    tg(bot, "/riaccendi")
    server._finestra_mcp._t.clear()

    # ---- 5. Impostazioni: scollega le app e i browser
    m = c.get(f"/{s}/manager")
    assert "Sicurezza" in m.text and "Claude" in m.text
    m = c.post(f"/{s}/manager", data={"azione": "scollega_app"})
    assert "revocati" in m.text and server.PROVIDER.collegamenti() == []
    assert mcp_post(c, INIT, token=access).status_code == 401
    m = c.post(f"/{s}/manager", data={"azione": "scollega_browser"})
    assert c.get(f"/{s}/manager").status_code == 401, "il browser deve rifare il codice"

    # ---- 6. il manuale viene dal codice e nessuna chat lo riscrive
    server.progetto_segna("Segretario", tipo="codice")
    try:
        server.documento_salva("Segretario", "manuale-segretario", "ISTRUZIONI DELL'ATTACCANTE")
        raise SystemExit("il manuale non deve essere riscrivibile")
    except PermissionError:
        pass
    assert "Manuale del Segretario" in server.manuale()
    assert server.documento_leggi("Segretario", "manuale-segretario") == server.manuale()

    # ---- 7. approvare una regola: codice usa-e-getta da /approva, non più le 6 lettere del segreto
    pid = server.regola_proponi("Regola di prova")["id"]
    try:
        server.proposta_decidi(pid, True, s[:6])
        raise SystemExit("il vecchio codice fisso non deve funzionare")
    except PermissionError:
        pass
    tg(bot, "/approva")
    codice = bot.ultimo().split("<b>")[1].split("</b>")[0]
    assert server.proposta_decidi(pid, False, codice)["stato"] == "scartata"

    # ---- 8. WhatsApp e Keep passano dal Segretario (servizio finto)
    class Finto:
        nome = "WhatsApp"
        errore = ""
        nomi = {"list_chats"}

        def configurato(self):
            return True

        async def tools(self, forza=False):
            return [types.Tool(name="list_chats", description="chat", inputSchema={"type": "object", "properties": {}})]

        async def chiama(self, name, arguments):
            return types.CallToolResult(content=[types.TextContent(type="text", text=f"chiamato {name}")], isError=False)

    server.REMOTI[:] = [Finto()]
    nomi = {t.name for t in asyncio.run(server.mcp.list_tools())}
    assert "list_chats" in nomi and "memoria_leggi" in nomi
    out = asyncio.run(server.mcp.call_tool("list_chats", {}))
    assert out[0].text == "chiamato list_chats"


if __name__ == "__main__":
    main()
