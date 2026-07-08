import secrets
from datetime import datetime, timedelta, timezone

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
