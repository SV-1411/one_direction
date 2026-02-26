import logging
import sys
import uuid
from typing import Any

import structlog
from starlette.requests import Request

from config import settings

SENSITIVE_KEYS = {"password", "token", "audio_data", "api_key", "authorization", "refresh_token"}


def _mask_sensitive(_, __, event_dict: dict[str, Any]) -> dict[str, Any]:
    def sanitize(value: Any):
        if isinstance(value, str) and len(value) > 8:
            return f"{value[:4]}...{value[-4:]}"
        if isinstance(value, dict):
            return {k: ("***REDACTED***" if k.lower() in SENSITIVE_KEYS else sanitize(v)) for k, v in value.items()}
        if isinstance(value, list):
            return [sanitize(v) for v in value]
        return value

    return sanitize(event_dict)


def _inject_request_id(_, __, event_dict: dict[str, Any]) -> dict[str, Any]:
    if "request_id" not in event_dict:
        event_dict["request_id"] = str(uuid.uuid4())
    return event_dict


def configure_logging() -> None:
    processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        _inject_request_id,
        _mask_sensitive,
    ]
    renderer = structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer()

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    )
    structlog.configure(
        processors=[*processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def bind_request_context(request: Request) -> None:
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request.headers.get("x-request-id", str(uuid.uuid4())),
        method=request.method,
        path=str(request.url.path),
    )


def clear_request_context() -> None:
    structlog.contextvars.clear_contextvars()


def get_logger(name: str = "app"):
    return structlog.get_logger(name)
