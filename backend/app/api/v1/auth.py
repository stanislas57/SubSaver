import logging
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email_service import send_password_reset_email
from app.core.rate_limit import limiter
from app.core.security import create_access_token, generate_verification_code, hash_password, verify_password
from app.core.sms_service import mask_phone, send_otp_sms
from app.db.session import get_db
from app.models.user import User
from app.schemas import (
    AuthResponse,
    EmailBody,
    MessageResult,
    RegisterBody,
    RegisterResult,
    ResetPasswordBody,
    VerifyOtpBody,
)

logger = logging.getLogger(__name__)

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
    """Étape 1 : Inscription + Envoi de l'OTP par SMS."""
    # Vérifier que l'email n'existe pas
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    # Vérifier que le téléphone n'existe pas
    if db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec ce téléphone.")

    # Générer le code OTP (6 chiffres)
    otp_code = str(secrets.randbelow(1000000)).zfill(6)
    otp_expires_at = (datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_TTL_MINUTES)).isoformat()

    # Créer l'utilisateur (non vérifié)
    user = User(
        email=body.email,
        phone=body.phone,
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        is_verified=False,
        otp_code=otp_code,
        otp_expires_at=otp_expires_at,
        otp_attempts=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Envoyer le code OTP par SMS
    try:
        send_otp_sms(body.phone, otp_code)
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du SMS OTP pour {body.email}: {e}")
        # Ne pas échouer ici — l'utilisateur peut réessayer avec resend-otp
        # En dev/test, send_otp_sms logs simplement le code

    return RegisterResult(
        phone_masked=mask_phone(body.phone),
        attempts_remaining=settings.OTP_MAX_ATTEMPTS,
    )


@router.post("/verify-otp", response_model=AuthResponse)
@limiter.limit("10/minute")
def verify_otp(request: Request, body: VerifyOtpBody, db: Session = Depends(get_db)):
    """Étape 2 : Vérification du code OTP + Création du compte."""
    user = db.query(User).filter(User.email == body.email, User.phone == body.phone).first()
    if not user or not user.otp_code:
        raise HTTPException(status_code=400, detail="Aucune vérification en attente pour cet email/téléphone.")

    # Vérifier le nombre de tentatives
    if user.otp_attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives échouées. Demande un nouveau code.",
        )

    # Vérifier l'expiration
    if _is_expired(user.otp_expires_at):
        raise HTTPException(status_code=400, detail="Code expiré. Demande un nouveau code.")

    # Vérifier le code
    if user.otp_code != body.otp_code:
        user.otp_attempts += 1
        db.commit()
        attempts_left = settings.OTP_MAX_ATTEMPTS - user.otp_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Code OTP invalide. {attempts_left} tentatives restantes.",
        )

    # ✅ Code valide : marquer l'utilisateur comme vérifié
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    db.commit()
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), token_type="bearer", user=user)


@router.post("/resend-otp", response_model=MessageResult)
@limiter.limit("3/5minutes")
def resend_otp(request: Request, body: EmailBody, db: Session = Depends(get_db)):
    """Renvoyer le code OTP par SMS."""
    user = db.query(User).filter(User.email == body.email).first()
    if user and not user.is_verified:
        # Générer un nouveau code OTP
        otp_code = str(secrets.randbelow(1000000)).zfill(6)
        user.otp_code = otp_code
        user.otp_expires_at = (
            datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_TTL_MINUTES)
        ).isoformat()
        user.otp_attempts = 0  # Nouvelle tentative de compteur
        db.commit()

        # Envoyer le code OTP par SMS
        try:
            send_otp_sms(user.phone, otp_code)
        except Exception as e:
            logger.error(f"Erreur lors du renvoi du SMS OTP pour {body.email}: {e}")

    return MessageResult(message=GENERIC_CODE_SENT_MESSAGE)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Chronomètre chaque phase (requête DB, vérification bcrypt, commit,
    génération du token) et journalise le détail dès que le login entier
    dépasse 500ms -- objectif : isoler immédiatement en logs si un login lent
    vient de la base, du coût bcrypt, ou d'autre chose (jamais d'appel externe
    synchrone ici : ni Powens ni calcul analytique ne sont déclenchés par ce
    endpoint, vérifié à la lecture du code)."""
    login_start = time.perf_counter()

    query_start = time.perf_counter()
    user = db.query(User).filter(User.email == form.username).first()
    query_ms = (time.perf_counter() - query_start) * 1000

    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    if _is_locked(user.locked_until):
        raise HTTPException(
            status_code=429,
            detail=f"Trop de tentatives échouées. Réessaie dans {LOGIN_LOCKOUT_MINUTES} minutes.",
        )

    verify_start = time.perf_counter()
    password_ok = verify_password(form.password, user.hashed_password)
    verify_ms = (time.perf_counter() - verify_start) * 1000

    if not password_ok:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = (
                datetime.now(timezone.utc) + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            ).isoformat()
        db.commit()
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Compte non vérifié. Vérifie ton téléphone avant de te connecter.")

    # Connexion réussie : on lève le verrou et on repart avec un compteur propre.
    user.failed_login_attempts = 0
    user.locked_until = None
    # Tracé CRM (cf. Back-Office Admin) : date de dernière connexion.
    user.last_login_at = datetime.now(timezone.utc).isoformat()

    commit_start = time.perf_counter()
    db.commit()
    commit_ms = (time.perf_counter() - commit_start) * 1000

    token_start = time.perf_counter()
    access_token = create_access_token(user.id)
    token_ms = (time.perf_counter() - token_start) * 1000

    total_ms = (time.perf_counter() - login_start) * 1000
    if total_ms >= 500:
        logger.warning(
            "[LOGIN LENT] total=%.0fms (requête=%.0fms, bcrypt=%.0fms, commit=%.0fms, jwt=%.0fms) email=%s",
            total_ms, query_ms, verify_ms, commit_ms, token_ms, form.username,
        )

    return AuthResponse(access_token=access_token, token_type="bearer", user=user)


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
