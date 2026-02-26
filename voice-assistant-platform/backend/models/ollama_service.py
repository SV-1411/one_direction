import json
from collections.abc import AsyncGenerator

import httpx

from config import settings
from utils.logger import get_logger

logger = get_logger("models.ollama")

SYSTEM_PROMPT = (
    "You are a helpful, empathetic voice assistant. Keep responses concise and conversational. "
    "If you detect distress or urgency in the user's message, acknowledge it first before helping."
)


class OllamaService:
    def __init__(self):
        self.available = False
        self.model_name = settings.OLLAMA_MODEL
        self.host = settings.OLLAMA_HOST
        self.error: str | None = None

    async def check_availability(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.host}/api/tags")
                response.raise_for_status()
                models = response.json().get("models", [])
                found = any((m.get("name", "").split(":")[0]).startswith("llama3") for m in models)
                self.available = bool(found)
                return self.available
        except Exception as exc:
            self.error = str(exc)
            self.available = False
            return False

    async def chat(self, transcript: str, session_history: list[dict], system_prompt: str = SYSTEM_PROMPT, user_id: str = None, db=None) -> str:
        if not self.available and not await self.check_availability():
            return "I'm having trouble processing that right now. Please try again."

        memory_context = ""
        if user_id and db is not None:
            try:
                from gml.memory_engine import memory_engine

                recall = await memory_engine.recall(db, user_id, transcript, top_k=3)
                memory_context = recall.get("memory_context", "")
            except Exception:
                memory_context = ""

        enhanced_system = f"{memory_context}\n\n{system_prompt}" if memory_context else system_prompt
        messages = self._build_messages(transcript, session_history, enhanced_system)
        payload = {"model": self.model_name, "messages": messages, "stream": False}
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(f"{self.host}/api/chat", json=payload)
                r.raise_for_status()
                return r.json().get("message", {}).get("content", "I'm here to help.")
        except Exception as exc:
            logger.error("ollama_chat_failed", error=str(exc))
            return "I'm having trouble processing that right now. Please try again."

    async def chat_stream(
        self,
        transcript: str,
        session_history: list[dict],
        system_prompt: str = SYSTEM_PROMPT,
    ) -> AsyncGenerator[str, None]:
        if not self.available and not await self.check_availability():
            yield "I'm having trouble connecting to the language model right now."
            return

        memory_context = ""
        if user_id and db is not None:
            try:
                from gml.memory_engine import memory_engine

                recall = await memory_engine.recall(db, user_id, transcript, top_k=3)
                memory_context = recall.get("memory_context", "")
            except Exception:
                memory_context = ""

        enhanced_system = f"{memory_context}\n\n{system_prompt}" if memory_context else system_prompt
        messages = self._build_messages(transcript, session_history, enhanced_system)
        payload = {"model": self.model_name, "messages": messages, "stream": True}

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream("POST", f"{self.host}/api/chat", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        if chunk.get("done") is True:
                            break
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
        except Exception:
            yield "I'm having trouble connecting to the language model right now."

    def _build_messages(self, transcript: str, session_history: list[dict], system_prompt: str) -> list[dict]:
        normalized = []
        for m in session_history[-10:]:
            role = m.get("role", "user")
            normalized.append({"role": role, "content": m.get("transcript", "")})
        return [{"role": "system", "content": system_prompt}, *normalized, {"role": "user", "content": transcript}]


ollama_service = OllamaService()
