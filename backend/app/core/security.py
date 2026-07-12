import secrets
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_verification_code() -> str:
    """Code à 6 chiffres cryptographiquement sûr (vérification email / reset mot de passe)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def create_powens_state(user_id: str) -> str:
    """Jeton anti-CSRF signé et à courte durée de vie, transmis à la Webview Powens
    dans le paramètre `state` et vérifié au retour sur /bank/callback.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.POWENS_STATE_TTL_MINUTES)
    payload = {"sub": user_id, "scope": "powens_connect", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_powens_state(state: str) -> str | None:
    """Retourne l'user_id si le state est valide, non expiré, et bien scope 'powens_connect'."""
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") != "powens_connect":
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Connexion Google (flux "ID token" -- pas de redirect_uri ni de client
# secret côté serveur : le frontend récupère un credential JWT déjà signé
# par Google, ce backend le revérifie lui-même ici avant de faire confiance
# à quoi que ce soit qu'il contient).
# ---------------------------------------------------------------------------

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

# Cache en mémoire, même convention que app/core/rate_limit.py (pas de Redis) :
# acceptable ici car il ne contient que des clés publiques Google, jamais
# d'état mutable partagé entre requêtes -- une instance qui recharge sa
# propre copie toutes les heures n'a aucun risque de cohérence, juste une
# fraîcheur bornée par ce TTL.
_GOOGLE_JWKS_CACHE_TTL_SECONDS = 3600
_google_jwks_cache: dict | None = None
_google_jwks_cache_at: float = 0.0


class OAuthTokenError(Exception):
    """Levée quand le token d'un fournisseur OAuth tiers échoue sa vérification
    (signature, expiration, audience/issuer, email non vérifié par le
    fournisseur). Nom volontairement générique (pas GoogleTokenError) pour
    rester réutilisable par un futur fournisseur, sans construire cette
    logique maintenant."""


@dataclass
class GoogleIdentity:
    sub: str
    email: str
    first_name: str


def _fetch_google_jwks() -> dict:
    response = httpx.get(GOOGLE_JWKS_URL, timeout=10.0)
    response.raise_for_status()
    return response.json()


def _get_google_jwks(force_refresh: bool = False) -> dict:
    global _google_jwks_cache, _google_jwks_cache_at
    now = time.monotonic()
    if force_refresh or _google_jwks_cache is None or (now - _google_jwks_cache_at) > _GOOGLE_JWKS_CACHE_TTL_SECONDS:
        _google_jwks_cache = _fetch_google_jwks()
        _google_jwks_cache_at = now
    return _google_jwks_cache


def _find_jwk(kid: str, jwks: dict) -> dict | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


def verify_google_id_token(id_token: str) -> GoogleIdentity:
    """Revérifie côté serveur un credential JWT émis par Google Identity
    Services (signature RS256, audience, issuer, expiration) -- ne jamais
    faire confiance à un claim d'identité fourni tel quel par le client.
    Aucune dépendance supplémentaire : python-jose gère déjà RS256 (le reste
    de ce fichier ne s'en sert qu'en HS256, pour nos propres tokens)."""
    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise OAuthTokenError("Jeton Google malformé.") from exc

    kid = header.get("kid")
    if not kid:
        raise OAuthTokenError("Jeton Google sans identifiant de clé (kid).")

    jwks = _get_google_jwks()
    jwk = _find_jwk(kid, jwks)
    if jwk is None:
        # Rotation de clés Google : un seul refetch forcé avant d'abandonner.
        jwks = _get_google_jwks(force_refresh=True)
        jwk = _find_jwk(kid, jwks)
    if jwk is None:
        raise OAuthTokenError("Clé de vérification Google introuvable.")

    try:
        payload = jwt.decode(
            id_token,
            jwk,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            issuer=GOOGLE_ISSUERS,
        )
    except JWTError as exc:
        raise OAuthTokenError("Jeton Google invalide ou expiré.") from exc

    if not payload.get("email_verified"):
        raise OAuthTokenError("Email Google non vérifié.")

    email = payload.get("email")
    sub = payload.get("sub")
    if not email or not sub:
        raise OAuthTokenError("Jeton Google incomplet.")

    given_name = payload.get("given_name")
    if not given_name:
        full_name = payload.get("name")
        given_name = full_name.split(" ")[0] if full_name else "Utilisateur"

    return GoogleIdentity(sub=sub, email=email, first_name=given_name)
