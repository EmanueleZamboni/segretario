"""Le chat recenti di Ema, tutte insieme (13/11/2026): "dove ero rimasto?".

Tre fonti, in un solo elenco dal più recente:
- le chat di claude.ai che Ema apre (le segna l'estensione Voce: titolo e link, mai il contenuto);
- le chat di Claude Code (le segna la barra "segretario-tabs" dell'app, con il link claude:// che le riapre);
- quello che ogni chat scrive con sessione_segna (dove sono, prossimo passo, cosa aspetta da Ema) e i progetti.
Le aperture stanno in /data/chat_aperte.json (non nella memoria git: cambiano di continuo).
"""

from __future__ import annotations

import json
import os
import re
import threading
from pathlib import Path

TIPI = ("claude.ai", "claude code")
LINK_OK = re.compile(r"^(https://claude\.ai/(chat|project)/[A-Za-z0-9-]{8,80}|claude://claude\.ai/epitaxy/local_[A-Za-z0-9-]{8,80})$")
TENERE = 300


def link_ok(link: str) -> bool:
    return bool(LINK_OK.match(link or ""))


def _norm(t: str) -> str:
    return re.sub(r"\s+", " ", (t or "").strip().lower())


class Aperte:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()

    def leggi(self) -> dict:
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def _scrivi(self, d: dict) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def segna(self, voci: list[dict], adesso: str) -> int:
        """voci: [{titolo, tipo, link, quando?, in_corso?}]. quando = "AAAA-MM-GG HH:MM" (ora italiana), vuoto = adesso.
        Una voce senza link valido viene ignorata. Ritorna quante sono state salvate."""
        fatte = 0
        with self._lock:
            d = self.leggi()
            for v in voci[:50]:
                link = str(v.get("link") or "").strip()
                tipo = str(v.get("tipo") or "").strip().lower()
                if not link_ok(link) or tipo not in TIPI:
                    continue
                titolo = re.sub(r"\s+", " ", str(v.get("titolo") or "")).strip()[:80]
                quando = str(v.get("quando") or "").strip()[:16] or adesso
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}", quando):
                    quando = adesso
                old = d.get(link, {})
                d[link] = {"titolo": titolo or old.get("titolo", ""), "tipo": tipo, "link": link,
                           "visto": max(quando, old.get("visto", "")), "in_corso": bool(v.get("in_corso"))}
                fatte += 1
            if len(d) > TENERE:
                for k in sorted(d, key=lambda k: d[k].get("visto", ""))[: len(d) - TENERE]:
                    d.pop(k, None)
            self._scrivi(d)
        return fatte


def recenti(aperte: dict, sessioni: list[dict], progetti: list[dict], quante: int = 40) -> list[dict]:
    """Un elenco solo, dal più recente: ogni chat (con link se si sa), arricchita con quello che ha scritto nel
    Segretario; le sessioni che non si sa dove sono; i progetti senza una chat recente."""
    per_nome = {_norm(s.get("nome", "")): s for s in sessioni if s.get("nome")}
    usate: set[str] = set()
    out: list[dict] = []

    def voce(tipo, titolo, link, sessione, quando, in_corso=False):
        s = sessione or {}
        q = max(quando or "", s.get("aggiornato", "") or "")
        return {"tipo": tipo, "titolo": titolo or s.get("nome", ""), "link": link, "progetto": s.get("progetto", ""),
                "stato": s.get("stato", "in corso" if in_corso else ""), "aspetta": s.get("stato") == "aspetta Ema",
                "dove_sono": s.get("dove_sono", ""), "prossimo": s.get("prossimo_passo", ""),
                "domanda": s.get("domanda_per_ema", ""), "quando": q, "in_corso": in_corso}

    for a in aperte.values():
        n = _norm(a.get("titolo", ""))
        s = per_nome.get(n)
        if s is None and n:  # "BUILDING SEGRETARIO" e "Building Segretario (fork)": il titolo contiene il nome
            s = next((v for k, v in per_nome.items() if k and (k in n or n in k) and min(len(k), len(n)) >= 6), None)
        if s is not None:
            usate.add(_norm(s.get("nome", "")))
        out.append(voce(a.get("tipo", ""), a.get("titolo", ""), a.get("link", ""), s, a.get("visto", ""), bool(a.get("in_corso"))))
    for k, s in per_nome.items():
        if k not in usate:
            out.append(voce("", s.get("nome", ""), "", s, ""))
    con_progetto = {_norm(x["progetto"]) for x in out if x["progetto"]}
    for p in progetti:
        if _norm(p.get("nome", "")) in con_progetto or p.get("id") == "scambio":
            continue
        if not (p.get("dove_sono") or p.get("prossimo_passo")):
            continue
        out.append({"tipo": "progetto", "titolo": p.get("nome", ""), "link": "", "progetto": p.get("nome", ""),
                    "stato": p.get("stato", ""), "aspetta": p.get("stato") == "aspetta Ema",
                    "dove_sono": p.get("dove_sono", ""), "prossimo": p.get("prossimo_passo", ""), "domanda": "",
                    "quando": p.get("aggiornato", ""), "in_corso": False})
    out = [x for x in out if x["stato"] != "finita" or x["link"]]
    out.sort(key=lambda x: x["quando"], reverse=True)
    return out[: max(1, min(int(quante), 200))]
