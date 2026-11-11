# Segretario: notes for Claude

Pull the latest `main` before changing anything. NEXT_STEPS.md (one folder up, on Ema's PC) has the history.

- **Going live: only signed commits (since 2026-11-12).** The VM installs only commits signed with Ema's deploy key
  (only on his PC; `.deploy/`, checked by `scripts/auto-update.sh`). Work pushed from a cloud or phone session is not
  live until a Claude Code session on his PC signs a commit on top: tell Ema so in plain words. On the PC, read what is
  underneath before signing (your signature vouches for it). State: `stato()` > "aggiornamenti".
- **Every new .py file must be added to the `COPY` line of the Dockerfile** (tests/test_dockerfile.py checks it). On
  2026-11-12 a missing one crashed the container for 10 minutes.
- Run every `tests/test_*.py` (they are plain scripts: `python tests/test_x.py`) before pushing, including test_avvio.
- Personal data never goes in the repo (it is public): no names, chats, rules, diary.
