#!/bin/bash
# Tiene il Segretario aggiornato da solo: controlla GitHub e, solo se c'è una versione nuova, la scarica
# e ricostruisce il container. Lo lancia cron ogni 10 minuti (install.sh aggiunge la riga):
#   */10 * * * * /home/ubuntu/segretario/scripts/auto-update.sh >> /home/ubuntu/segretario-update.log 2>&1
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
REPO="$(cd "$(dirname "$0")/.." && pwd)"
exec 9>/tmp/segretario-update.lock
flock -n 9 || exit 0   # un aggiornamento è già in corso

BRANCH="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
git -C "$REPO" fetch -q origin "$BRANCH"
LOCAL="$(git -C "$REPO" rev-parse HEAD)"
REMOTE="$(git -C "$REPO" rev-parse "origin/$BRANCH")"
[ "$LOCAL" = "$REMOTE" ] && exit 0

echo "$(date -u +%FT%TZ) updating ${LOCAL:0:7} -> ${REMOTE:0:7}"
git -C "$REPO" merge -q --ff-only "origin/$BRANCH"
cd "$REPO"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo -n docker"
$DOCKER compose up -d --build
$DOCKER image prune -f >/dev/null 2>&1 || true
echo "$(date -u +%FT%TZ) now on ${REMOTE:0:7}"
