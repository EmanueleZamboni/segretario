"""Prova dal vivo del Segretario: avvia server.py su una cartella temporanea e usa ogni tool
con il client MCP ufficiale, come farebbe Claude. Esegui: python tests/smoke.py"""

import asyncio
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

HERE = Path(__file__).resolve().parent.parent
PORT = 8799


def wait_health(url: str, seconds: int = 30) -> None:
    for _ in range(seconds * 4):
        try:
            with urllib.request.urlopen(url, timeout=1) as r:
                if r.status == 200:
                    return
        except Exception:
            time.sleep(0.25)
    raise SystemExit("il server non risponde su /health")


def text(result) -> str:
    return "\n".join(c.text for c in result.content if getattr(c, "text", None))


async def run(url: str, data: Path, secret: str) -> None:
    codice = secret[:6]
    async with streamablehttp_client(url) as (read, write, _):
        async with ClientSession(read, write) as s:
            init = await s.initialize()
            instr = init.instructions or ""
            assert "REGOLE DI EMA" in instr and "Oggi è" in instr, instr[:200]
            print("initialize ok, istruzioni:", len(instr), "caratteri")
            tools = {t.name for t in (await s.list_tools()).tools}
            want = {"memoria_leggi", "memoria_cerca", "diario_scrivi", "regola_proponi", "nota_proponi",
                    "proposte_lista", "proposta_decidi", "sessione_segna", "sessioni_lista", "sessione_chiudi", "stato",
                    "richiesta_scrivi", "richiesta_chiudi", "progetto_segna", "progetto_leggi", "progetti_lista",
                    "materiale_aggiungi", "documento_salva", "documento_leggi",
                    "instagram_chat_lista", "instagram_chat_leggi", "instagram_rispondi",
                    "brief_testo", "spesa_lista", "spesa_negozio",
                    "oggetto_segna", "oggetto_leggi", "oggetti_lista", "compito_assegna", "compiti_lista", "compito_chiudi",
                    "hub_link_aggiungi", "hub_link_togli", "manuale"}
            assert want <= tools, want - tools
            print("tool:", len(tools))

            r = await s.call_tool("diario_scrivi", {"testo": "prova smoke: bozza a Asia salvata, non inviata", "origine": "claude-code"})
            assert not r.isError, text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "diario"})
            assert "prova smoke" in text(r), text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "regole"})
            assert "Non dare mai per fatto" in text(r)
            r = await s.call_tool("memoria_cerca", {"testo": "keep"})
            hits = json.loads(text(r)) if text(r).startswith("[") else r.structuredContent
            assert hits and any("Keep" in h["testo"] for h in (hits if isinstance(hits, list) else hits.get("result", []))), text(r)

            r = await s.call_tool("regola_proponi", {"testo": "Non proporre mai Obsidian", "motivo": "Ema lo ha scartato il 3/11"})
            assert not r.isError, text(r)
            pid = (r.structuredContent or json.loads(text(r)))["id"]
            r = await s.call_tool("proposte_lista", {})
            assert pid in text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "regole"})
            assert "Obsidian" not in text(r), "la proposta non deve entrare prima dell'approvazione"
            r = await s.call_tool("proposta_decidi", {"id": pid, "approva": True, "codice": "sbagliato"})
            assert r.isError, "senza il codice giusto non si approva"
            r = await s.call_tool("proposta_decidi", {"id": pid, "approva": True, "codice": codice})
            assert not r.isError, text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "regole"})
            assert "Non proporre mai Obsidian" in text(r)
            r = await s.call_tool("nota_proponi", {"file": "persone", "testo": "Pablo · gli spedisce un lettore"})
            assert not r.isError, text(r)
            r = await s.call_tool("proposta_decidi", {"id": (r.structuredContent or json.loads(text(r)))["id"], "approva": False, "codice": codice})
            assert "scartata" in text(r)
            r = await s.call_tool("materiale_aggiungi", {"progetto": "Segretario", "titolo": "x", "link": "https://evil' onmouseover='1"})
            assert r.isError, "un link con apici non deve entrare"

            r = await s.call_tool("sessione_segna", {"nome": "EASY RAVE 2", "dove_sono": "footer pass pronto, non applicato",
                                                     "prossimo_passo": "applicare il footer", "domanda_per_ema": "ok il footer blu?",
                                                     "stato": "aspetta Ema", "progetto": "EASY RAVE"})
            assert not r.isError, text(r)
            r = await s.call_tool("sessione_segna", {"nome": "STOSTUDIO WEBSITE", "dove_sono": "pagina dicono di noi online"})
            r = await s.call_tool("sessioni_lista", {})
            lst = r.structuredContent.get("result") if r.structuredContent else json.loads(text(r))
            assert lst[0]["nome"] == "EASY RAVE 2" and lst[0]["stato"] == "aspetta Ema", lst
            r = await s.call_tool("sessione_chiudi", {"nome": "STOSTUDIO WEBSITE"})
            r = await s.call_tool("sessioni_lista", {})
            assert "STOSTUDIO" not in text(r)

            # progetti: registrazione, alias, materiali, documenti, contesto
            r = await s.call_tool("progetto_segna", {"nome": "Video Match", "tipo": "video", "alias": "video match video, videomatch",
                                                     "descrizione": "Video YouTube sulle generazioni di console", "dove_sono": "script a metà",
                                                     "prossimo_passo": "finire la parte PS2", "stato": "in corso"})
            assert not r.isError, text(r)
            r = await s.call_tool("materiale_aggiungi", {"progetto": "videomatch", "titolo": "Script (Google Doc)",
                                                         "link": "https://docs.google.com/document/d/ABC123/edit", "nota": "bozza"})
            assert not r.isError, text(r)
            script = "# Video Match\n\nINTRO\nQuando ero piccolo la PS2...\n" * 20
            r = await s.call_tool("documento_salva", {"progetto": "Video Match", "nome": "script", "testo": script})
            assert not r.isError, text(r)
            r = await s.call_tool("documento_salva", {"progetto": "Video Match", "nome": "script", "testo": script + "\nOUTRO\n"})
            d = r.structuredContent or json.loads(text(r))
            assert d["versioni"] == 2 and d["documento"] == "script.md", d
            r = await s.call_tool("documento_leggi", {"progetto": "il video match", "nome": "script"})
            assert "OUTRO" in text(r)
            r = await s.call_tool("documento_leggi", {"progetto": "video match", "nome": "script", "versioni_indietro": 1})
            assert "OUTRO" not in text(r) and "PS2" in text(r)
            r = await s.call_tool("diario_scrivi", {"testo": "scritta la parte PS2 dello script", "origine": "chat", "progetto": "video match"})
            assert "#video-match" in text(r), text(r)
            r = await s.call_tool("sessione_segna", {"nome": "Script Video Match", "dove_sono": "parte PS2 scritta",
                                                     "progetto": "Video Match", "stato": "in corso"})
            assert not r.isError, text(r)
            r = await s.call_tool("progetto_leggi", {"nome": "video match video"})
            p = r.structuredContent or json.loads(text(r))
            assert p["id"] == "video-match" and p["materiali"][0]["link"].startswith("https://docs.google.com") \
                and p["documenti"][0]["nome"] == "script.md" and any("PS2" in l for l in p["diario"]) \
                and p["sessioni"][0]["nome"] == "Script Video Match", p
            r = await s.call_tool("memoria_cerca", {"testo": "quando ero piccolo"})
            assert "progetti/video-match/script.md" in text(r), text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "progetti"})
            assert "## Video Match" in text(r) and "Script (Google Doc)" in text(r), text(r)
            r = await s.call_tool("progetti_lista", {})
            assert "Video Match" in text(r) and "Segretario" in text(r)
            r = await s.call_tool("nota_proponi", {"file": "progetti", "testo": "x"})
            assert r.isError, "progetti non si propone più"
            print("progetti ok")

            r = await s.call_tool("richiesta_scrivi", {"testo": "voglio un tool che legga la mia agenda", "contesto": "detto in vocale il 4/11"})
            assert not r.isError, text(r)
            rid = (r.structuredContent or json.loads(text(r)))["id"]
            r = await s.call_tool("memoria_leggi", {"nome": "richieste"})
            assert rid in text(r) and "[aperta]" in text(r), text(r)

            init2 = await s.initialize()
            assert "1 sessioni aspettano" in (init2.instructions or ""), init2.instructions[-200:]
            assert "1 richieste di miglioramento" in (init2.instructions or ""), init2.instructions[-200:]

            r = await s.call_tool("richiesta_chiudi", {"id": rid, "esito": "fatto: tool agenda_leggi", "stato": "fatta"})
            assert "fatta" in text(r), text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "richieste"})
            assert "[fatta]" in text(r) and "agenda_leggi" in text(r)

            r = await s.call_tool("stato", {})
            st = r.structuredContent or json.loads(text(r))
            assert st["sessioni_che_aspettano_ema"] == 1 and st["proposte_in_attesa"] == 0, st
            print("stato:", st)

    log = subprocess.run(["git", "log", "--oneline"], cwd=data / "memoria", capture_output=True, text=True).stdout
    commits = log.strip().splitlines()
    assert len(commits) >= 15, commits
    print("commit git:", len(commits))
    assert (data / "connector-url").read_text().startswith("https://127.0.0.1/segretario/")
    print("connector-url ok")


