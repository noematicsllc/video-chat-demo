"""Configuration management using environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Zitadel OAuth configuration
    zitadel_issuer_url: str
    zitadel_client_id: str
    zitadel_client_secret: str

    # LiveKit configuration
    livekit_api_key: str
    livekit_api_secret: str
    livekit_server_url: str = "wss://your-livekit-server.com"

    # Backend configuration
    backend_url: str = "http://localhost:8000"
    cors_origins: str | list[str] = "http://localhost:5173,http://localhost:3000"

    # JWT configuration
    jwt_algorithm: str = "RS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()

