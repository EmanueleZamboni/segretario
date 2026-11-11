"""Il muro di accesso del connettore: OAuth 2.1 (quello che claude.ai usa per i connettori con login).

Chi conosce l'indirizzo del connettore non basta più: per collegarlo, claude.ai apre una pagina del Segretario dove
serve il codice di 6 cifre che arriva SOLO sul Telegram di Ema (/codice). Poi claude.ai riceve un token che vale 1 ora
e si rinnova da solo; ogni collegamento si può revocare (Impostazioni > Sicurezza, o "Spegni tutto").

Implementa l'interfaccia OAuthAuthorizationServerProvider dell'SDK MCP ufficiale. I token sono salvati solo come
hash (sha256) in /data/oauth.json, 0600. Solo indirizzi di ritorno di claude.ai / claude.com sono accettati.
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import threading
import time
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    RefreshToken,
    RegistrationError,
    construct_redirect_uri,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

ACCESS_S = 3600
REFRESH_S = 400 * 86400
CODE_S = 300
PENDING_S = 900
MAX_CLIENTS = 40
MAX_PENDING = 50
HOST_RITORNO = ("claude.ai", "claude.com")


def _h(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def ritorno_ammesso(uri: str) -> bool:
    p = urlparse(str(uri))
    host = (p.hostname or "").lower()
    return p.scheme == "https" and any(host == h or host.endswith("." + h) for h in HOST_RITORNO)


class Provider:
    def __init__(self, path: Path, url_accesso: Callable[[str], str], avvisa: Callable[[str], None] | None = None):
        self.path = path
        self.url_accesso = url_accesso
        self.avvisa = avvisa
        self._lock = threading.Lock()
        try:
            self.d = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.d = {}
        for k in ("clients", "pending", "codes", "access", "refresh"):
            self.d.setdefault(k, {})

    # ------------------------------------------------------------ archivio
    def _salva(self) -> None:
        now = time.time()
        for k in ("pending", "codes", "access", "refresh"):
            self.d[k] = {i: v for i, v in self.d[k].items() if float(v.get("scade", 0)) > now}
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.d, ensure_ascii=False), encoding="utf-8")
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def collegamenti(self) -> list[dict]:
        """Le app collegate (un rinnovo valido = un collegamento)."""
        with self._lock:
            now = time.time()
            out = []
            for v in self.d["refresh"].values():
                if float(v.get("scade", 0)) > now:
                    c = self.d["clients"].get(v["client_id"], {})
                    out.append({"app": c.get("client_name") or v["client_id"][:8], "dal": v.get("dal", "")})
            return out

    def revoca_tutto(self) -> int:
        with self._lock:
            n = len(self.d["refresh"])
            self.d["access"] = {}
            self.d["refresh"] = {}
            self.d["codes"] = {}
            self.d["pending"] = {}
            self._salva()
            return n

    # ------------------------------------------------------------ client (registrazione dinamica di claude.ai)
    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        c = self.d["clients"].get(client_id)
        return OAuthClientInformationFull.model_validate(c) if c else None

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        uris = [str(u) for u in (client_info.redirect_uris or [])]
        if not uris or not all(ritorno_ammesso(u) for u in uris):
            raise RegistrationError(error="invalid_redirect_uri",
                                    error_description="solo claude.ai e claude.com possono collegarsi a questo connettore")
        with self._lock:
            clients = self.d["clients"]
            if len(clients) >= MAX_CLIENTS:  # la registrazione è pubblica: niente crescita senza fine
                usati = {v["client_id"] for v in self.d["refresh"].values()}
                for cid in sorted((c for c in clients if c not in usati), key=lambda c: clients[c].get("_creato", 0))[:10]:
                    clients.pop(cid, None)
            data = client_info.model_dump(mode="json", exclude_none=True)
            data["_creato"] = time.time()
            clients[client_info.client_id] = data
            self._salva()

    # ------------------------------------------------------------ autorizzazione (la pagina col codice Telegram)
    async def authorize(self, client: OAuthClientInformationFull, params: AuthorizationParams) -> str:
        if not ritorno_ammesso(str(params.redirect_uri)):
            raise RegistrationError(error="invalid_redirect_uri", error_description="indirizzo di ritorno non ammesso")
        rid = secrets.token_urlsafe(24)
        with self._lock:
            if len(self.d["pending"]) >= MAX_PENDING:
                for k in sorted(self.d["pending"], key=lambda k: self.d["pending"][k]["scade"])[:10]:
                    self.d["pending"].pop(k, None)
            self.d["pending"][rid] = {
                "client_id": client.client_id,
                "app": client.client_name or "",
                "state": params.state,
                "scopes": params.scopes or [],
                "code_challenge": params.code_challenge,
                "redirect_uri": str(params.redirect_uri),
                "redirect_uri_provided_explicitly": params.redirect_uri_provided_explicitly,
                "resource": params.resource,
                "scade": time.time() + PENDING_S,
            }
            self._salva()
        return self.url_accesso(rid)

    def richiesta(self, rid: str) -> dict | None:
        p = self.d["pending"].get(rid or "")
        return p if p and float(p["scade"]) > time.time() else None

    def consenti(self, rid: str) -> str:
        """Ema ha scritto il codice giusto: crea il codice di autorizzazione e ritorna dove rimandare il browser."""
        with self._lock:
            p = self.d["pending"].pop(rid, None)
            if not p or float(p["scade"]) < time.time():
                raise ValueError("richiesta scaduta: ricomincia il collegamento da claude.ai")
            code = secrets.token_urlsafe(32)
            self.d["codes"][_h(code)] = {**{k: p[k] for k in ("client_id", "scopes", "code_challenge", "redirect_uri",
                                                              "redirect_uri_provided_explicitly", "resource")},
                                         "scade": time.time() + CODE_S}
            self._salva()
        if self.avvisa:
            try:
                self.avvisa(f"Nuovo collegamento al Segretario: {p.get('app') or 'app senza nome'}. Se non sei stato tu: /spegni")
            except Exception:  # noqa: BLE001
                pass
        return construct_redirect_uri(p["redirect_uri"], code=code, state=p["state"])

    def rifiuta(self, rid: str) -> str | None:
        with self._lock:
            p = self.d["pending"].pop(rid, None)
            self._salva()
        if not p:
            return None
        return construct_redirect_uri(p["redirect_uri"], error="access_denied", state=p["state"])

    async def load_authorization_code(self, client: OAuthClientInformationFull, authorization_code: str) -> AuthorizationCode | None:
        c = self.d["codes"].get(_h(authorization_code))
        if not c or c["client_id"] != client.client_id or float(c["scade"]) < time.time():
            return None
        return AuthorizationCode(code=authorization_code, scopes=c["scopes"], expires_at=c["scade"], client_id=c["client_id"],
                                 code_challenge=c["code_challenge"], redirect_uri=c["redirect_uri"],
                                 redirect_uri_provided_explicitly=c["redirect_uri_provided_explicitly"], resource=c.get("resource"),
                                 subject="ema")

    # ------------------------------------------------------------ token
    def _emetti(self, client_id: str, scopes: list[str], resource: str | None) -> OAuthToken:
        access, refresh = secrets.token_urlsafe(32), secrets.token_urlsafe(48)
        coppia = secrets.token_hex(8)
        now = time.time()
        self.d["access"][_h(access)] = {"client_id": client_id, "scopes": scopes, "resource": resource, "coppia": coppia,
                                        "scade": now + ACCESS_S}
        self.d["refresh"][_h(refresh)] = {"client_id": client_id, "scopes": scopes, "resource": resource, "coppia": coppia,
                                          "scade": now + REFRESH_S, "dal": time.strftime("%Y-%m-%d %H:%M")}
        self._salva()
        return OAuthToken(access_token=access, token_type="Bearer", expires_in=ACCESS_S,
                          scope=" ".join(scopes) if scopes else None, refresh_token=refresh)

    def _togli_coppia(self, coppia: str) -> None:
        for k in ("access", "refresh"):
            self.d[k] = {i: v for i, v in self.d[k].items() if v.get("coppia") != coppia}

    async def exchange_authorization_code(self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode) -> OAuthToken:
        with self._lock:
            if self.d["codes"].pop(_h(authorization_code.code), None) is None:
                from mcp.server.auth.provider import TokenError
                raise TokenError(error="invalid_grant", error_description="codice già usato o scaduto")
            return self._emetti(client.client_id, authorization_code.scopes, authorization_code.resource)

    async def load_refresh_token(self, client: OAuthClientInformationFull, refresh_token: str) -> RefreshToken | None:
        r = self.d["refresh"].get(_h(refresh_token))
        if not r or r["client_id"] != client.client_id or float(r["scade"]) < time.time():
            return None
        return RefreshToken(token=refresh_token, client_id=r["client_id"], scopes=r["scopes"], expires_at=int(r["scade"]),
                            resource=r.get("resource"), subject="ema")

    async def exchange_refresh_token(self, client: OAuthClientInformationFull, refresh_token: RefreshToken, scopes: list[str]) -> OAuthToken:
        with self._lock:
            r = self.d["refresh"].get(_h(refresh_token.token))
            if not r:
                from mcp.server.auth.provider import TokenError
                raise TokenError(error="invalid_grant", error_description="rinnovo non valido")
            self._togli_coppia(r["coppia"])  # rotazione: il vecchio rinnovo non vale più
            return self._emetti(client.client_id, scopes or r["scopes"], r.get("resource"))

    async def load_access_token(self, token: str) -> AccessToken | None:
        a = self.d["access"].get(_h(token))
        if not a or float(a["scade"]) < time.time():
            return None
        return AccessToken(token=token, client_id=a["client_id"], scopes=a["scopes"], expires_at=int(a["scade"]),
                           resource=a.get("resource"), subject="ema")

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        with self._lock:
            for k in ("access", "refresh"):
                v = self.d[k].get(_h(token.token))
                if v:
                    self._togli_coppia(v["coppia"])
            self._salva()
