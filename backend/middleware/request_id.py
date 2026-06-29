"""Request ID middleware.

Injects a unique ``X-Request-ID`` header into every request/response cycle
for distributed tracing and log correlation.
"""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware that attaches a unique request ID to every request.

    If the client supplies an ``X-Request-ID`` header the value is preserved;
    otherwise a new UUID4 is generated.  The ID is attached to the response
    headers and injected into the structlog context vars so every log line
    emitted during the request lifecycle carries it automatically.
    """

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        """Process the request, inject request ID, and pass through.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or route handler.

        Returns:
            Response: The HTTP response with ``X-Request-ID`` header attached.
        """
        import structlog

        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
