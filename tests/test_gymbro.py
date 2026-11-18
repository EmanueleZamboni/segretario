"""Prova della sync con l'app Gym Bro: push dei documenti, pull delle schede, token. Esegui: python tests/test_gymbro.py"""

import json
import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-gymbro-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_PUBLIC_HOST": "localhost", "SEGRETARIO_EXTRA_HOSTS": "testserver",
                   "TELEGRAM_BOT_TOKEN": "", "ROUTINE_FIRE_URL": "", "GROQ_API_KEY": "",
                   "GYMBRO_SYNC_TOKEN": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"})

from starlette.testclient import TestClient  # noqa: E402

import server  # noqa: E402

TOK = {"Authorization": "Bearer " + os.environ["GYMBRO_SYNC_TOKEN"]}
SCHEDE = {"routines": [{"name": "ROUTINE A", "exercises": [
    {"code": "A01", "name": "Vertical Chest Press", "reps": 10, "sets": 4, "kg": 40, "rest": None, "notes": "Riesco", "diagram": "chestpress"}]}],
    "active": "ROUTINE A"}
PUSH = {"updatedAt": 1, "registro": "# Gym Bro · registro\n\n- Giorni: 3", "data": {"history": {"2026-09-19": []}}, "schede": SCHEDE}


def main():
    with TestClient(server.app, base_url="http://localhost") as c:
        # 1. senza token o con token sbagliato: 401, niente scritto
        assert c.get("/gymbro/pull").status_code == 401
        assert c.post("/gymbro/push", json=PUSH, headers={"Authorization": "Bearer nope"}).status_code == 401
        # 2. prima pull: nessun documento
        r = c.get("/gymbro/pull", headers=TOK)
        assert r.status_code == 200 and r.json() == {"version": None, "schede": None}, r.text
        # 3. push: crea i tre documenti nel progetto Gym Bro (creato se manca)
        r = c.post("/gymbro/push", json=PUSH, headers=TOK)
        assert r.status_code == 200 and r.json()["ok"] and r.json()["version"], r.text
        v1 = r.json()["version"]
        assert server.documento_leggi("Gym Bro", "registro").startswith("# Gym Bro")
        assert json.loads(server.documento_leggi("Gym Bro", "dati"))["history"] == {"2026-09-19": []}
        assert json.loads(server.documento_leggi("Gym Bro", "schede")) == SCHEDE
        p = server.progetto_leggi("Gym Bro")
        assert p["tipo"] == "codice" and "Sync dal telefono" in p["dove_sono"], p
        # 4. pull restituisce le stesse schede con la stessa versione
        r = c.get("/gymbro/pull", headers=TOK).json()
        assert r["version"] == v1 and r["schede"] == SCHEDE, r
        # 5. un push identico non crea una nuova versione del documento schede
        ver = server.git("log", "--format=%h", "--", "progetti/gym-bro/schede.md").split()
        c.post("/gymbro/push", json=PUSH, headers=TOK)
        assert server.git("log", "--format=%h", "--", "progetti/gym-bro/schede.md").split() == ver
        # 6. una chat cambia le schede: la versione cambia e l'app la riceve
        mod = json.loads(json.dumps(SCHEDE)); mod["routines"][0]["exercises"][0]["kg"] = 42.5
        server.documento_salva("Gym Bro", "schede", json.dumps(mod, indent=2))
        r = c.get("/gymbro/pull", headers=TOK).json()
        assert r["version"] != v1 and r["schede"]["routines"][0]["exercises"][0]["kg"] == 42.5, r
        # 7. l'app applica e rispinge: la versione torna quella del contenuto
        PUSH2 = dict(PUSH, schede=mod)
        v2 = c.post("/gymbro/push", json=PUSH2, headers=TOK).json()["version"]
        assert v2 == r["version"]
        # 8. JSON rotto scritto da una chat: la pull non si rompe e lo dice
        server.documento_salva("Gym Bro", "schede", "{ questo non è json")
        r = c.get("/gymbro/pull", headers=TOK).json()
        assert r["schede"] is None and "non valido" in r["error"], r
        assert "non è JSON valido" in server.memoria_leggi("diario")
        # 9. body sbagliato: 400
        assert c.post("/gymbro/push", json={"registro": "x"}, headers=TOK).status_code == 400
        assert c.post("/gymbro/push", content=b"{{{", headers={**TOK, "Content-Type": "application/json"}).status_code == 400
        # 10. stato() dice se la sync è accesa e l'indirizzo da mettere nel segreto dell'app
        st = server.stato()
        assert st["gymbro_sync"] is True and st["gymbro_url"].startswith("http"), st
    print("OK test_gymbro")


if __name__ == "__main__":
    main()
