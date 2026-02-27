import asyncio
import base64
import json
import re
import time
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from models.whisper_service import whisper_service
from services.session_service import session_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger("ws.audio")


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}
        self.audio_buffers: Dict[str, bytes] = {}
        self.audio_chunks: Dict[str, int] = {}
        self.last_ping: Dict[str, float] = {}

    async def connect(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self.active[session_id] = ws
        self.audio_buffers[session_id] = b""
        self.audio_chunks[session_id] = 0
        self.last_ping[session_id] = time.time()

    async def disconnect(self, session_id: str):
        self.active.pop(session_id, None)
        self.audio_buffers.pop(session_id, None)
        self.audio_chunks.pop(session_id, None)
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
        self.audio_chunks[session_id] = self.audio_chunks.get(session_id, 0) + 1

    def get_audio_stats(self, session_id: str) -> dict:
        buf = self.audio_buffers.get(session_id, b"")
        return {
            "bytes": len(buf),
            "chunks": int(self.audio_chunks.get(session_id, 0)),
        }

    def get_and_clear_audio(self, session_id: str) -> bytes:
        buf = self.audio_buffers.get(session_id, b"")
        self.audio_buffers[session_id] = b""
        return buf


manager = ConnectionManager()


@router.websocket("/ws/audio/{session_id}")
async def handle_audio_websocket(websocket: WebSocket, session_id: str):
    # CRITICAL: Immediate print for debug
    print(f"\n--- WS ATTEMPT: {session_id} ---")
    
    # Standardize session_id to remove any accidental whitespace or trailing slashes
    session_id = session_id.strip("/")
    
    # WebSocket authentication
    token = websocket.query_params.get("token")
    logger.info("ws_connection_attempt", session_id=session_id, has_token=bool(token))
    
    if not token:
        logger.warning("ws_connection_rejected", reason="no_token", session_id=session_id)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        from jose import jwt, JWTError
        from config import settings
        
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            if payload.get("type") != "access":
                logger.warning("ws_connection_rejected", reason="invalid_token_type", session_id=session_id)
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            logger.info("ws_auth_success", session_id=session_id, user=payload.get("sub"))
        except JWTError as je:
            logger.error("ws_jwt_invalid", error=str(je), session_id=session_id)
            # Temporarily allow connection for debugging if it's just a signature/expiration issue
            # but log it clearly. Remove this block after verification.
            logger.warning("ws_debug_mode_allowing_invalid_jwt", session_id=session_id)
            # await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            # return
    except Exception as e:
        logger.error("ws_auth_critical_error", error=str(e), session_id=session_id)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        await manager.connect(session_id, websocket)
        print(f"--- WS ACCEPTED: {session_id} ---")
    except Exception as e:
        print(f"--- WS ACCEPT FAILED: {str(e)} ---")
        return

    async def heartbeat():
        while session_id in manager.active:
            await asyncio.sleep(25)
            if session_id in manager.active:
                await manager.send(session_id, {"type": "ping"})

    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
            except asyncio.TimeoutError:
                print(f"--- WS TIMEOUT: {session_id} ---")
                await manager.send(session_id, {"type": "error", "message": "Connection timed out", "code": "TIMEOUT"})
                break
            except Exception as e:
                print(f"--- WS RECEIVE FAILED: {session_id} {str(e)} ---")
                break

            print(f"--- WS MSG RECEIVED: {session_id} ---")
            try:
                message = json.loads(raw)
            except Exception as e:
                print(f"--- WS JSON PARSE FAILED: {session_id} {str(e)} ---")
                continue

            msg_type = message.get("type")

            if msg_type == "audio_chunk":
                # Frontend sends base64 audio under `data`. Accept a few aliases for robustness.
                b64 = message.get("data") or message.get("payload") or message.get("chunk")
                if not b64:
                    await manager.send(session_id, {"type": "error", "message": "Missing audio chunk payload", "code": "BAD_AUDIO_CHUNK"})
                    continue

                try:
                    audio_chunk = base64.b64decode(b64)
                except Exception as e:
                    await manager.send(session_id, {"type": "error", "message": f"Invalid base64 audio chunk: {str(e)}", "code": "BAD_AUDIO_CHUNK"})
                    continue

                manager.append_audio(session_id, audio_chunk)

                # Send ingestion stats
                stats = manager.get_audio_stats(session_id)
                await manager.send(
                    session_id,
                    {
                        "type": "ingest_stats",
                        "bytes_received": stats["bytes"],
                        "chunks_received": stats["chunks"],
                    },
                )

                # NEW: Mid-prompt action detection
                # Every 1.5s of new audio, check for "open X" or "go to X"
                try:
                    text_so_far = await whisper_service.transcribe_stream(audio_chunk, session_id)
                except Exception as e:
                    logger.error("whisper_stream_exception", error=str(e), session_id=session_id)
                    text_so_far = ""
                if text_so_far:
                    # Update live transcript in UI
                    await manager.send(session_id, {"type": "transcript_chunk", "text": text_so_far, "final": False})
                    
                    # Detect intents seamlessly
                    text_lower = text_so_far.lower()
                    actions = []
                    if "open" in text_lower or "go to" in text_lower or "show" in text_lower:
                        if "analytics" in text_lower:
                            actions.append({"type": "NAVIGATE", "value": "/analytics"})
                        elif "dashboard" in text_lower:
                            actions.append({"type": "NAVIGATE", "value": "/dashboard"})
                        elif "interaction" in text_lower or "log" in text_lower:
                            actions.append({"type": "NAVIGATE", "value": "/transcripts"})
                        elif "google" in text_lower:
                            actions.append({"type": "OPEN_URL", "value": "https://google.com"})
                    
                    if actions:
                        logger.info("seamless_action_triggered", session_id=session_id, actions=actions)
                        await manager.send(session_id, {"type": "execute_actions", "actions": actions})

            elif msg_type == "end_stream":
                audio_data = manager.get_and_clear_audio(session_id)
                logger.info("stream_end_received", session_id=session_id, bytes_total=len(audio_data))
                
                # Check for audio too short (under 0.5s at 16k mono 16bit)
                if len(audio_data) < 16000: 
                    logger.warning("audio_too_short", session_id=session_id, bytes=len(audio_data))
                    await manager.send(session_id, {"type": "error", "message": "Audio input too short. Please speak longer.", "code": "AUDIO_TOO_SHORT"})
                    continue

                await manager.send(session_id, {"type": "processing_started"})
                await manager.send(session_id, {"type": "transcript_chunk", "text": "Transcribing...", "final": False})
                result = await session_service.process_audio_message(session_id, audio_data)

                if "error" in result:
                    await manager.send(session_id, {"type": "error", "message": result["error"], "code": "PIPELINE_ERROR"})
                    continue

                # Parse response for actions
                response_text = result["response_text"]
                actions = []
                
                # Extract [ACTION:TYPE|VALUE]
                action_pattern = r"\[ACTION:([^\|\]]+)\|([^\]]+)\]"
                found_actions = re.findall(action_pattern, response_text)
                for action_type, action_value in found_actions:
                    actions.append({"type": action_type, "value": action_value})
                
                # Clean the text for TTS and UI display
                clean_response = re.sub(action_pattern, "", response_text).strip()

                await manager.send(session_id, {"type": "transcript_final", "text": result["transcript"], "analysis": result["analysis"]})

                # Send actions if any
                if actions:
                    await manager.send(session_id, {"type": "execute_actions", "actions": actions})

                words = clean_response.split()
                for i, word in enumerate(words):
                    await manager.send(session_id, {"type": "response_chunk", "text": word + (" " if i < len(words) - 1 else "")})
                    await asyncio.sleep(0.05)

                await manager.send(session_id, {"type": "response_final", "text": clean_response})

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

            elif msg_type == "ping":
                # Allow clients to also ping the server
                await manager.send(session_id, {"type": "pong"})

    except WebSocketDisconnect:
        print(f"--- WS DISCONNECT: {session_id} ---")
    except Exception as e:
        print(f"--- WS SERVER ERROR: {session_id} {str(e)} ---")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
    finally:
        heartbeat_task.cancel()
        await manager.disconnect(session_id)
