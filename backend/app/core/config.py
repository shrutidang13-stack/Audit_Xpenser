from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./auditxpenser.db"
    ai_provider: str = "mock"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    upload_dir: str = "uploads"
    app_env: str = "development"
    upload_retention_runs: int = 10
    upload_retention_files: int = 900
    audit_retention_runs: int = 10
    log_retention_bytes: int = 2_097_152

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
