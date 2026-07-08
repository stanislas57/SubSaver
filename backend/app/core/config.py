import warnings

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET_KEY = "change-me-in-production"
MIN_SECRET_KEY_LENGTH = 32


class Settings(BaseSettings):
    """Configuration de l'application, chargée depuis l'environnement / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ENVIRONMENT="production" active les garde-fous stricts ci-dessous (cf.
    # _validate_production_safety). Reste "development" par défaut pour ne
    # jamais casser le dev local / les tests / la CI qui n'ont pas de .env.
    ENVIRONMENT: str = "development"

    # Base de données
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/subserver"

    # Sécurité / JWT
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 jours

    # Chiffrement au repos des tokens Powens (cf. app/core/token_encryption.py).
    # Vide en dev : le chiffrement est alors un no-op (comportement préexistant
    # préservé). Générer une clé : python3 -c "from cryptography.fernet import
    # Fernet; print(Fernet.generate_key().decode())"
    TOKEN_ENCRYPTION_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # App
    PROJECT_NAME: str = "SubServer API"
    API_V1_PREFIX: str = "/api/v1"

    # Powens (Open Banking - Bank API)
    POWENS_DOMAIN: str = "subserver-sandbox.biapi.pro"
    POWENS_CLIENT_ID: str = ""
    POWENS_CLIENT_SECRET: str = ""
    POWENS_REDIRECT_URI: str = "https://subserver-frontend.onrender.com/subscriptions"
    POWENS_WEBVIEW_BASE_URL: str = "https://webview.powens.com/connect"
    POWENS_STATE_TTL_MINUTES: int = 10

    # Email (SMTP) — codes de vérification / réinitialisation de mot de passe
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "contact.subserver@proton.me"
    VERIFICATION_CODE_TTL_MINUTES: int = 10

    # Boîte de réception du formulaire de contact -- volontairement distincte
    # de EMAIL_FROM (l'identité d'envoi SMTP) même si elles pointent
    # aujourd'hui vers la même adresse : permet de rediriger le contact vers
    # une autre boîte plus tard sans toucher à la configuration SMTP.
    CONTACT_EMAIL: str = "contact.subserver@proton.me"

    # SMS (OTP) — codes de vérification par SMS lors de l'inscription
    SMS_PROVIDER: str = "dev"  # "dev", "twilio", "vonage", "brevo"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    VONAGE_API_KEY: str = ""
    VONAGE_API_SECRET: str = ""
    BREVO_API_KEY: str = ""
    OTP_TTL_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3

    @model_validator(mode="after")
    def _validate_production_safety(self) -> "Settings":
        """Fail-fast en production sur les secrets non configurés : mieux vaut
        refuser de démarrer qu'un déploiement qui signe des JWT avec un secret
        public. Ne s'applique qu'à ENVIRONMENT="production" (à positionner
        explicitement sur Render) pour ne jamais impacter le dev local, les
        tests ou une CI qui n'ont pas de vrai secret configuré."""
        if self.ENVIRONMENT != "production":
            if self.SECRET_KEY == DEFAULT_SECRET_KEY:
                warnings.warn(
                    "SECRET_KEY utilise la valeur par défaut -- à ne JAMAIS utiliser en production "
                    "(définis ENVIRONMENT=production pour transformer cet avertissement en erreur bloquante).",
                    stacklevel=2,
                )
            return self

        if self.SECRET_KEY == DEFAULT_SECRET_KEY:
            raise ValueError(
                "SECRET_KEY doit être défini via la variable d'environnement SECRET_KEY en production "
                "(valeur par défaut détectée -- refus de démarrer pour éviter de signer des JWT avec "
                "un secret public connu de tous)."
            )
        if len(self.SECRET_KEY) < MIN_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY ne fait que {len(self.SECRET_KEY)} caractères en production "
                f"({MIN_SECRET_KEY_LENGTH} minimum requis) -- génère un secret plus long."
            )
        if not self.TOKEN_ENCRYPTION_KEY:
            warnings.warn(
                "TOKEN_ENCRYPTION_KEY n'est pas configuré en production : les tokens Powens seront "
                "stockés en clair en base (cf. app/core/token_encryption.py).",
                stacklevel=2,
            )
        return self


settings = Settings()
