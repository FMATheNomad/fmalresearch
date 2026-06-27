import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "FMA Labs Research"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://localhost:5432/fmalresearch"
    redis_url: str = "redis://localhost:6379/0"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-v4-flash"

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    searxng_base_url: str = "http://localhost:8888"

    meilisearch_url: str = "http://localhost:7700"
    meilisearch_api_key: str = ""

    polar_access_token: str = ""
    polar_organization_id: str = ""

    sentry_dsn: str = ""
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    max_concurrent_crawls: int = 10
    research_timeout_minutes: int = 120

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "noreply@fmalresearch.ai"

    railway_service_name: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    railway_db = os.environ.get("DATABASE_URL")
    if railway_db and railway_db.startswith("postgresql://"):
        settings.database_url = railway_db.replace("postgresql://", "postgresql+asyncpg://", 1)

    railway_redis = os.environ.get("REDIS_URL")
    if railway_redis:
        settings.redis_url = railway_redis

    rail_url = os.environ.get("RAILWAY_STATIC_URL")
    if rail_url:
        settings.cors_origins = [
            f"https://{rail_url}",
            f"https://frontend-{rail_url}",
            "http://localhost:3000",
            "http://localhost:5173",
        ]

    rail_api_url = os.environ.get("RAILWAY_PRIVATE_DOMAIN")
    if rail_api_url:
        settings.cors_origins.append(f"https://{rail_api_url}")

    rail_url_str = os.environ.get("RAILWAY_STATIC_URL")
    if rail_url_str:
        settings.google_redirect_uri = f"https://{rail_url_str}/auth/google/callback"

    return settings
