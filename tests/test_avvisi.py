"""Gli avvisi di guasto/sicurezza su Telegram (12/11/2026): riavvii a raffica e modifiche al server non firmate.
Una volta sola per evento, al massimo 3 al giorno. Senza rete.
Esegui: python tests/test_avvisi.py"""

import json
import os
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
DATA = Path(tempfile.mkdtemp(prefix="segretario-avv-"))
DEP = Path(tempfile.mkdtemp(prefix="segretario-dep-"))
os.environ.update({"SEGRETARIO_DATA": str(DATA), "SEGRETARIO_DEPLOY_STATO": str(DEP), "TELEGRAM_BOT_TOKEN": "",
                   "WHATSAPP_TOKEN": "", "KEEP_MCP_URL": ""})

import server  # noqa: E402


def main():
    mandati = []
    server._avvisa_ema = lambda t: mandati.append(t)

    def attendi(n):
        for _ in range(50):
            if len(mandati) >= n:
                return
            time.sleep(0.02)

    # 1. una modifica di power-meter non firmata: nessun avviso; una al codice del server: un avviso, una volta sola
    (DEP / "various.json").write_text(json.dumps({"repo": "various", "nota": "in attesa di un commit firmato",
                                                  "attesa_server": False, "github": "aaa1111"}))
    server._controlla_aggiornamenti()
    time.sleep(0.1)
    assert mandati == [], mandati
    (DEP / "various.json").write_text(json.dumps({"repo": "various", "nota": "in attesa di un commit firmato",
                                                  "attesa_server": True, "github": "bbb2222"}))
    server._controlla_aggiornamenti()
    attendi(1)
    server._controlla_aggiornamenti()
    time.sleep(0.1)
    assert len(mandati) == 1 and "Postino" in mandati[0] and "NON è firmata" in mandati[0], mandati

    # 2. riavvii: sotto 5 in un'ora niente, da 5 in su un avviso (una volta per ora)
    adesso = server.now()
    server._write_json(DATA / "avvii.json", [{"avvio": adesso.strftime("%Y-%m-%d %H:%M:%S")}] * 4)
    server._controlla_avvii()
    time.sleep(0.1)
    assert len(mandati) == 1
    server._write_json(DATA / "avvii.json", [{"avvio": adesso.strftime("%Y-%m-%d %H:%M:%S")}] * 6)
    server._controlla_avvii()
    attendi(2)
    server._controlla_avvii()
    time.sleep(0.1)
    assert len(mandati) == 2 and "riavviato 6 volte" in mandati[1], mandati

    # 3. tetto: al massimo 3 al giorno in tutto
    for i in range(5):
        server._avviso_raro(f"prova {i}", "x")
    time.sleep(0.2)
    assert len(mandati) == 3, len(mandati)
    print("AVVISI OK")


if __name__ == "__main__":
    main()


def test_avvisi():
    main()
