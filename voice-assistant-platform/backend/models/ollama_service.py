import httpx
from config import settings


class OllamaService:
    def __init__(self):
        self.available = False

    async def health_check(self):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{settings.ollama_host}/api/tags")
                self.available = response.status_code == 200
        except Exception:
            self.available = False

    async def chat(self, message: str, history: list[dict]):
        if not self.available:
            raise RuntimeError("OLLAMA_UNAVAILABLE")
        prompt = "\n".join([f"{h['role']}: {h['transcript']}" for h in history[-8:]]) + f"\nuser: {message}\nassistant:"
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{settings.ollama_host}/api/generate",
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            r.raise_for_status()
            return r.json().get("response", "I could not generate a response right now.")


ollama_service = OllamaService()
