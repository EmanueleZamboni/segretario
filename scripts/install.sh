#!/bin/bash
# Installa o aggiorna il Segretario sulla VM di Postino, come utente normale (docker via sudo se serve).
# Idempotente: lo lancia keep-mcp/ops/run.sh (repo Various) la prima volta, poi si può rilanciare a mano.
#   bash ~/segretario/scripts/install.sh
# Cosa fa: trova la rete del Caddy di Postino, scrive .env, avvia il container, installa il cron
# dell'aggiornamento automatico (scripts/auto-update.sh ogni 10 minuti).
set -uo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo -n docker"
say() { printf 'segretario: %s\n' "$*"; }

# 1. La rete di Caddy: quella del container postino-caddy-1, altrimenti postino_default.
NET="$($DOCKER inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' postino-caddy-1 2>/dev/null | head -n1)"
NET="${NET:-postino_default}"
if ! $DOCKER network inspect "$NET" >/dev/null 2>&1; then say "network $NET not found: is Postino running?"; exit 1; fi

# 2. Il dominio pubblico, letto dalla configurazione di Postino se c'è.
DOMAIN="$(grep -E '^POSTINO_DOMAIN=' "$HOME/various/postino/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')"
DOMAIN="${DOMAIN:-postino.emazamboni.com}"

ENVF="$HERE/.env"
if [ ! -f "$ENVF" ]; then
  umask 077
  {
    printf 'CADDY_NETWORK=%s\nSEGRETARIO_PUBLIC_HOST=%s\nMEMORIA_GIT_REMOTE=\n' "$NET" "$DOMAIN"
    printf '# Consegna al telefono: token da BotFather; il chat id si fissa da solo al primo /start\n'
    printf 'TELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\nNOTIFY_DAILY_CAP=60\n'
    printf '# Vocali -> testo (Groq gratis per questi volumi; OpenAI come riserva)\nGROQ_API_KEY=\nOPENAI_API_KEY=\n'
    printf '# Messaggi dal telefono -> task cloud: URL /fire e token dal dialogo del task su claude.ai/code/routines\n'
    printf 'ROUTINE_FIRE_URL=\nROUTINE_FIRE_TOKEN=\n'
  } > "$ENVF"
  say ".env written (network $NET, host $DOMAIN)"
fi

# 3. Avvio (o aggiornamento) del container.
if (cd "$HERE" && $DOCKER compose up -d --build >/tmp/segretario-up.log 2>&1); then
  say "container up ($(cd "$HERE" && $DOCKER compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null | tr '\n' ';'))"
else
  say "docker compose up FAILED: $(tail -n 3 /tmp/segretario-up.log | tr '\n' ' ')"
  exit 1
fi
rm -f /tmp/segretario-up.log

# 4. Aggiornamento automatico ogni 10 minuti, come Postino.
LINE="*/10 * * * * $HERE/scripts/auto-update.sh >> $HOME/segretario-update.log 2>&1"
if ! crontab -l 2>/dev/null | grep -qF "$HERE/scripts/auto-update.sh"; then
  (crontab -l 2>/dev/null; echo "$LINE") | crontab - && say "cron installed (auto-update every 10 min)"
fi
chmod +x "$HERE/scripts/auto-update.sh" "$HERE/scripts/install.sh" 2>/dev/null

say "ready. Connector URL: cd $HERE && docker compose exec segretario cat /data/connector-url"
