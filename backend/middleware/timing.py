"""Request timing middleware.

Records wall-clock processing time for every request and injects it as
an ``X-Process-Time`` response header (in milliseconds).
"""

import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.logging import get_logger

logger = get_logger(__name__)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Middleware that measures and logs request processing duration.

    Attaches an ``X-Process-Time`` header to each response and logs slow
    requests (>500 ms) at WARNING level for performance monitoring.
    """

    SLOW_REQUEST_THRESHOLD_MS: float = 500.0

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        """Measure request processing time and attach it to the response.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or route handler.

        Returns:
            Response: The HTTP response with ``X-Process-Time`` header.
        """
        start_time = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"

        log_kwargs = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(elapsed_ms, 2),
        }

        if elapsed_ms > self.SLOW_REQUEST_THRESHOLD_MS:
            logger.warning("Slow request detected", **log_kwargs)
        else:
            logger.debug("Request completed", **log_kwargs)

        return response
