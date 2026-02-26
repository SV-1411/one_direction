from models.whisper_service import whisper_service
from models.ollama_service import ollama_service
from models.tts_service import tts_service
from models.sentiment_service import sentiment_service


class ModelManager:
    def __init__(self):
        self.status = {
            "whisper": {"available": False},
            "ollama": {"available": False},
            "tts": {"available": False},
            "sentiment": {"available": False},
        }

    async def initialize(self):
        whisper_service.load()
        tts_service.load()
        sentiment_service.load()
        await ollama_service.health_check()

        self.status["whisper"]["available"] = whisper_service.available
        self.status["tts"]["available"] = tts_service.available
        self.status["sentiment"]["available"] = sentiment_service.available
        self.status["ollama"]["available"] = ollama_service.available

    def health(self):
        return self.status


model_manager = ModelManager()
