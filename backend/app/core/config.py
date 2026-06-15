from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./auditxpenser.db"
    ai_provider: str = "mock"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    upload_dir: str = "uploads"
    app_env: str = "development"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
