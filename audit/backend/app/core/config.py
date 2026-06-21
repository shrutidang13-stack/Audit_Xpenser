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
    smtp_host: str = ""
    smtp_port: int = 0
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True
    msme_enabled: bool = False
    msme_api_base_url: str = "http://127.0.0.1:3001"
    msme_timeout_seconds: int = 30
    msme_api_token: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
