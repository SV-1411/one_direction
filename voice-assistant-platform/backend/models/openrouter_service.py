import httpx

from config import settings
from utils.logger import get_logger

logger = get_logger("models.openrouter")


SYSTEM_PROMPT = (
    "You are a helpful, empathetic voice assistant. Keep responses concise and conversational. "
    "If you detect distress or urgency in the user's message, acknowledge it first before helping. "
    "ACTIONS: You can trigger browser actions by including a special tag in your response. "
    "To open a website, use: [ACTION:OPEN_URL|https://example.com]. "
    "To navigate the app, use: [ACTION:NAVIGATE|/dashboard] or [ACTION:NAVIGATE|/analytics]. "
    "Only use actions if the user explicitly asks to 'open', 'go to', or 'show' something. "
    "The action tag will be stripped from the speech but executed by the UI."
)


class OpenRouterService:
    def __init__(self):
        self.available = False
        self.model_name = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self.api_key = settings.OPENROUTER_API_KEY
        self.error: str | None = None

    async def check_availability(self) -> bool:
        if not self.api_key:
            self.available = False
            self.error = "OPENROUTER_API_KEY not set"
            return False
        self.available = True
        self.error = None
        return True

    def _headers(self) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        # Optional but helpful metadata for OpenRouter.
        if settings.OPENROUTER_APP_URL:
            headers["HTTP-Referer"] = settings.OPENROUTER_APP_URL
        if settings.OPENROUTER_APP_NAME:
            headers["X-Title"] = settings.OPENROUTER_APP_NAME
        return headers

    async def chat(
        self,
        transcript: str,
        session_history: list[dict],
        system_prompt: str = SYSTEM_PROMPT,
    ) -> str:
        if not await self.check_availability():
            return "I'm having trouble processing that right now. Please try again."

        messages = self._build_messages(transcript, session_history, system_prompt)
        
        # Define a prioritized list of models to ensure we get a response.
        models_to_try = [
            self.model_name, # google/gemini-2.0-flash-exp:free
            "meta-llama/llama-3.1-8b-instruct:free",
            "google/gemini-2.0-flash-lite:free",
            "mistralai/mistral-7b-instruct:free"
        ]

        async with httpx.AsyncClient(timeout=60) as client:
            for model in models_to_try:
                try:
                    payload = {"model": model, "messages": messages}
                    logger.info("openrouter_attempt", model=model)
                    
                    r = await client.post(f"{self.base_url}/chat/completions", headers=self._headers(), json=payload)
                    
                    if r.status_code == 200:
                        data = r.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content")
                        if content:
                            logger.info("openrouter_success", model=model)
                            return content
                    
                    # Log full error for debugging
                    logger.error(
                        "openrouter_model_failed",
                        model=model,
                        status_code=r.status_code,
                        response_text=r.text
                    )
                    print(f"!!! OPENROUTER FAIL [{model}] status={r.status_code} resp={r.text[:200]}")
                except Exception as e:
                    logger.error("openrouter_request_exception", model=model, error=str(e))
                    print(f"!!! OPENROUTER EXC [{model}] error={str(e)}")
                    continue

        return "I'm having trouble processing that right now. Please try again."

    def _build_messages(self, transcript: str, session_history: list[dict], system_prompt: str) -> list[dict]:
        normalized: list[dict] = []
        for m in (session_history or [])[-10:]:
            role = m.get("role", "user")
            content = m.get("content") or m.get("transcript") or m.get("response") or ""
            if content:
                normalized.append({"role": role, "content": content})
        return [{"role": "system", "content": system_prompt}, *normalized, {"role": "user", "content": transcript}]


openrouter_service = OpenRouterService()
