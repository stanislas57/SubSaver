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
    # Nullable : un compte créé via Google (ou un futur fournisseur OAuth) n'a
    # pas de mot de passe -- cf. app/api/v1/auth.py::login qui doit se garder
    # d'appeler verify_password() sur None pour ces comptes.
    hashed_password: Mapped[str | None] = mapped_column(String, nullable=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)

    language: Mapped[str] = mapped_column(String, nullable=False, default="fr")
    theme: Mapped[str] = mapped_column(String, nullable=False, default="light")
    currency: Mapped[str] = mapped_column(String, nullable=False, default="EUR")
    notification_pref: Mapped[str] = mapped_column(String, nullable=False, default="all")
    # Délai (en jours) avant chaque renouvellement auquel envoyer l'alerte
    # in-app + email (cf. app/core/renewal_alerts.py) -- 7, 10 ou 14,
    # contraint côté schéma Pydantic (ProfileUpdate), pas en base.
    alert_delay_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Date ISO de la souscription Premium, posée une seule fois par
    # POST /users/me/upgrade-premium (jamais réécrite ensuite). Null pour les
    # comptes passés Premium avant l'ajout de cette colonne, ou jamais
    # upgradés -- cf. enrich_detected_subscriptions qui doit s'en accommoder.
    premium_since: Mapped[str | None] = mapped_column(String, nullable=True)
    bank_connected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Le compte est actif dès la création (pas de vérification email/SMS) --
    # conservé à True par défaut pour tous les nouveaux comptes ; la colonne
    # reste pour les comptes déjà en base d'avant ce changement.
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Réinitialisation de mot de passe (même mécanisme : code 6 chiffres par email)
    reset_code: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_code_expires_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Protection anti brute-force (cf. app/api/v1/auth.py) : compteurs remis à
    # zéro à chaque succès ou à chaque nouveau code émis (register/resend/forgot).
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Powens (Open Banking) - 1 utilisateur SubSaver = 1 utilisateur Powens
    powens_user_token: Mapped[str | None] = mapped_column(String, nullable=True)
    powens_connection_id: Mapped[str | None] = mapped_column(String, nullable=True)
    # Nom de l'établissement bancaire (ex: "BNP Paribas"), récupéré au mieux
    # depuis Powens juste après le callback -- reste null si l'appel échoue
    # (dégradation gracieuse, cf. handle_callback) sans jamais bloquer la
    # connexion bancaire elle-même.
    bank_name: Mapped[str | None] = mapped_column(String, nullable=True)
    # Date ISO de la dernière synchronisation de transactions réussie
    # (POST /bank/transactions/sync), affichée sur la page Banque pour
    # réassurer l'utilisateur que la connexion est active.
    last_bank_sync_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Back-office Super Admin (cf. app/api/v1/admin.py)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Dates ISO calculées côté Python (comme le reste des dates de l'app) : nullable
    # car les comptes créés avant cette colonne n'ont pas de valeur connue.
    created_at: Mapped[str | None] = mapped_column(String, nullable=True, default=_now_iso)
    last_login_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Charte informatique : null tant que l'utilisateur ne l'a jamais acceptée --
    # c'est ce champ qui déclenche la modale bloquante (CharterGate côté
    # frontend) à la première connexion, puis plus jamais une fois renseigné.
    charter_accepted_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Connexion Google (cf. app/core/security.py::verify_google_id_token) --
    # `google_sub` est l'identifiant stable Google ("sub"), jamais l'email
    # (qui peut changer), utilisé comme clé de correspondance principale.
    # `auth_provider` reste "password" même après liaison d'un compte Google
    # à un compte mot de passe existant (réconciliation) : il ne décrit que
    # la façon dont le compte a été CRÉÉ, pas tous ses moyens de connexion.
    google_sub: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    auth_provider: Mapped[str] = mapped_column(String, nullable=False, default="password")

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    family_members: Mapped[list["FamilyMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    bank_transactions: Mapped[list["BankTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
