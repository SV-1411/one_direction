import os
import uuid

from config import settings
from utils.logger import get_logger

logger = get_logger("tts")

try:
    from TTS.api import TTS
except Exception:  # pragma: no cover
    TTS = None


class TTSService:
    def __init__(self):
        self.model = None
        self.available = False

    def load(self):
        if TTS is None:
            logger.warning("tts_import_failed")
            return
        try:
            self.model = TTS(settings.tts_model)
            self.available = True
            logger.info("tts_loaded", model=settings.tts_model)
        except Exception as exc:
            logger.warning("tts_unavailable", error=str(exc))

    def synthesize(self, text: str) -> tuple[bytes, str]:
        if not self.available or self.model is None:
            raise RuntimeError("TTS_UNAVAILABLE")
        os.makedirs(settings.audio_storage_path, exist_ok=True)
        file_name = f"{uuid.uuid4()}.wav"
        path = os.path.join(settings.audio_storage_path, file_name)
        self.model.tts_to_file(text=text, file_path=path)
        with open(path, "rb") as f:
            data = f.read()
        return data, path


tts_service = TTSService()
