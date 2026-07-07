from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email_service import send_password_reset_email, send_verification_code_email
from app.core.rate_limit import limiter
from app.core.security import create_access_token, generate_verification_code, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas import (
    AuthResponse,
    EmailBody,
    MessageResult,
    RegisterBody,
    RegisterResult,
    ResetPasswordBody,
    VerifyEmailBody,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Réponse volontairement identique que l'email existe ou non (anti-enumeration).
GENERIC_CODE_SENT_MESSAGE = "Si un compte existe avec cet email, un code a été envoyé."

# Protection anti brute-force (cf. audit sécurité -- codes 6 chiffres = 1M
# combinaisons, jamais sûrs sans limite de tentatives). Défense en profondeur :
# ces compteurs bloquent même un attaquant qui contournerait le rate limiting
# par IP (rotation d'IP, botnet...).
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15
MAX_CODE_ATTEMPTS = 5


def _code_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=settings.VERIFICATION_CODE_TTL_MINUTES)


def _is_expired(expires_at: str | None) -> bool:
    if not expires_at:
        return True
    return datetime.now(timezone.utc) > datetime.fromisoformat(expires_at)


def _is_locked(locked_until: str | None) -> bool:
    if not locked_until:
        return False
    return datetime.now(timezone.utc) < datetime.fromisoformat(locked_until)


@router.post("/register", response_model=RegisterResult, status_code=201)
@limiter.limit("5/hour")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    code = generate_verification_code()
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        is_verified=False,
        verification_code=code,
        verification_code_expires_at=_code_expiry().isoformat(),
        verification_attempts=0,
    )
    db.add(user)
    db.commit()

    send_verification_code_email(user.email, code)
    return RegisterResult(email=user.email, message="Code de vérification envoyé par email.")


@router.post("/verify-email", response_model=AuthResponse)
@limiter.limit("10/minute")
def verify_email(request: Request, body: VerifyEmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.verification_code:
        raise HTTPException(status_code=400, detail="Aucune vérification en attente pour cet email.")

    if user.verification_attempts >= MAX_CODE_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives avec un code incorrect. Demande un nouveau code.",
        )
    if _is_expired(user.verification_code_expires_at):
        raise HTTPException(status_code=400, detail="Code expiré. Demande un nouveau code.")
    if user.verification_code != body.code:
        user.verification_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Code incorrect.")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.verification_attempts = 0
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=user)


@router.post("/resend-code", response_model=MessageResult)
@limiter.limit("3/5minutes")
def resend_code(request: Request, body: EmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user and not user.is_verified:
        code = generate_verification_code()
        user.verification_code = code
        user.verification_code_expires_at = _code_expiry().isoformat()
        user.verification_attempts = 0  # nouveau code -> nouvelle chance, compteur remis à zéro
        db.commit()
        send_verification_code_email(user.email, code)
    return MessageResult(message=GENERIC_CODE_SENT_MESSAGE)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    if _is_locked(user.locked_until):
        raise HTTPException(
            status_code=429,
            detail=f"Trop de tentatives échouées. Réessaie dans {LOGIN_LOCKOUT_MINUTES} minutes.",
        )

    if not verify_password(form.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = (
                datetime.now(timezone.utc) + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            ).isoformat()
        db.commit()
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Compte non vérifié. Vérifie ton email avant de te connecter.")

    # Connexion réussie : on lève le verrou et on repart avec un compteur propre.
    user.failed_login_attempts = 0
    user.locked_until = None
    # Tracé CRM (cf. Back-Office Admin) : date de dernière connexion.
    user.last_login_at = datetime.now(timezone.utc).isoformat()
    db.commit()

    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=user)


@router.post("/forgot-password", response_model=MessageResult)
@limiter.limit("3/5minutes")
def forgot_password(request: Request, body: EmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        code = generate_verification_code()
        user.reset_code = code
        user.reset_code_expires_at = _code_expiry().isoformat()
        user.reset_attempts = 0  # nouveau code -> nouvelle chance, compteur remis à zéro
        db.commit()
        send_password_reset_email(user.email, code)
    return MessageResult(message=GENERIC_CODE_SENT_MESSAGE)


@router.post("/reset-password", response_model=MessageResult)
@limiter.limit("10/minute")
def reset_password(request: Request, body: ResetPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.reset_code:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    if user.reset_attempts >= MAX_CODE_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives avec un code incorrect. Demande un nouveau code.",
        )
    if _is_expired(user.reset_code_expires_at):
        raise HTTPException(status_code=400, detail="Code expiré. Demande un nouveau code.")
    if user.reset_code != body.code:
        user.reset_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    user.hashed_password = hash_password(body.new_password)
    user.reset_code = None
    user.reset_code_expires_at = None
    user.reset_attempts = 0
    db.commit()
    return MessageResult(message="Mot de passe mis à jour.")
