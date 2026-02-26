import asyncio
import os
import tempfile
import time
from typing import Any

import numpy as np

from config import settings
from utils.logger import get_logger

logger = get_logger("models.whisper")

try:
    import soundfile as sf
    import torch
    import whisper
except Exception:  # pragma: no cover
    whisper = None
    torch = None
    sf = None


class WhisperService:
    SILENCE_THRESHOLD = 0.01
    SAMPLE_RATE = 16000

    def __init__(self):
        self.model = None
        self.available = False
        self.model_name = settings.WHISPER_MODEL_SIZE
        self.load_time_ms = 0
        self.error: str | None = None
        self._stream_buffers: dict[str, bytes] = {}
        self._silence_seconds: dict[str, float] = {}

    async def load_model(self) -> None:
        if whisper is None:
            self.error = "whisper import unavailable"
            return
        start = time.perf_counter()
        try:
            device = "cuda" if torch and torch.cuda.is_available() else "cpu"
            self.model = await asyncio.to_thread(whisper.load_model, self.model_name, device)
            self.available = True
            self.error = None
            self.load_time_ms = int((time.perf_counter() - start) * 1000)
            logger.info("whisper_loaded", model=self.model_name, device=device, load_time_ms=self.load_time_ms)
        except Exception as exc:
            self.error = str(exc)
            self.available = False
            logger.error("whisper_load_failed", error=str(exc))

    async def transcribe(self, audio_bytes: bytes) -> dict[str, Any]:
        if not self.available or self.model is None:
            return {"text": "", "error": "Whisper unavailable", "duration_seconds": 0}

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name

            result = await asyncio.to_thread(self.model.transcribe, temp_path, fp16=False)
            text = (result.get("text") or "").strip()
            language = result.get("language", "unknown")
            segments = result.get("segments", [])

            duration_seconds = 0.0
            if segments:
                duration_seconds = float(max((s.get("end", 0.0) for s in segments), default=0.0))
            elif sf is not None:
                duration_seconds = float(sf.info(temp_path).duration)

            return {
                "text": text,
                "language": language,
                "segments": segments,
                "duration_seconds": duration_seconds,
                "word_count": len(text.split()),
            }
        except Exception as exc:
            logger.error("whisper_transcribe_failed", error=str(exc))
            return {"text": "", "error": str(exc), "duration_seconds": 0}
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    async def transcribe_stream(self, audio_chunk: bytes, session_id: str) -> str:
        previous = self._stream_buffers.get(session_id, b"")
        self._stream_buffers[session_id] = previous + audio_chunk
        buffer = self._stream_buffers[session_id]

        # must have at least 1 second
        if len(buffer) < self.SAMPLE_RATE * 2:
            return ""

        # Check RMS on last 0.5s
        last_half_second = buffer[-int(self.SAMPLE_RATE * 0.5) * 2 :]
        if len(last_half_second) < 2:
            return ""
        chunk_np = np.frombuffer(last_half_second, dtype=np.int16).astype(np.float32)
        rms = float(np.sqrt(np.mean(chunk_np**2)) / 32768.0) if len(chunk_np) else 0.0

        if rms < self.SILENCE_THRESHOLD:
            self._silence_seconds[session_id] = self._silence_seconds.get(session_id, 0.0) + 0.5
        else:
            self._silence_seconds[session_id] = 0.0

        if self._silence_seconds.get(session_id, 0.0) < 1.5:
            return ""

        # transcribe and clear when silence enough
        payload = self._stream_buffers.pop(session_id, b"")
        self._silence_seconds[session_id] = 0.0
        result = await self.transcribe(payload)
        return result.get("text", "")


whisper_service = WhisperService()
