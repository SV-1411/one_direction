import asyncio
import base64
import json
import time
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.session_service import session_service

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}
        self.audio_buffers: Dict[str, bytes] = {}
        self.last_ping: Dict[str, float] = {}

    async def connect(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self.active[session_id] = ws
        self.audio_buffers[session_id] = b""
        self.last_ping[session_id] = time.time()

    async def disconnect(self, session_id: str):
        self.active.pop(session_id, None)
        self.audio_buffers.pop(session_id, None)
        self.last_ping.pop(session_id, None)

    async def send(self, session_id: str, data: dict):
        ws = self.active.get(session_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                await self.disconnect(session_id)

    def append_audio(self, session_id: str, chunk: bytes):
        self.audio_buffers[session_id] = self.audio_buffers.get(session_id, b"") + chunk

    def get_and_clear_audio(self, session_id: str) -> bytes:
        buf = self.audio_buffers.get(session_id, b"")
        self.audio_buffers[session_id] = b""
        return buf


manager = ConnectionManager()


@router.websocket("/ws/audio/{session_id}")
async def handle_audio_websocket(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)

    async def heartbeat():
        while session_id in manager.active:
            await asyncio.sleep(25)
            if session_id in manager.active:
                await manager.send(session_id, {"type": "ping"})

    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        while True:
            raw = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
            message = json.loads(raw)
            msg_type = message.get("type")

            if msg_type == "audio_chunk":
                audio_chunk = base64.b64decode(message["data"])
                manager.append_audio(session_id, audio_chunk)

            elif msg_type == "end_stream":
                audio_data = manager.get_and_clear_audio(session_id)
                if len(audio_data) < 1000:
                    await manager.send(session_id, {"type": "error", "message": "Audio too short", "code": "AUDIO_TOO_SHORT"})
                    continue

                await manager.send(session_id, {"type": "processing_started"})
                await manager.send(session_id, {"type": "transcript_chunk", "text": "Transcribing...", "final": False})
                result = await session_service.process_audio_message(session_id, audio_data)

                if "error" in result:
                    await manager.send(session_id, {"type": "error", "message": result["error"], "code": "PIPELINE_ERROR"})
                    continue

                await manager.send(session_id, {"type": "transcript_final", "text": result["transcript"], "analysis": result["analysis"]})

                words = result["response_text"].split()
                for i, word in enumerate(words):
                    await manager.send(session_id, {"type": "response_chunk", "text": word + (" " if i < len(words) - 1 else "")})
                    await asyncio.sleep(0.05)

                await manager.send(session_id, {"type": "response_final", "text": result["response_text"]})

                audio_b64 = base64.b64encode(result["audio_bytes"]).decode()
                chunk_size = 32768
                for i in range(0, len(audio_b64), chunk_size):
                    await manager.send(session_id, {"type": "audio_chunk", "data": audio_b64[i : i + chunk_size], "index": i // chunk_size})

                await manager.send(
                    session_id,
                    {
                        "type": "audio_complete",
                        "processing_time_ms": result["processing_time_ms"],
                        "emotion": result["analysis"].get("emotion", {}),
                    },
                )

            elif msg_type == "pong":
                manager.last_ping[session_id] = time.time()

    except WebSocketDisconnect:
        pass
    except asyncio.TimeoutError:
        await manager.send(session_id, {"type": "error", "message": "Connection timed out", "code": "TIMEOUT"})
    finally:
        heartbeat_task.cancel()
        await manager.disconnect(session_id)
