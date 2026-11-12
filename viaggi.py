"""Assistente di viaggio (12/11/2026, richiesta rbc243f): da dove sono a dove vado, treni e bus.

Ema NON vuole un'app che lo traccia: manda uno screenshot della sua posizione (o scrive dov'è) e Claude ricava
l'indirizzo. Qui:
- il link di Google Maps con il percorso coi mezzi pubblici (bus, treni, a piedi): lo apre sul telefono;
- i treni veri di Trenitalia (orari, cambi, prezzo) dalla ricerca pubblica di lefrecce.it, la stessa del sito;
- cosa scegliere nell'app Trenitalia. Il biglietto lo paga SEMPRE Ema nell'app, con l'impronta: qui non si compra niente.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo

import httpx

BASE = "https://www.lefrecce.it/Channels.Website.BFF.WEB/website"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
ROMA = ZoneInfo("Europe/Rome")


def link_maps(partenza: str, arrivo: str, mezzo: str = "transit") -> str:
    """Google Maps, percorso da partenza ad arrivo. mezzo: transit (bus e treni), walking, driving, bicycling."""
    q = {"api": "1", "origin": partenza.strip(), "destination": arrivo.strip(),
         "travelmode": mezzo if mezzo in ("transit", "walking", "driving", "bicycling") else "transit"}
    return "https://www.google.com/maps/dir/?" + urlencode(q, quote_via=quote)


def _client() -> httpx.Client:
    return httpx.Client(timeout=20, headers={"User-Agent": UA, "Accept": "application/json"})


def stazione(nome: str, c: httpx.Client | None = None) -> dict:
    """La stazione Trenitalia che corrisponde meglio a `nome` (città o stazione)."""
    own = c is None
    c = c or _client()
    try:
        r = c.get(f"{BASE}/locations/search", params={"name": nome.strip()[:60], "limit": 5})
        r.raise_for_status()
        lista = r.json() or []
    finally:
        if own:
            c.close()
    if not lista:
        raise ValueError(f"nessuna stazione trovata per \"{nome}\"")
    return {"id": lista[0]["id"], "nome": lista[0].get("displayName") or lista[0].get("name"),
            "altre": [x.get("displayName") or x.get("name") for x in lista[1:4]]}


def quando_iso(quando: str, adesso: datetime | None = None) -> str:
    """'' = adesso; '2026-11-13 09:00', '2026-11-13T09:00', '09:30' (oggi, o domani se è già passato)."""
    adesso = adesso or datetime.now(ROMA)
    s = (quando or "").strip().replace("T", " ")
    if not s:
        t = adesso
    elif len(s) <= 5 and ":" in s:
        h, m = (int(x) for x in s.split(":"))
        t = adesso.replace(hour=h, minute=m, second=0, microsecond=0)
        if t < adesso - timedelta(minutes=5):
            t += timedelta(days=1)
    else:
        t = datetime.fromisoformat(s)
    return t.strftime("%Y-%m-%dT%H:%M:00.000")


def _ora(s: str) -> str:
    return (s or "")[11:16]


def treni(da: str, a: str, quando: str = "", quanti: int = 6, adesso: datetime | None = None) -> dict:
    """Le soluzioni Trenitalia da `da` ad `a` a partire da `quando`, come le mostra il sito."""
    with _client() as c:
        s1, s2 = stazione(da, c), stazione(a, c)
        corpo = {"departureLocationId": s1["id"], "arrivalLocationId": s2["id"],
                 "departureTime": quando_iso(quando, adesso), "adults": 1, "children": 0,
                 "criteria": {"frecceOnly": False, "regionalOnly": False, "noChanges": False,
                              "order": "DEPARTURE_DATE", "limit": max(1, min(int(quanti), 10)), "offset": 0},
                 "advancedSearchRequest": {"bestFare": False}}
        r = c.post(f"{BASE}/ticket/solutions", json=corpo, headers={"Content-Type": "application/json"})
        r.raise_for_status()
        j = r.json()
    out = []
    for x in j.get("solutions") or []:
        so = x.get("solution") or {}
        tratte = []
        for n in so.get("nodes") or []:
            tr = n.get("train") or {}
            tratte.append(f"{tr.get('acronym') or tr.get('trainCategory') or 'treno'} {tr.get('name') or ''}".strip()
                          + f": {n.get('origin')} {_ora(n.get('departureTime'))} → {n.get('destination')} {_ora(n.get('arrivalTime'))}")
        prezzo = (so.get("price") or {}).get("amount")
        out.append({"parte": _ora(so.get("departureTime")), "arriva": _ora(so.get("arrivalTime")),
                    "giorno": (so.get("departureTime") or "")[:10], "durata": so.get("duration"),
                    "cambi": max(0, len(so.get("nodes") or []) - 1), "tratte": tratte,
                    "prezzo_da": f"{prezzo:.2f} €" if isinstance(prezzo, (int, float)) else "non in vendita online"})
    return {"da": s1["nome"], "a": s2["nome"], "soluzioni": out,
            "altre_stazioni_simili": {"da": s1["altre"], "a": s2["altre"]}}
