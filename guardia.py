"""La guardia del Segretario: l'interruttore che spegne tutto (il blocco), il riconoscimento di chi chiama
(Anthropic, la rete interna o qualcun altro) e i contatori per accorgersi di un uso strano.

Il blocco vive in /data/blocco.json, così resta acceso anche dopo un riavvio. Lo accendono Ema (/spegni su Telegram,
il pulsante rosso nell'hub) o la guardia stessa; lo spegne solo Ema, con /riaccendi dal suo Telegram. Le altre app
(Postino, il link manager) chiedono GET /blocco e chiudono tutto finché risponde {"bloccato": true}.
"""

from __future__ import annotations

import ipaddress
import json
import os
import threading
import time
from collections import deque
from pathlib import Path
from typing import Callable

# Da dove partono le chiamate dei connettori MCP di claude.ai (anche Claude Code e il telefono passano di lì).
# Fonte: https://platform.claude.com/docs/en/api/ip-addresses, "Outbound IP addresses" (stabili, cambiano con preavviso).
ANTHROPIC = [ipaddress.ip_network(n) for n in ("160.79.104.0/21", "153.61.208.0/20", "2607:6bc0::/48")]


def ip_cliente(headers: dict[str, str], client_host: str) -> str:
    """L'IP vero di chi chiama. Dietro Caddy c'è X-Forwarded-For (Caddy lo riscrive e ignora quello mandato dal
    client); senza, la chiamata viene dalla rete interna dei container."""
    xff = headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return client_host or ""


def _ip(s: str):
    try:
        return ipaddress.ip_address(s)
    except ValueError:
        return None


INTERNE = [ipaddress.ip_network(n) for n in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "::1/128", "fc00::/7")]


def interno(ip: str) -> bool:
    """Solo le reti interne vere (container, la VM stessa). Non is_private: include anche intervalli pubblici."""
    a = _ip(ip)
    return a is not None and any(a in n for n in INTERNE if a.version == n.version)


def extra_fidati() -> list:
    """Reti in più da trattare come Anthropic (variabile SEGRETARIO_IP_FIDATI, separate da virgola): per il giorno in
    cui Anthropic aggiunge indirizzi nuovi."""
    reti = []
    for n in os.environ.get("SEGRETARIO_IP_FIDATI", "").split(","):
        n = n.strip()
        if n:
            try:
                reti.append(ipaddress.ip_network(n, strict=False))
            except ValueError:
                pass
    return reti


def anthropic(ip: str) -> bool:
    a = _ip(ip)
    if a is None:
        return False
    return any(a in n for n in ANTHROPIC) or any(a in n for n in extra_fidati())


class Finestra:
    """Quanti eventi negli ultimi `secondi` (thread-safe)."""

    def __init__(self, secondi: int):
        self.secondi = secondi
        self._t: deque[float] = deque()
        self._lock = threading.Lock()

    def aggiungi(self) -> int:
        now = time.time()
        with self._lock:
            self._t.append(now)
            while self._t and now - self._t[0] > self.secondi:
                self._t.popleft()
            return len(self._t)


class Blocco:
    def __init__(self, path: Path, adesso: Callable[[], str], avvisa: Callable[[str], None] | None = None):
        self.path = path
        self.adesso = adesso
        self.avvisa = avvisa
        self._lock = threading.Lock()
        try:
            self.stato = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.stato = {"attivo": False}

    @property
    def attivo(self) -> bool:
        return bool(self.stato.get("attivo"))

    def _salva(self) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.stato, ensure_ascii=False), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def blocca(self, motivo: str, da: str) -> bool:
        """Spegne tutto. Ritorna False se era già spento (niente secondo avviso)."""
        with self._lock:
            if self.attivo:
                return False
            self.stato = {"attivo": True, "dal": self.adesso(), "motivo": motivo[:300], "da": da}
            self._salva()
        if self.avvisa:
            testo = (f"SPENTO. {motivo}\n\nSono chiusi: Segretario (con WhatsApp e Keep), Postino, link manager. "
                     "Per riaccendere scrivi /riaccendi.")
            if da == "automatico":
                testo += "\nSe non sei stato tu, NON riaccendere: apri una chat di Claude Code e scrivi \"spento automatico\"."
            try:
                self.avvisa(testo)
            except Exception:  # noqa: BLE001  (il blocco vale anche se Telegram non risponde)
                pass
        return True

    def sblocca(self, da: str) -> bool:
        with self._lock:
            if not self.attivo:
                return False
            prima = dict(self.stato)
            self.stato = {"attivo": False, "riacceso": self.adesso(), "da": da, "ultimo": prima}
            self._salva()
        return True

    def descrivi(self) -> str:
        if self.attivo:
            return f"SPENTO dal {self.stato.get('dal', '?')} ({self.stato.get('da', '?')}): {self.stato.get('motivo', '')}"
        return "acceso"
