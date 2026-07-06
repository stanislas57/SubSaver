from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration de l'application, chargée depuis l'environnement / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Base de données
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/subserver"

    # Sécurité / JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 jours

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


settings = Settings()
