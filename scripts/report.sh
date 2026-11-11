#!/bin/bash
# Scrive lo stato del Segretario (container, ultime righe di log) in STATUS.txt qui accanto. NESSUN segreto:
# niente URL del connettore, e niente copia in Postino (prima finiva in postino/data/ops/keep-url, leggibile da Postino).
set -uo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo -n docker"
OUT="$HERE/STATUS.txt"
{
  echo "Segretario: stato al $(date -u +%FT%TZ)"
  echo "== versione: $(git -C "$HERE" log -1 --format='%h %ci' 2>/dev/null)"
  echo "== container"
  (cd "$HERE" && $DOCKER compose ps --format '{{.Name}} {{.Status}}' 2>&1 | tail -n 5)
  echo "== log del container (ultime 30 righe)"
  (cd "$HERE" && $DOCKER compose logs --no-color --tail=30 segretario 2>&1 | cut -c1-300)
  echo "== salute (dentro il container)"
  (cd "$HERE" && $DOCKER compose exec -T segretario python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8766/health',timeout=5).read().decode())" 2>&1 | tail -n 2)
  echo "== ultimo docker compose up (ultime 15 righe)"
  tail -n 15 /tmp/segretario-up.log 2>/dev/null
  echo "== cron"
  crontab -l 2>/dev/null | grep -c segretario
  echo "== chiavi in .env (solo nomi)"
  grep -oE '^[A-Z_]+=' "$HERE/.env" 2>/dev/null | tr -d '=' | tr '\n' ' '; echo
} > "$OUT" 2>&1
chmod 600 "$OUT"
echo "segretario: stato scritto in $OUT"
