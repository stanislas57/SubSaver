import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)

    language: Mapped[str] = mapped_column(String, nullable=False, default="fr")
    theme: Mapped[str] = mapped_column(String, nullable=False, default="light")
    currency: Mapped[str] = mapped_column(String, nullable=False, default="EUR")
    notification_pref: Mapped[str] = mapped_column(String, nullable=False, default="all")
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    bank_connected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Vérification d'email à l'inscription (code 6 chiffres, cf. app/core/email_service.py)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_code: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_code_expires_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Réinitialisation de mot de passe (même mécanisme : code 6 chiffres par email)
    reset_code: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_code_expires_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Protection anti brute-force (cf. app/api/v1/auth.py) : compteurs remis à
    # zéro à chaque succès ou à chaque nouveau code émis (register/resend/forgot).
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reset_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Powens (Open Banking) — 1 utilisateur SubServer = 1 utilisateur Powens
    powens_user_token: Mapped[str | None] = mapped_column(String, nullable=True)
    powens_connection_id: Mapped[str | None] = mapped_column(String, nullable=True)

    # Back-office Super Admin (cf. app/api/v1/admin.py)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Dates ISO calculées côté Python (comme le reste des dates de l'app) : nullable
    # car les comptes créés avant cette colonne n'ont pas de valeur connue.
    created_at: Mapped[str | None] = mapped_column(String, nullable=True, default=_now_iso)
    last_login_at: Mapped[str | None] = mapped_column(String, nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    family_members: Mapped[list["FamilyMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    bank_transactions: Mapped[list["BankTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
