"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lifeos:lifeos@localhost:5432/lifeos"

    # Auth
    SECRET_KEY: str  # Required - used for JWT signing
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    FRONTEND_URL: str = "http://localhost:3000"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Cookies
    COOKIE_DOMAIN: str | None = None  # None = current domain
    COOKIE_SECURE: bool = True  # True in production (HTTPS)

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
