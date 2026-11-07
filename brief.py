"""Il brief del mattino e la spesa, fatti dal Segretario da solo (niente Claude, niente task di claude.ai):
testo pronto per Telegram, costruito dalla memoria (sessioni, proposte, richieste, diario) e da Keep
(TASKS di oggi, SPESA per negozio). Se Keep non risponde, il brief parte lo stesso senza quella parte.

Il brief è SPENTO finché BRIEF_ORA (es. "07:30") non è impostato in /config: Ema lo accende quando vuole.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import keep

NEGOZI_DEFAULT = {
    "Lidl": ["affettati vegani", "burger vegani", "latte di soia", "riso", "frutta secca", "piselli congelati", "tofu",
             "olio di oliva", "ariosto", "capperi", "avena", "semini", "vino rosso", "vino bianco", "noodles istantanei",
             "pan grattato", "ceci", "passata", "panna da cucina vegetale", "fagioli", "ortolina", "acqua", "pasta",
             "tahina", "spugna", "cartine", "tabacco"],
    "Mercato agricolo": ["cipolla", "aglio", "limone", "patate", "frutta", "verdura"],
    "DM": ["shampoo", "bagnoschiuma", "idratante viso", "scrub viso", "deodorante", "sapone intimo",
           "detergente lavatrice", "colluttorio", "detergente viso", "lamette", "dentifricio"],
}
NEGOZI_FILE = "negozi.json"


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"\(.*?\)", "", s.lower())).strip()


def negozi(memoria: Path) -> dict[str, list[str]]:
    f = memoria / NEGOZI_FILE
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return {k: list(v) for k, v in NEGOZI_DEFAULT.items()}


def negozio_di(prodotto: str, mapping: dict[str, list[str]]) -> str | None:
    p = _norm(prodotto)
    for shop, items in mapping.items():
        for it in items:
            n = _norm(it)
            if n and (n == p or p.startswith(n) or n in p):
                return shop
    return None


def spesa_per_negozio(items: list[dict], mapping: dict[str, list[str]]) -> dict[str, list[str]]:
    """Le voci NON spuntate della lista SPESA (= finite, da comprare), raggruppate per negozio."""
    out: dict[str, list[str]] = {}
    for it in items:
        if it.get("checked"):
            continue
        text = str(it.get("text", "")).strip()
        if not text:
            continue
        shop = negozio_di(text, mapping) or "Da assegnare a un negozio"
        out.setdefault(shop, []).append(text)
    return out


def spesa_testo(items: list[dict], mapping: dict[str, list[str]]) -> str:
    groups = spesa_per_negozio(items, mapping)
    if not groups:
        return "Spesa: niente da comprare, la lista è tutta spuntata."
    lines = ["Spesa (voci non spuntate in SPESA):"]
    for shop in list(mapping) + [k for k in groups if k not in mapping]:
        if shop in groups:
            lines.append(f"• {shop}: " + ", ".join(groups[shop]))
    return "\n".join(lines)


def costruisci(adesso: datetime, memoria: Path, sessioni: list[dict], proposte: list[dict], richieste: list[dict],
               diario_ieri: str, con_keep: bool = True) -> str:
    """Il testo del brief. Ogni blocco è indipendente: un errore in uno non ferma gli altri."""
    giorni = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
    parts = [f"Buongiorno Ema. {giorni[adesso.weekday()]} {adesso:%d/%m}."]
    keep_err = None
    if con_keep and keep.configured():
        try:
            tasks = keep.note("TASKS")
            oggi = keep.section(tasks.get("text", ""), "TODAY'S TASKS")
            if oggi:
                parts.append("Oggi (TASKS):\n" + "\n".join(f"• {t}" for t in oggi[:12]))
            else:
                parts.append("Oggi (TASKS): niente in TODAY'S TASKS.")
        except Exception as err:  # noqa: BLE001
            keep_err = str(err)
        try:
            spesa = keep.note("SPESA")
            parts.append(spesa_testo(spesa.get("items", []), negozi(memoria)))
        except Exception as err:  # noqa: BLE001
            keep_err = keep_err or str(err)
    attese = [s for s in sessioni if s.get("stato") == "aspetta Ema"]
    if attese:
        parts.append("Aspettano una tua risposta:\n" + "\n".join(
            f"• {s['nome']}: {s.get('domanda_per_ema') or s.get('prossimo_passo') or s.get('dove_sono', '')}" for s in attese[:6]))
    in_attesa = [p for p in proposte if p.get("stato") == "in attesa"]
    if in_attesa:
        parts.append(f"Regole proposte da approvare: {len(in_attesa)} (/coda, o il codice in chat).")
    aperte = [r for r in richieste if r.get("stato") == "aperta"]
    if aperte:
        parts.append(f"Richieste di miglioramento aperte: {len(aperte)}.")
    if diario_ieri.strip():
        righe = [l[2:] for l in diario_ieri.splitlines() if l.startswith("- ")]
        if righe:
            parts.append("Ieri:\n" + "\n".join(f"• {r[:140]}" for r in righe[-6:]))
    if keep_err:
        parts.append(f"(Keep non letto: {keep_err[:120]})")
    return "\n\n".join(parts)


def dovuto(adesso: datetime, ora: str, ultimo_invio: str) -> bool:
    """True se il brief delle `ora` (HH:MM) va mandato ora: ora passata e non ancora mandato oggi.
    Dopo le 12 non si manda più (un brief del mattino alle 15 è solo rumore)."""
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", (ora or "").strip())
    if not m:
        return False
    h, mi = int(m.group(1)), int(m.group(2))
    if not (0 <= h < 24 and 0 <= mi < 60):
        return False
    if ultimo_invio == adesso.strftime("%Y-%m-%d"):
        return False
    minuti = adesso.hour * 60 + adesso.minute
    return h * 60 + mi <= minuti < 12 * 60
