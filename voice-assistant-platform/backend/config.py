from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Voice Assistant Platform"
    debug: bool = False
    log_level: str = "INFO"

    mongodb_uri: str = "mongodb://mongodb:27017/voice_assistant"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    whatsapp_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_verify_token: str | None = None
    huggingface_token: str | None = None
    n8n_webhook_url: str | None = None

    ollama_host: str = "http://ollama:11434"
    ollama_model: str = "llama3"
    whisper_model_size: str = "base"
    tts_model: str = "tts_models/en/ljspeech/tacotron2-DDC"

    cors_origins: str = "http://localhost:3000"
    audio_storage_path: str = "./audio_storage"

    fraud_alert_threshold: float = 0.65
    urgency_alert_threshold: float = 0.80
    audio_retention_seconds: int = Field(default=300)


settings = Settings()
