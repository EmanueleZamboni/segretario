"""Il server deve partire anche con un token Telegram impostato (sul server vero c'è sempre): il bot viene costruito
all'import, quindi tutto ciò che i suoi hook usano deve essere definito prima. Il 7/11 un hook definito dopo ha fatto
andare il container in crash loop senza che nessun test lo vedesse. Esegui: python tests/test_avvio.py"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent


def main():
    env = dict(os.environ, SEGRETARIO_DATA=tempfile.mkdtemp(prefix="segretario-avvio-"), SEGRETARIO_PUBLIC_HOST="127.0.0.1",
               TELEGRAM_BOT_TOKEN="123456:fake-token", TELEGRAM_CHAT_ID="42", GROQ_API_KEY="x", LINKS_STATS_KEY="y",
               CALENDAR_ICS_URL="", POSTINO_DB="", KEEP_MCP_URL="")
    code = ("import server\n"
            "assert server.bot is not None, 'bot non costruito'\n"
            "for k in ('brief', 'spesa', 'codice', 'stato', 'diario'):\n"
            "    assert k in server.bot.hooks, k\n"
            "print('AVVIO OK')")
    out = subprocess.run([sys.executable, "-c", code], cwd=HERE, env=env, capture_output=True, text=True, timeout=60)
    assert out.returncode == 0 and "AVVIO OK" in out.stdout, out.stdout + out.stderr
    print("AVVIO OK")


if __name__ == "__main__":
    main()
