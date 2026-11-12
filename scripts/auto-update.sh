#!/bin/bash
# Tiene il Segretario aggiornato da solo: controlla GitHub e, solo se c'è una versione nuova, la scarica
# e ricostruisce il container. Lo lancia cron ogni 10 minuti (install.sh aggiunge la riga):
#   */10 * * * * /home/ubuntu/segretario/scripts/auto-update.sh >> /home/ubuntu/segretario-update.log 2>&1
#
# Aggiornamenti firmati (.deploy/): si installa solo un commit firmato da una chiave elencata in
# .deploy/allowed_signers DELLA VERSIONE GIÀ INSTALLATA, così chi ruba l'account o un token GitHub non mette codice
# sul server. .deploy/mode: "off" (come prima), "avviso" (installa tutto, dice solo se è firmato), "obbligo"
# (installa solo il commit firmato più nuovo; quelli non firmati aspettano un commit firmato sopra).
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
REPO="$(cd "$(dirname "$0")/.." && pwd)"
exec 9>/tmp/segretario-update.lock
flock -n 9 || exit 0   # un aggiornamento è già in corso

BRANCH="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
git -C "$REPO" fetch -q origin "$BRANCH"
LOCAL="$(git -C "$REPO" rev-parse HEAD)"
REMOTE="$(git -C "$REPO" rev-parse "origin/$BRANCH")"

# ---- firme (lette dalla versione installata, già fidata) ----
SIGNERS="$REPO/.deploy/allowed_signers"
MODE="$(tr -d '[:space:]' 2>/dev/null < "$REPO/.deploy/mode" || true)"; MODE="${MODE:-off}"
[ -f "$SIGNERS" ] || MODE=off
firmato() { git -C "$REPO" -c gpg.ssh.allowedSignersFile="$SIGNERS" verify-commit "$1" >/dev/null 2>&1; }
TARGET="$REMOTE"; ULTIMO_FIRMATO=""
if [ "$MODE" != off ] && [ "$LOCAL" != "$REMOTE" ]; then
  for c in $(git -C "$REPO" rev-list --first-parent "$LOCAL..$REMOTE"); do   # dal più nuovo
    if firmato "$c"; then ULTIMO_FIRMATO="$c"; break; fi
  done
  if [ "$MODE" = obbligo ]; then TARGET="${ULTIMO_FIRMATO:-$LOCAL}"; fi
fi
stato() {   # quello che il Segretario mostra in stato(): niente segreti, solo id dei commit e sì/no
  local dir="$REPO/deploy-stato" inst="$1" nota="$2" hf=false rf=false as=false
  mkdir -p "$dir"
  [ "$MODE" != off ] && firmato "$inst" && hf=true
  [ "$MODE" != off ] && firmato "$REMOTE" && rf=true
  [ "$inst" != "$REMOTE" ] && as=true   # qui tutto il repo è codice del server: ogni attesa conta (il Segretario avvisa Ema)
  printf '{"repo":"segretario","modo":"%s","installato":"%s","installato_firmato":%s,"github":"%s","github_firmato":%s,"attesa_server":%s,"nota":"%s","quando":"%s"}\n' \
    "$MODE" "${inst:0:7}" "$hf" "${REMOTE:0:7}" "$rf" "$as" "$nota" "$(date -u +%FT%TZ)" > "$dir/segretario.json.tmp" \
    && mv -f "$dir/segretario.json.tmp" "$dir/segretario.json"
}

if [ "$TARGET" = "$LOCAL" ]; then
  if [ "$LOCAL" != "$REMOTE" ]; then stato "$LOCAL" "in attesa di un commit firmato"; else stato "$LOCAL" "aggiornato"; fi
  exit 0
fi

if [ "$MODE" = avviso ] && [ "$TARGET" != "$ULTIMO_FIRMATO" ]; then
  echo "$(date -u +%FT%TZ) ATTENZIONE: ${TARGET:0:7} non è firmato (modo avviso: lo installo lo stesso)"
fi
echo "$(date -u +%FT%TZ) updating ${LOCAL:0:7} -> ${TARGET:0:7}"
git -C "$REPO" merge -q --ff-only "$TARGET"
cd "$REPO"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo -n docker"
$DOCKER compose up -d --build || echo "$(date -u +%FT%TZ) compose up failed (install.sh will report)"
$DOCKER image prune -f >/dev/null 2>&1 || true
chmod +x "$REPO"/scripts/*.sh 2>/dev/null
bash "$REPO/scripts/install.sh" || true
echo "$(date -u +%FT%TZ) now on ${TARGET:0:7}"
stato "$TARGET" "aggiornato"