def main() -> None:
    data = Path(tempfile.mkdtemp(prefix="segretario-test-"))
    env = {**os.environ, "SEGRETARIO_DATA": str(data), "SEGRETARIO_PUBLIC_HOST": "127.0.0.1",
           "SEGRETARIO_EXTRA_HOSTS": f"127.0.0.1:{PORT},localhost:{PORT}", "PORT": str(PORT), "BIND": "127.0.0.1"}
    proc = subprocess.Popen([sys.executable, str(HERE / "server.py")], env=env)
    try:
        wait_health(f"http://127.0.0.1:{PORT}/health")
        secret = (data / "secret").read_text().strip()
        bad = urllib.request.Request(f"http://127.0.0.1:{PORT}/nonsecret/mcp", method="POST", data=b"{}")
        try:
            urllib.request.urlopen(bad)
            raise SystemExit("un percorso senza segreto NON deve rispondere")
        except urllib.error.HTTPError as e:
            assert e.code in (404, 405), e.code
        print("percorso sbagliato: 404 ok")
        asyncio.run(run(f"http://127.0.0.1:{PORT}/{secret}/mcp", data, secret))
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/{secret}/cruscotto", timeout=5) as r:
            html = r.read().decode("utf-8")
            csp = r.headers.get("Content-Security-Policy", "")
        assert r.status == 200 and "Claude Dashboard" in html and "EASY RAVE" in html and "ASPETTA TE" in html, html[:300]
        assert "default-src 'none'" in csp and "&#x27;" not in html.split("<style>")[0], "CSP e escaping"
        assert "Video Match" not in html, "un video non è un progetto Claude: non va sul cruscotto"
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/{secret}/cruscotto?tutti=1", timeout=5) as r:
            html_all = r.read().decode("utf-8")
        assert "Video Match" in html_all and "Tutti i progetti" in html_all
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/{secret}/cruscotto.json", timeout=5) as r:
            j = json.loads(r.read().decode("utf-8"))
        assert any(c["nome"] == "EASY RAVE" and c["aspetta"] for c in j["progetti"]), j["progetti"]
        assert all(c["tipo"] == "codice" for c in j["progetti"]), j["progetti"]
        print("cruscotto ok")
        print("SMOKE OK")
    finally:
        proc.terminate()
        proc.wait(timeout=10)


if __name__ == "__main__":
    main()
