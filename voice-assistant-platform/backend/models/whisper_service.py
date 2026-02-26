from config import settings
from utils.logger import get_logger

logger = get_logger("whisper")

try:
    import whisper
except Exception:  # pragma: no cover
    whisper = None


class WhisperService:
    def __init__(self):
        self.model = None
        self.available = False

    def load(self):
        if whisper is None:
            logger.warning("whisper_import_failed")
            return
        try:
            self.model = whisper.load_model(settings.whisper_model_size)
            self.available = True
            logger.info("whisper_loaded", model=settings.whisper_model_size)
        except Exception as exc:
            logger.warning("whisper_unavailable", error=str(exc))

    def transcribe(self, audio_path: str) -> str:
        if not self.available or self.model is None:
            raise RuntimeError("WHISPER_UNAVAILABLE")
        result = self.model.transcribe(audio_path)
        return result.get("text", "").strip()


whisper_service = WhisperService()
