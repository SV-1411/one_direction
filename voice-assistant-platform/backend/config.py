from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AI Voice Assistant Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    MONGODB_URI: str = "mongodb://mongodb:27017/voice_assistant"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    WHISPER_MODEL_SIZE: str = "base"
    OLLAMA_HOST: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "meta-llama/llama-3.2-3b-instruct:free"
    OPENROUTER_APP_URL: str | None = None
    OPENROUTER_APP_NAME: str = "AI Voice Assistant Platform"
    TTS_MODEL: str = "tts_models/en/ljspeech/tacotron2-DDC"
    HUGGINGFACE_TOKEN: str | None = None

    WHATSAPP_TOKEN: str | None = None
    WHATSAPP_PHONE_NUMBER_ID: str | None = None
    WHATSAPP_VERIFY_TOKEN: str | None = None
    N8N_WEBHOOK_URL: str | None = None

    CORS_ORIGINS: list[str] | str = Field(default_factory=lambda: ["http://localhost:3000"])
    FRAUD_ALERT_THRESHOLD: float = 0.65
    URGENCY_ALERT_THRESHOLD: float = 0.80
    AUDIO_STORAGE_PATH: str = "./audio_storage"

    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_EMAIL: str = "admin@example.com"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"

    AUDIO_RETENTION_HOURS: int = 24

    GML_ENABLED: bool = True
    GML_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    GML_DECAY_INTERVAL_HOURS: int = 24
    GML_MIN_CONFIDENCE_THRESHOLD: float = 0.15
    GML_SIMILARITY_THRESHOLD: float = 0.72

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [v.strip() for v in value.split(",") if v.strip()]
        return ["http://localhost:3000"]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
