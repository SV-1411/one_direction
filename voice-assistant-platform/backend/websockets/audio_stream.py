import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.session_service import process_text_like
from utils.helpers import b64_decode, b64_encode

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active.pop(session_id, None)


manager = ConnectionManager()


@router.websocket("/ws/audio/{session_id}")
async def audio_ws(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    last_ping = asyncio.get_event_loop().time()
    try:
        while True:
            message = await asyncio.wait_for(websocket.receive_json(), timeout=30)
            msg_type = message.get("type")
            if msg_type == "ping":
                last_ping = asyncio.get_event_loop().time()
                await websocket.send_json({"type": "pong"})
            elif msg_type == "audio_chunk":
                audio = b64_decode(message.get("data", ""))
                result = await process_text_like(session_id, text="[streamed-audio-chunk]")
                await websocket.send_json({"type": "transcript_final", "text": result["transcript"], "analysis": result["analysis"]})
                await websocket.send_json({"type": "response_final", "text": result["response_text"]})
                if result["audio_bytes"]:
                    await websocket.send_json({"type": "audio_chunk", "data": b64_encode(result["audio_bytes"])})
                    await websocket.send_json({"type": "audio_complete", "duration_ms": 1200})
            elif msg_type == "end_stream":
                await websocket.send_json({"type": "response_chunk", "text": "Stream ended"})
                break
            if asyncio.get_event_loop().time() - last_ping > 30:
                await websocket.send_json({"type": "error", "message": "Heartbeat timeout", "code": "TIMEOUT"})
                break
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        manager.disconnect(session_id)
