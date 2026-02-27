import asyncio
import io
import os
import re
import time
import wave
import tempfile
from pathlib import Path
from uuid import uuid4

import numpy as np
import edge_tts
from config import settings
from utils.logger import get_logger

logger = get_logger("models.tts")


class TTSService:
    def __init__(self):
        self.available = True
        self.model_name = "EdgeTTS (Cloud Fallback)"
        self.voice = "en-US-AvaNeural"
        self.load_time_ms = 0
        self.error = None

    async def load_model(self) -> None:
        self.available = True
        logger.info("edge_tts_initialized", voice=self.voice)

    async def synthesize(self, text: str) -> bytes:
        processed = re.sub(r"\*\*|\*|_|#", "", (text or "")).replace("\n", " ").strip()[:500]
        if not processed:
            return self._generate_silent_wav(0.5)

        try:
            communicate = edge_tts.Communicate(processed, self.voice)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                temp_path = tmp.name

            await communicate.save(temp_path)

            with open(temp_path, "rb") as f:
                audio_bytes = f.read()

            if os.path.exists(temp_path):
                os.remove(temp_path)

            return audio_bytes
        except Exception as exc:
            logger.error("tts_synthesis_failed", error=str(exc))
            return self._generate_silent_wav(0.5)

    async def synthesize_to_file(self, text: str) -> str:
        data = await self.synthesize(text)
        os.makedirs(settings.AUDIO_STORAGE_PATH, exist_ok=True)
        output_path = os.path.join(settings.AUDIO_STORAGE_PATH, f"{uuid4()}.wav")
        with open(output_path, "wb") as f:
            f.write(data)
        return output_path

    def _generate_silent_wav(self, duration_seconds: float) -> bytes:
        sample_rate = 22050
        samples = np.zeros(int(duration_seconds * sample_rate), dtype=np.int16)
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(samples.tobytes())
        return buffer.getvalue()

    async def cleanup_old_files(self, max_age_hours: int = 24):
        def sync_cleanup():
            root = Path(settings.AUDIO_STORAGE_PATH)
            if not root.exists():
                return 0
            cutoff = time.time() - max_age_hours * 3600
            deleted = 0
            for wav in root.glob("*.wav"):
                if os.path.getmtime(wav) < cutoff:
                    os.remove(wav)
                    deleted += 1
            logger.info("tts_cleanup", deleted=deleted)
            return deleted

        return await asyncio.get_event_loop().run_in_executor(None, sync_cleanup)


tts_service = TTSService()
