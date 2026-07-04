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


settings = Settings()
