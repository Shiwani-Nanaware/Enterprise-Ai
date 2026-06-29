"""Sliding-window in-memory rate limiter middleware.

Limits requests per user/IP to prevent abuse. Uses an in-memory
dict keyed on IP address (good enough for single-instance deployment;
use Redis for multi-instance production).
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limit — configurable requests per minute per IP."""

    def __init__(self, app, requests_per_minute: int = 60, burst: int = 100) -> None:
        super().__init__(app)
        self._rpm = requests_per_minute
        self._burst = burst
        self._window = 60.0  # seconds
        self._hits: dict[str, Deque[float]] = defaultdict(deque)

    def _get_key(self, request: Request) -> str:
        # Prefer authenticated user ID if injected by auth middleware,
        # fall back to client IP.
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        if not settings.rate_limit_enabled:
            return await call_next(request)

        key = self._get_key(request)
        now = time.monotonic()
        window_start = now - self._window
        hits = self._hits[key]

        # Evict old hits
        while hits and hits[0] < window_start:
            hits.popleft()

        if len(hits) >= self._rpm:
            logger.warning("Rate limit exceeded", ip=key, hits=len(hits))
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Max {self._rpm} requests/minute.",
                        "detail": {"retry_after": 60},
                    },
                },
                headers={"Retry-After": "60", "X-RateLimit-Limit": str(self._rpm)},
            )

        hits.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self._rpm)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self._rpm - len(hits)))
        return response
