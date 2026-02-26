import time

from config import settings
from models.ollama_service import ollama_service
from models.sentiment_service import sentiment_service
from models.tts_service import tts_service
from models.whisper_service import whisper_service
from models.emotion_service import emotion_service


class ModelManager:
    def __init__(self):
        self.whisper_status = {"available": False, "model_name": settings.WHISPER_MODEL_SIZE, "load_time_ms": 0, "error": None}
        self.ollama_status = {"available": False, "model_name": settings.OLLAMA_MODEL, "load_time_ms": 0, "error": None}
        self.tts_status = {"available": False, "model_name": settings.TTS_MODEL, "load_time_ms": 0, "error": None}
        self.sentiment_status = {
            "available": False,
            "model_name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
            "load_time_ms": 0,
            "error": None,
        }
        self.emotion_status = {"available": False, "model_name": "librosa acoustic analysis", "load_time_ms": 0, "error": None}

    async def initialize(self) -> None:
        ws = time.perf_counter()
        await whisper_service.load_model()
        self.whisper_status = {
            "available": whisper_service.available,
            "model_name": whisper_service.model_name,
            "load_time_ms": whisper_service.load_time_ms,
            "error": whisper_service.error,
        }

        ts = time.perf_counter()
        await tts_service.load_model()
        self.tts_status = {
            "available": tts_service.available,
            "model_name": tts_service.model_name,
            "load_time_ms": tts_service.load_time_ms,
            "error": tts_service.error,
        }

        ss = time.perf_counter()
        await sentiment_service.load_model()
        self.sentiment_status = {
            "available": sentiment_service.available,
            "model_name": sentiment_service.model_name,
            "load_time_ms": sentiment_service.load_time_ms,
            "error": sentiment_service.error,
        }

        os = time.perf_counter()
        ok = await ollama_service.check_availability()
        try:
            self.emotion_status = {
                "available": emotion_service.available,
                "model_name": "librosa acoustic analysis",
                "load_time_ms": 0,
                "error": None if emotion_service.available else "librosa not installed",
            }
        except Exception as e:
            self.emotion_status = {"available": False, "model_name": "librosa acoustic analysis", "load_time_ms": 0, "error": str(e)}

        self.ollama_status = {
            "available": ok,
            "model_name": ollama_service.model_name,
            "load_time_ms": int((time.perf_counter() - os) * 1000),
            "error": ollama_service.error,
        }

    async def warmup_all(self) -> None:
        if whisper_service.available:
            await whisper_service.transcribe(tts_service._generate_silent_wav(0.2))
        if ollama_service.available:
            await ollama_service.chat("Hello", [], "You are a test assistant.")
        if sentiment_service.available:
            sentiment_service.analyze("This is a test message")
        if tts_service.available:
            await tts_service.synthesize("Warmup")

    async def get_health(self) -> dict:
        return {
            "whisper": self.whisper_status,
            "ollama": self.ollama_status,
            "tts": self.tts_status,
            "sentiment": self.sentiment_status,
            "emotion": self.emotion_status,
        }


model_manager = ModelManager()
