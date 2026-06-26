from pydantic_settings import BaseSettings
from functools import lru_cache


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

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
