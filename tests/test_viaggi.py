"""Assistente di viaggio: link di Google Maps, orari, treni Trenitalia letti da una risposta finta (senza rete).
Esegui: python tests/test_viaggi.py"""

import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

import viaggi  # noqa: E402

ROMA = ZoneInfo("Europe/Rome")
SOLUZIONI = {"solutions": [{"solution": {
    "departureTime": "2026-11-13T11:10:00.000+01:00", "arrivalTime": "2026-11-13T13:21:00.000+01:00", "duration": "2h 11min",
    "price": {"amount": 12.95},
    "nodes": [
        {"origin": "Bologna Centrale", "destination": "Monselice", "departureTime": "2026-11-13T11:10:00.000+01:00",
         "arrivalTime": "2026-11-13T12:26:00.000+01:00", "train": {"acronym": "RV", "name": "3994"}},
        {"origin": "Monselice", "destination": "Legnago", "departureTime": "2026-11-13T12:39:00.000+01:00",
         "arrivalTime": "2026-11-13T13:21:00.000+01:00", "train": {"acronym": "RE", "name": "16948"}}]}}]}


def finto(request: httpx.Request) -> httpx.Response:
    if request.url.path.endswith("/locations/search"):
        nome = request.url.params["name"]
        return httpx.Response(200, json=[{"id": 1 if "Bologna" in nome else 2, "displayName": nome}])
    assert request.url.path.endswith("/ticket/solutions") and b'"departureLocationId": 1' in request.content.replace(b'":1', b'": 1')
    return httpx.Response(200, json=SOLUZIONI)


def main():
    assert viaggi.link_maps("Via Zamboni 33, Bologna", "Legnago") == (
        "https://www.google.com/maps/dir/?api=1&origin=Via%20Zamboni%2033%2C%20Bologna&destination=Legnago&travelmode=transit")
    ora = datetime(2026, 11, 12, 18, 0, tzinfo=ROMA)
    assert viaggi.quando_iso("", ora) == "2026-11-12T18:00:00.000"
    assert viaggi.quando_iso("09:30", ora) == "2026-11-13T09:30:00.000"   # già passato oggi: domani
    assert viaggi.quando_iso("20:15", ora) == "2026-11-12T20:15:00.000"
    assert viaggi.quando_iso("2026-11-20 08:00", ora) == "2026-11-20T08:00:00.000"

    vero = viaggi._client
    viaggi._client = lambda: httpx.Client(transport=httpx.MockTransport(finto))
    try:
        r = viaggi.treni("Bologna", "Legnago", "2026-11-13 09:00", adesso=ora)
    finally:
        viaggi._client = vero
    s = r["soluzioni"][0]
    assert r["da"] == "Bologna" and s["parte"] == "11:10" and s["arriva"] == "13:21" and s["cambi"] == 1, r
    assert s["tratte"][0] == "RV 3994: Bologna Centrale 11:10 → Monselice 12:26" and s["prezzo_da"] == "12.95 €", s
    print("VIAGGI OK")


if __name__ == "__main__":
    main()


def test_viaggi():
    main()
