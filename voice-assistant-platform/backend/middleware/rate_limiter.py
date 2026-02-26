import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException


class InMemoryRateLimiter:
    def __init__(self):
        self.hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str, limit: int, per_seconds: int) -> None:
        now = time.time()
        bucket = self.hits[key]
        while bucket and bucket[0] <= now - per_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        bucket.append(now)


limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"
