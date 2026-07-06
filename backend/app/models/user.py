import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


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

    # Powens (Open Banking) — 1 utilisateur SubServer = 1 utilisateur Powens
    powens_user_token: Mapped[str | None] = mapped_column(String, nullable=True)
    powens_connection_id: Mapped[str | None] = mapped_column(String, nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    family_members: Mapped[list["FamilyMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    bank_transactions: Mapped[list["BankTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
