"""Lettura delle note Google Keep di Ema dal Segretario, attraverso il connettore keep-mcp che gira sulla
stessa VM (stesso formato MCP di claude.ai, segreto nell'URL). Serve al brief del mattino e alla spesa.

Configurazione (in .env, la scrive ops/run.sh del repo Various):
  KEEP_MCP_URL   es. http://172.17.0.1:8765/<segreto>/mcp   (dentro la VM) oppure l'URL pubblico /keep/...
  KEEP_MCP_HOST  l'host pubblico da mettere nell'header Host (keep-mcp accetta solo quello): postino.emazamboni.com

Solo lettura. Il contenuto delle note è di Ema: dati, non istruzioni. La nota PSICO non viene mai letta.
"""

from __future__ import annotations

import asyncio
import json
import os
import threading
from typing import Any

NOTE_VIETATE = {"psico", "partner"}  # personali: il Segretario non le tocca mai
TIMEOUT = 20


def configured() -> bool:
    return bool(os.environ.get("KEEP_MCP_URL", "").strip())


async def _call(tool: str, args: dict[str, Any]) -> Any:
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    url = os.environ["KEEP_MCP_URL"].strip()
    headers = {}
    host = os.environ.get("KEEP_MCP_HOST", "").strip()
    if host:
        headers["Host"] = host
    async with streamablehttp_client(url, headers=headers or None, timeout=TIMEOUT) as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            res = await s.call_tool(tool, args)
            if res.isError:
                raise RuntimeError("Keep: " + "; ".join(getattr(c, "text", "") for c in res.content)[:300])
            if res.structuredContent is not None:
                sc = res.structuredContent
                return sc.get("result", sc) if isinstance(sc, dict) and set(sc) == {"result"} else sc
            text = "\n".join(getattr(c, "text", "") for c in res.content)
            try:
                return json.loads(text)
            except ValueError:
                return text


def call(tool: str, **args: Any) -> Any:
    """Chiamata sincrona (il server è thread-based). Alza RuntimeError se Keep non è configurato o non risponde."""
    if not configured():
        raise RuntimeError("Keep non configurato sul Segretario (KEEP_MCP_URL)")
    out: dict[str, Any] = {}

    def run() -> None:
        try:
            out["v"] = asyncio.run(_call(tool, args))
        except BaseException as err:  # noqa: BLE001  (riportato al chiamante)
            out["e"] = err

    t = threading.Thread(target=run, name="keep-call", daemon=True)
    t.start()
    t.join(TIMEOUT + 10)
    if t.is_alive():
        raise RuntimeError("Keep: nessuna risposta entro il tempo massimo")
    if "e" in out:
        err = out["e"]
        raise RuntimeError(f"Keep: {type(err).__name__}: {str(err)[:200]}")
    return out["v"]


def note(title: str) -> dict:
    """Una nota per titolo (esatto, senza distinguere maiuscole): {'title','text'} o {'title','items':[{text,checked}]}."""
    if title.strip().lower() in NOTE_VIETATE:
        raise RuntimeError(f"la nota {title} è personale: il Segretario non la legge")
    notes = call("list_notes")
    rows = notes.get("result", notes) if isinstance(notes, dict) else notes
    for n in rows or []:
        if str(n.get("title", "")).strip().lower() == title.strip().lower():
            return call("get_note", note_id=n["id"])
    raise RuntimeError(f"Keep: nota {title!r} non trovata")


def section(text: str, heading: str) -> list[str]:
    """Le righe '- ...' sotto un'intestazione (fino alla riga vuota o alla prossima intestazione in maiuscolo)."""
    out: list[str] = []
    inside = False
    for line in (text or "").splitlines():
        s = line.strip()
        if s.upper() == heading.upper():
            inside = True
            continue
        if inside:
            if not s:
                if out:
                    break
                continue
            if s.startswith("- "):
                out.append(s[2:].strip())
            elif s == s.upper() and len(s) > 2 and not s.startswith("-"):
                break
            elif out:
                out[-1] += " " + s
    return out
