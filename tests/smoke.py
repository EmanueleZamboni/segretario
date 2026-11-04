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


async def run(url: str, data: Path) -> None:
    async with streamablehttp_client(url) as (read, write, _):
        async with ClientSession(read, write) as s:
            init = await s.initialize()
            instr = init.instructions or ""
            assert "REGOLE DI EMA" in instr and "Oggi è" in instr, instr[:200]
            print("initialize ok, istruzioni:", len(instr), "caratteri")
            tools = {t.name for t in (await s.list_tools()).tools}
            want = {"memoria_leggi", "memoria_cerca", "diario_scrivi", "regola_proponi", "nota_proponi",
                    "proposte_lista", "proposta_decidi", "sessione_segna", "sessioni_lista", "sessione_chiudi", "stato",
                    "richiesta_scrivi", "richiesta_chiudi"}
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
            r = await s.call_tool("proposta_decidi", {"id": pid, "approva": True})
            assert not r.isError, text(r)
            r = await s.call_tool("memoria_leggi", {"nome": "regole"})
            assert "Non proporre mai Obsidian" in text(r)
            r = await s.call_tool("nota_proponi", {"file": "persone", "testo": "Pablo · gli spedisce un lettore"})
            assert not r.isError, text(r)
            r = await s.call_tool("proposta_decidi", {"id": (r.structuredContent or json.loads(text(r)))["id"], "approva": False})
            assert "scartata" in text(r)

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
    assert len(commits) >= 9, commits
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
        asyncio.run(run(f"http://127.0.0.1:{PORT}/{secret}/mcp", data))
        print("SMOKE OK")
    finally:
        proc.terminate()
        proc.wait(timeout=10)


if __name__ == "__main__":
    main()
