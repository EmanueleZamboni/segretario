"""Riempie il server di sviluppo (tests/dev_server.cmd) con progetti e sessioni di esempio, per guardare il
cruscotto. Esegui: python tests/dev_seed.py"""

import asyncio

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

URL = "http://127.0.0.1:8766/devsecret-devsecret-devsecret-0000/mcp"


async def main():
    async with streamablehttp_client(URL) as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            await s.call_tool("progetto_segna", {"nome": "EASY RAVE", "tipo": "codice", "alias": "easyrave, rave",
                              "dove_sono": "Guide SEO online, footer pass pronto ma non applicato",
                              "prossimo_passo": "Applicare il footer e controllare Web Analytics", "stato": "in corso"})
            await s.call_tool("sessione_segna", {"nome": "EASY RAVE SEO/GEO blog", "dove_sono": "footer pass pronto, non applicato",
                              "prossimo_passo": "applicare il footer", "domanda_per_ema": "Ok il footer con i link alle guide?",
                              "stato": "aspetta Ema", "progetto": "EASY RAVE"})
            await s.call_tool("progetto_segna", {"nome": "Video Match", "tipo": "video", "alias": "video match video",
                              "dove_sono": "Script a metà: manca la parte PS2", "prossimo_passo": "Scrivere PS2 e outro", "stato": "in corso"})
            await s.call_tool("materiale_aggiungi", {"progetto": "Video Match", "titolo": "Script (Google Doc)",
                              "link": "https://docs.google.com/document/d/ABC123/edit"})
            await s.call_tool("sessione_segna", {"nome": "Script Video Match", "dove_sono": "intro e prima generazione scritte",
                              "prossimo_passo": "parte PS2", "stato": "in corso", "progetto": "Video Match"})
            await s.call_tool("progetto_segna", {"nome": "Stostudio sito", "tipo": "lavoro",
                              "dove_sono": "Pagina 'Dicono di noi' online", "stato": "in pausa"})
            await s.call_tool("progetto_segna", {"nome": "Lanzarote", "tipo": "vita",
                              "dove_sono": "Auto prenotata, voli da confermare", "prossimo_passo": "Confermare i voli", "stato": "aspetta Ema"})
            await s.call_tool("progetto_segna", {"nome": "Nokia N95 video", "tipo": "video", "dove_sono": "Pubblicato", "stato": "finito"})
            await s.call_tool("sessione_segna", {"nome": "Prenotazione auto Lanzarote", "dove_sono": "auto confermata",
                              "stato": "finita"})
            await s.call_tool("diario_scrivi", {"testo": "seed di prova per il cruscotto", "origine": "claude-code"})
            print("seed ok")


asyncio.run(main())
