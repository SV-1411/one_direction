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
    from transformers import pipeline
    from pydub import AudioSegment
    import io
except Exception:  # pragma: no cover
    pipeline = None
    torch = None
    sf = None
    AudioSegment = None


class WhisperService:
    SILENCE_THRESHOLD = 0.01
    SAMPLE_RATE = 16000

    def __init__(self):
        self.pipe = None
        self.available = False
        self.model_name = "openai/whisper-base"
        self.load_time_ms = 0
        self.error: str | None = None
        self._stream_buffers: dict[str, bytes] = {}
        self._silence_seconds: dict[str, float] = {}

    async def load_model(self) -> None:
        if pipeline is None:
            self.error = "transformers pipeline unavailable"
            return
        start = time.perf_counter()
        try:
            # Using transformers pipeline which can handle raw numpy arrays 
            # and doesn't strictly depend on system-wide ffmpeg for raw inference.
            device = "cuda" if torch and torch.cuda.is_available() else "cpu"
            self.pipe = await asyncio.to_thread(
                pipeline,
                "automatic-speech-recognition",
                model=self.model_name,
                device=device
            )
            self.available = True
            self.error = None
            self.load_time_ms = int((time.perf_counter() - start) * 1000)
            logger.info("whisper_pipeline_loaded", model=self.model_name, device=device, load_time_ms=self.load_time_ms)
        except Exception as exc:
            self.error = str(exc)
            self.available = False
            logger.error("whisper_load_failed", error=str(exc))

    async def transcribe(self, audio_bytes: bytes) -> dict[str, Any]:
        if not self.available or self.pipe is None:
            logger.error("whisper_transcribe_aborted", reason="not_available")
            return {"text": "", "error": "Whisper unavailable", "duration_seconds": 0}

        logger.info("whisper_transcribe_start", bytes_len=len(audio_bytes))
        
        try:
            # The frontend now sends raw 16kHz Int16 PCM data.
            # No need for pydub or ffmpeg decoding.
            
            # Convert bytes to numpy int16, then normalize to float32 [-1, 1]
            audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            
            if len(audio_np) == 0:
                return {"text": "", "error": "Empty audio data", "duration_seconds": 0}

            duration_seconds = len(audio_np) / self.SAMPLE_RATE
            logger.info("whisper_audio_received", duration=duration_seconds, sample_count=len(audio_np))

            # Use transformers pipeline for transcription
            result = await asyncio.to_thread(self.pipe, audio_np)
            text = (result.get("text") or "").strip()
            
            logger.info("whisper_transcribe_success", text_len=len(text), text_preview=text[:50])

            return {
                "text": text,
                "language": "unknown",
                "segments": [],
                "duration_seconds": duration_seconds,
                "word_count": len(text.split()),
            }
        except Exception as exc:
            logger.error("whisper_transcribe_failed", error=str(exc), exc_info=True)
            return {"text": "", "error": str(exc), "duration_seconds": 0}

    async def transcribe_stream(self, audio_chunk: bytes, session_id: str) -> str:
        previous = self._stream_buffers.get(session_id, b"")
        self._stream_buffers[session_id] = previous + audio_chunk
        buffer = self._stream_buffers[session_id]

        # Use a small "processing window" to detect intents mid-prompt
        # Process every ~1.5s of new audio
        chunk_threshold = self.SAMPLE_RATE * 2 * 1.5
        if len(buffer) < chunk_threshold:
            return ""

        # Avoid overwhelming with too many transcriptions
        last_process_time = self._silence_seconds.get(f"{session_id}_last_ts", 0)
        if time.time() - last_process_time < 1.0:
            return ""
        
        try:
            # Decode and transcribe the current buffer
            audio_np = np.frombuffer(buffer, dtype=np.int16).astype(np.float32) / 32768.0
            result = await asyncio.to_thread(self.pipe, audio_np)
            text = (result.get("text") or "").strip()
            
            self._silence_seconds[f"{session_id}_last_ts"] = time.time()
            return text
        except Exception as exc:
            logger.error("whisper_stream_failed", error=str(exc))
            return ""


whisper_service = WhisperService()
