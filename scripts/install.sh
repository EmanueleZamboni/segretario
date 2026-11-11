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
SECRET="$(head -c 48 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n' | cut -c1-43)"
if [ ! -f "$ENVF" ]; then
  umask 077
  {
    printf 'CADDY_NETWORK=%s\nSEGRETARIO_PUBLIC_HOST=%s\nSEGRETARIO_SECRET=%s\nMEMORIA_GIT_REMOTE=\n' "$NET" "$DOMAIN" "$SECRET"
    printf '# Consegna al telefono: token da BotFather; il chat id si fissa da solo al primo /start\n'
    printf 'TELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\nNOTIFY_DAILY_CAP=60\n'
    printf '# Vocali -> testo (Groq gratis per questi volumi; OpenAI come riserva)\nGROQ_API_KEY=\nOPENAI_API_KEY=\n'
    printf '# Messaggi dal telefono -> task cloud: URL /fire e token dal dialogo del task su claude.ai/code/routines\n'
    printf 'ROUTINE_FIRE_URL=\nROUTINE_FIRE_TOKEN=\n'
  } > "$ENVF"
  say ".env written (network $NET, host $DOMAIN)"
fi

# 2b. WhatsApp (cartella whatsapp/): il suo segreto, generato una volta sola, e l'URL interno del
#     Segretario per trascrivere i vocali. Aggiunti anche a un .env già esistente, se mancano.
if ! grep -q '^WHATSAPP_TOKEN=' "$ENVF"; then
  WTOKEN="$(head -c 48 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n' | cut -c1-43)"
  (umask 077; printf '# WhatsApp: segreto nell'"'"'URL del connettore e della pagina /stato (generato una volta)\nWHATSAPP_TOKEN=%s\n' "$WTOKEN" >> "$ENVF")
  say "WHATSAPP_TOKEN added to .env"
fi
# Il container WhatsApp non deve conoscere il segreto del Segretario: per la trascrizione ha un token suo.
if ! grep -q '^TRASCRIVI_TOKEN=' "$ENVF"; then
  TTOKEN="$(head -c 48 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n' | cut -c1-43)"
  (umask 077; printf '# Vocali WhatsApp -> testo: token che serve SOLO alla trascrizione (generato una volta)\nTRASCRIVI_TOKEN=%s\n' "$TTOKEN" >> "$ENVF")
  say "TRASCRIVI_TOKEN added to .env"
fi
if grep -q '^SEGRETARIO_URL=' "$ENVF"; then
  sed -i '/^SEGRETARIO_URL=/d; /^# Vocali WhatsApp -> testo: il Segretario visto dal container whatsapp/d' "$ENVF"
  say "SEGRETARIO_URL (con il segreto) tolto da .env"
fi

# 2c. Il database di Postino per le email nel brief (sola lettura): la cartella data di Postino sulla stessa VM.
PDATA="$HOME/various/postino/data"
if [ -f "$PDATA/postino.db" ] && ! grep -q '^POSTINO_DATA_DIR=' "$ENVF"; then
  (umask 077; printf 'POSTINO_DATA_DIR=%s\nPOSTINO_DB=/postino/postino.db\n' "$PDATA" >> "$ENVF")
  say "POSTINO_DATA_DIR added to .env (email nel brief)"
fi

# 3. Avvio (o aggiornamento) del container. Se fallisce si va avanti lo stesso (cron e rapporto),
#    così il prossimo push può rimediare da solo e il motivo resta leggibile.
FAILED=0
if (cd "$HERE" && $DOCKER compose up -d --build >/tmp/segretario-up.log 2>&1); then
  say "container up ($(cd "$HERE" && $DOCKER compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null | tr '\n' ';'))"
else
  FAILED=1
  say "docker compose up FAILED: $(tail -n 3 /tmp/segretario-up.log | tr '\n' ' ')"
fi

# 4. Aggiornamento automatico ogni 10 minuti, come Postino.
LINE="*/10 * * * * $HERE/scripts/auto-update.sh >> $HOME/segretario-update.log 2>&1"
if ! crontab -l 2>/dev/null | grep -qF "$HERE/scripts/auto-update.sh"; then
  (crontab -l 2>/dev/null; echo "$LINE") | crontab - && say "cron installed (auto-update every 10 min)"
fi
chmod +x "$HERE/scripts/auto-update.sh" "$HERE/scripts/install.sh" 2>/dev/null

# 5. L'URL del connettore: nel rapporto del server (che Postino manda per email a Ema) e in un file locale.
SECRET="$(grep -E '^SEGRETARIO_SECRET=' "$ENVF" | cut -d= -f2-)"
if [ -n "$SECRET" ]; then
  URL="https://$DOMAIN/segretario/$SECRET/mcp"
  WTOKEN="$(grep -E '^WHATSAPP_TOKEN=' "$ENVF" | cut -d= -f2-)"
  (umask 077; {
    printf 'Connettore Claude (segreto, non condividere):\n%s\nCruscotto:\nhttps://%s/segretario/%s/cruscotto\n' "$URL" "$DOMAIN" "$SECRET"
    if [ -n "$WTOKEN" ]; then
      printf 'Connettore WhatsApp (segreto, non condividere):\nhttps://%s/whatsapp/mcp/%s\nPagina WhatsApp (stato, QR per collegare il telefono):\nhttps://%s/whatsapp/mcp/%s/stato\n' "$DOMAIN" "$WTOKEN" "$DOMAIN" "$WTOKEN"
    fi
  } > "$HERE/CONNECTOR_URL.txt")
  # L'URL non va mai su stdout: finirebbe nel rapporto che Postino manda per email e nel log del cron.
  say "connettore Claude pronto: URL in $HERE/CONNECTOR_URL.txt (segreto, non va in nessuna mail)"
else
  say "ready. Connector URL: cd $HERE && docker compose exec segretario cat /data/connector-url"
fi

# 6. Stato leggibile senza terminale (STATUS.txt e Postino > Impostazioni > Claude).
bash "$HERE/scripts/report.sh" 2>&1 | tail -n 2
exit "$FAILED"
