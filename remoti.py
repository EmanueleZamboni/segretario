"""WhatsApp e Keep passano dal Segretario: i loro strumenti compaiono nel connettore del Segretario, che li gira ai
servizi interni (stessa VM, rete dei container). Così su internet c'è UNA porta sola, quella del Segretario, con il
suo login; WhatsApp e Keep non hanno più un indirizzo pubblico da rubare.

Gli strumenti hanno gli stessi nomi di prima (list_chats, send_message, get_note, ...): le istruzioni restano valide.
"""

from __future__ import annotations

import os
import time
from typing import Callable

from mcp import ClientSession, types
from mcp.client.streamable_http import streamablehttp_client

CACHE_S = 300
TIMEOUT = 60


class Remoto:
    def __init__(self, nome: str, url: Callable[[], str], host: Callable[[], str] | None = None):
        self.nome = nome
        self._url = url
        self._host = host or (lambda: "")
        self._tools: list[types.Tool] = []
        self._t = 0.0
        self.nomi: set[str] = set()
        self.errore = ""

    def configurato(self) -> bool:
        return bool(self._url())

    def _headers(self) -> dict | None:
        h = self._host()
        return {"Host": h} if h else None

    async def tools(self, forza: bool = False) -> list[types.Tool]:
        if not self.configurato():
            return []
        if not forza and self._tools and time.time() - self._t < CACHE_S:
            return self._tools
        try:
            async with streamablehttp_client(self._url(), headers=self._headers(), timeout=20) as (r, w, _):
                async with ClientSession(r, w) as s:
                    await s.initialize()
                    res = await s.list_tools()
            # outputSchema tolto: il Segretario rigira solo il contenuto, non deve validarlo di nuovo
            self._tools = [t.model_copy(update={"outputSchema": None}) for t in res.tools]
            self.nomi = {t.name for t in self._tools}
            self._t = time.time()
            self.errore = ""
        except Exception as err:  # noqa: BLE001  (un servizio giù non deve spegnere gli altri strumenti)
            self.errore = f"{type(err).__name__}: {str(err)[:120]}"
        return self._tools

    async def chiama(self, name: str, arguments: dict) -> types.CallToolResult:
        async with streamablehttp_client(self._url(), headers=self._headers(), timeout=TIMEOUT) as (r, w, _):
            async with ClientSession(r, w) as s:
                await s.initialize()
                return await s.call_tool(name, arguments or {})


def whatsapp() -> Remoto:
    def url() -> str:
        tok = os.environ.get("WHATSAPP_TOKEN", "").strip()
        base = os.environ.get("WHATSAPP_INTERNO", "http://whatsapp:8787").rstrip("/")
        return f"{base}/mcp/{tok}" if tok else ""
    return Remoto("WhatsApp", url)


def keep() -> Remoto:
    return Remoto("Keep", lambda: os.environ.get("KEEP_MCP_URL", "").strip(), lambda: os.environ.get("KEEP_MCP_HOST", "").strip())
