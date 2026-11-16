"""Prova dei tool dell'area riservata STOSTUDIO senza rete: un finto Worker su localhost risponde come quello vero
(stesse rotte, stessa chiave x-riservato-key) e i tool del Segretario devono fare da ponte senza salvare niente.
Esegui: python tests/test_riservato.py"""

import json
import os
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-ris-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "", "RISERVATO_KEY": ""})

import server  # noqa: E402

KEY = "k" * 40
CALLS = []
VIDEOS = [{"id": "aaaa1111", "title": "Spot camion", "duration": "1:17"},
          {"id": "bbbb2222", "title": "Evento cavalli", "duration": "1:45"}]
LINKS = [{"token": "T" * 24, "name": "Prova", "created": 1763300000000, "expires": 1999999999999, "maxPlays": 3,
          "videos": ["aaaa1111"], "plays": {"aaaa1111": 1}, "revoked": False}]


class FakeWorker(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body):
        raw = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _ok(self):
        return self.headers.get("x-riservato-key") == KEY

    def do_GET(self):
        CALLS.append(("GET", self.path))
        if not self._ok():
            return self._send(404, {})
        if self.path == "/state":
            return self._send(200, {"ok": True, "videos": VIDEOS, "links": LINKS, "now": 1763300000000})
        return self._send(404, {})

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        CALLS.append(("POST", self.path, body))
        if not self._ok():
            return self._send(404, {})
        if self.path == "/create":
            return self._send(200, {"ok": True, "link": "https://example.test/l/xyz", "password": "abcd-efgh",
                                    "message": "Ciao Mario, ...\nPassword: abcd-efgh", "expires": 1763900000000})
        if self.path == "/revoke":
            return self._send(200, {"ok": True})
        return self._send(404, {})


def main():
    httpd = HTTPServer(("127.0.0.1", 0), FakeWorker)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    os.environ["RISERVATO_API_URL"] = f"http://127.0.0.1:{httpd.server_port}/"

    # 1. senza chiave: errore chiaro, nessuna chiamata
    try:
        server.riservato_video()
        raise SystemExit("senza RISERVATO_KEY doveva rifiutare")
    except RuntimeError as e:
        assert "RISERVATO_KEY" in str(e)
    assert not CALLS

    # 2. chiave sbagliata: il Worker risponde 404, il tool lo dice
    os.environ["RISERVATO_KEY"] = "sbagliata"
    try:
        server.riservato_video()
        raise SystemExit("chiave sbagliata doveva fallire")
    except RuntimeError as e:
        assert "rifiutata" in str(e)

    os.environ["RISERVATO_KEY"] = KEY
    vids = server.riservato_video()
    assert [v["titolo"] for v in vids] == ["Spot camion", "Evento cavalli"], vids

    # 3. link con un video scelto per titolo (parte del titolo, maiuscole indifferenti), visioni e giorni limitati
    CALLS.clear()
    out = server.riservato_link("Mario Rossi · Azienda", ["cavalli"], visioni=9, giorni=99)
    post = [c for c in CALLS if c[0] == "POST"][0]
    assert post[1] == "/create" and post[2]["videos"] == ["bbbb2222"], post
    assert post[2]["plays"] == 3 and post[2]["days"] == 30, post
    assert out["video"] == ["Evento cavalli"] and "Password" in out["messaggio"] and out["scade"], out

    # 4. senza video = tutti
    CALLS.clear()
    server.riservato_link("Anna")
    post = [c for c in CALLS if c[0] == "POST"][0]
    assert post[2]["videos"] == ["aaaa1111", "bbbb2222"], post

    # 5. video sconosciuto: errore con l'elenco, nessuna creazione
    CALLS.clear()
    try:
        server.riservato_link("Anna", ["inesistente"])
        raise SystemExit("video sconosciuto doveva fallire")
    except ValueError as e:
        assert "Spot camion" in str(e)
    assert not [c for c in CALLS if c[0] == "POST"]

    # 6. nome vuoto rifiutato
    try:
        server.riservato_link("   ")
        raise SystemExit("nome vuoto doveva fallire")
    except ValueError:
        pass

    # 7. lista e disattiva
    righe = server.riservato_link_lista()
    assert righe[0]["stato"] == "attivo" and righe[0]["visioni"] == {"Spot camion": "1/3"}, righe
    CALLS.clear()
    assert server.riservato_disattiva("T" * 24)["disattivato"] is True
    assert CALLS[-1][1] == "/revoke" and CALLS[-1][2] == {"token": "T" * 24}
    try:
        server.riservato_disattiva("x")
        raise SystemExit("token corto doveva fallire")
    except ValueError:
        pass

    # 8. niente password salvata nei dati del Segretario
    for f in DATA.rglob("*"):
        if f.is_file():
            assert "abcd-efgh" not in f.read_text(encoding="utf-8", errors="ignore"), f

    # 9. la chiave compare nelle Impostazioni e in stato()
    assert "RISERVATO_KEY" in server.CONFIG_KEYS
    assert any(k[0] == "RISERVATO_KEY" for k in server.MANAGER_KEYS)
    assert server._config_valida("RISERVATO_KEY", "corta") and server._config_valida("RISERVATO_KEY", KEY) is None
    httpd.shutdown()
    print("OK test_riservato")


if __name__ == "__main__":
    main()
