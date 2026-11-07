"""Il brief del mattino e la spesa, fatti dal Segretario da solo (niente Claude, niente task di claude.ai):
testo pronto per Telegram, costruito dalla memoria (sessioni, proposte, richieste, diario) e da Keep
(TASKS di oggi, SPESA per negozio). Se Keep non risponde, il brief parte lo stesso senza quella parte.

Il brief è SPENTO finché BRIEF_ORA (es. "07:30") non è impostato in /config: Ema lo accende quando vuole.
"""

from __future__ import annotations

import html as _html
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


def esc(s: str) -> str:
    return _html.escape(str(s), quote=False)


def spesa_testo(items: list[dict], mapping: dict[str, list[str]]) -> str:
    """Testo HTML per Telegram (grassetto = negozio)."""
    groups = spesa_per_negozio(items, mapping)
    if not groups:
        return "<b>Spesa</b>\nNiente da comprare: la lista è tutta spuntata."
    lines = ["<b>Spesa</b>"]
    for shop in list(mapping) + [k for k in groups if k not in mapping]:
        if shop in groups:
            lines.append(f"<b>{esc(shop)}</b>: " + ", ".join(esc(x) for x in groups[shop]))
    return "\n".join(lines)


def costruisci(adesso: datetime, memoria: Path, sessioni: list[dict], proposte: list[dict], richieste: list[dict],
               diario_ieri: str = "", con_keep: bool = True, calendario: list[dict] | None = None,
               email: list[dict] | None = None, note: list[str] | None = None) -> str:
    """Il brief del mattino, nell'ordine voluto da Ema (7/11): calendario, poi i task di oggi, poi cose che
    potrebbe fare dalle liste non urgenti, poi le sessioni Claude che aspettano lui, e per ultime le email
    importanti non lette. HTML per Telegram (grassetti). Ogni blocco è indipendente: un errore in uno non
    ferma gli altri; `note` raccoglie gli avvisi (fonte non letta) in coda."""
    giorni = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
    mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
    parts = [f"<b>{giorni[adesso.weekday()]} {adesso.day} {mesi[adesso.month - 1]}</b>"]
    note = list(note or [])

    # 1. calendario
    if calendario is not None:
        if calendario:
            righe = []
            for ev in calendario[:10]:
                ora = f"{ev['ora']}" + (f"–{ev['fine']}" if ev.get("fine") else "") if ev.get("ora") else "tutto il giorno"
                righe.append(f"• {esc(ora)}  {esc(ev['titolo'])}" + (f" · {esc(ev['luogo'])}" if ev.get("luogo") else ""))
            parts.append("<b>Calendario</b>\n" + "\n".join(righe))
        else:
            parts.append("<b>Calendario</b>\nNiente in programma.")

    # 2. i task di oggi e 3. cose che potrebbe fare, da Keep
    if con_keep and keep.configured():
        try:
            tasks = keep.note("TASKS")
            text = tasks.get("text", "")
            oggi = keep.section(text, "TODAY'S TASKS")
            parts.append("<b>Oggi</b>\n" + ("\n".join(f"• {esc(t)}" for t in oggi[:12]) if oggi else "Niente di fissato per oggi."))
            altri = (keep.section(text, "GENERAL") + keep.section(text, "WORK"))[:5]
            if altri:
                parts.append("<b>Se hai tempo</b>\n" + "\n".join(f"• {esc(t)}" for t in altri))
        except Exception as err:  # noqa: BLE001
            note.append(f"Keep non letto: {err}")

    # 4. sessioni Claude che aspettano lui
    attese = [s for s in sessioni if s.get("stato") == "aspetta Ema"]
    if attese:
        parts.append("<b>Claude aspetta te</b>\n" + "\n".join(
            f"• {esc(s['nome'])}: {esc(s.get('domanda_per_ema') or s.get('prossimo_passo') or s.get('dove_sono', ''))}" for s in attese[:5]))

    # 5. email importanti non lette, per ultime
    if email is not None:
        if email:
            parts.append("<b>Email da leggere</b>\n" + "\n".join(f"• {esc(m['da'])}: {esc(m['oggetto'][:80])}" for m in email[:8]))
        else:
            parts.append("<b>Email da leggere</b>\nNessuna email importante non letta.")

    if note:
        parts.append("<i>" + " · ".join(esc(n[:120]) for n in note) + "</i>")
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
