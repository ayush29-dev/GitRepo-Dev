"""
Simple in-memory rate limiter.
Limits each IP to MAX_CALLS requests per WINDOW_SECONDS.
Production: swap for Redis-backed limiter.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from collections import defaultdict
import time

MAX_CALLS      = 30    # requests allowed
WINDOW_SECONDS = 60    # per minute

# { ip: [timestamp, timestamp, ...] }
_call_log: dict[str, list[float]] = defaultdict(list)


async def rate_limit_middleware(request: Request, call_next):
    ip  = request.client.host
    now = time.time()

    # Drop timestamps outside the window
    _call_log[ip] = [t for t in _call_log[ip] if now - t < WINDOW_SECONDS]

    if len(_call_log[ip]) >= MAX_CALLS:
        retry_after = int(WINDOW_SECONDS - (now - _call_log[ip][0]))
        return JSONResponse(
            status_code=429,
            content={"detail": f"Rate limit exceeded. Retry in {retry_after}s."},
            headers={"Retry-After": str(retry_after)},
        )

    _call_log[ip].append(now)
    return await call_next(request)
