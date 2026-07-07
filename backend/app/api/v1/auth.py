from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email_service import send_password_reset_email, send_verification_code_email
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


def _code_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=settings.VERIFICATION_CODE_TTL_MINUTES)


def _is_expired(expires_at: str | None) -> bool:
    if not expires_at:
        return True
    return datetime.now(timezone.utc) > datetime.fromisoformat(expires_at)


@router.post("/register", response_model=RegisterResult, status_code=201)
def register(body: RegisterBody, db: Session = Depends(get_db)):
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
    )
    db.add(user)
    db.commit()

    send_verification_code_email(user.email, code)
    return RegisterResult(email=user.email, message="Code de vérification envoyé par email.")


@router.post("/verify-email", response_model=AuthResponse)
def verify_email(body: VerifyEmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.verification_code:
        raise HTTPException(status_code=400, detail="Aucune vérification en attente pour cet email.")
    if _is_expired(user.verification_code_expires_at):
        raise HTTPException(status_code=400, detail="Code expiré. Demande un nouveau code.")
    if user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Code incorrect.")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=user)


@router.post("/resend-code", response_model=MessageResult)
def resend_code(body: EmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user and not user.is_verified:
        code = generate_verification_code()
        user.verification_code = code
        user.verification_code_expires_at = _code_expiry().isoformat()
        db.commit()
        send_verification_code_email(user.email, code)
    return MessageResult(message=GENERIC_CODE_SENT_MESSAGE)


@router.post("/login", response_model=AuthResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Compte non vérifié. Vérifie ton email avant de te connecter.")

    # Tracé CRM (cf. Back-Office Admin) : date de dernière connexion.
    user.last_login_at = datetime.now(timezone.utc).isoformat()
    db.commit()

    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=user)


@router.post("/forgot-password", response_model=MessageResult)
def forgot_password(body: EmailBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        code = generate_verification_code()
        user.reset_code = code
        user.reset_code_expires_at = _code_expiry().isoformat()
        db.commit()
        send_password_reset_email(user.email, code)
    return MessageResult(message=GENERIC_CODE_SENT_MESSAGE)


@router.post("/reset-password", response_model=MessageResult)
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.reset_code:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")
    if _is_expired(user.reset_code_expires_at):
        raise HTTPException(status_code=400, detail="Code expiré. Demande un nouveau code.")
    if user.reset_code != body.code:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré.")

    user.hashed_password = hash_password(body.new_password)
    user.reset_code = None
    user.reset_code_expires_at = None
    db.commit()
    return MessageResult(message="Mot de passe mis à jour.")
