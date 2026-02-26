import base64
import re
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, Iterable

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


def generate_api_key() -> str:
    return secrets.token_hex(16)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def encode_audio_b64(audio_bytes: bytes) -> str:
    return base64.b64encode(audio_bytes).decode("utf-8")


def decode_audio_b64(b64_string: str) -> bytes:
    return base64.b64decode(b64_string.encode("utf-8"))


def calculate_levenshtein_similarity(s1: str, s2: str) -> float:
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    rows = len(s1) + 1
    cols = len(s2) + 1
    dist = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dist[i][0] = i
    for j in range(cols):
        dist[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dist[i][j] = min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost)
    lev = dist[-1][-1]
    return max(0.0, 1.0 - (lev / max(len(s1), len(s2))))


def mask_sensitive_string(s: str | None) -> str:
    if not s:
        return ""
    if len(s) <= 8:
        return "*" * len(s)
    return f"{s[:4]}...{s[-4:]}"


def sanitize_filename(filename: str) -> str:
    base = Path(filename).name
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return safe[:255]


def chunk_list(lst: Iterable, size: int) -> Generator[list, None, None]:
    if size <= 0:
        raise ValueError("size must be positive")
    chunk = []
    for item in lst:
        chunk.append(item)
        if len(chunk) == size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk
