from fastapi import Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
rate_limit_exceeded_handler = RateLimitExceeded


def audio_key_func(request: Request) -> str:
    return f"audio:{get_remote_address(request)}"
