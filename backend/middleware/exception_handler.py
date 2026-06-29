"""Global exception handler registration.

Maps all application exceptions to structured JSON error responses
with consistent format across the entire API.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.exceptions import AppException
from core.logging import get_logger

logger = get_logger(__name__)


def _error_response(
    status_code: int,
    error_code: str,
    message: str,
    detail: dict | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    """Build a standardized JSON error response.

    Args:
        status_code: HTTP status code.
        error_code: Machine-readable error identifier.
        message: Human-readable error description.
        detail: Optional dictionary with extra diagnostic information.
        request_id: Optional trace ID from the request context.

    Returns:
        JSONResponse: A structured error response.
    """
    body: dict = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "detail": detail or {},
        },
    }
    if request_id:
        body["request_id"] = request_id

    return JSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI application.

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
        """Handle all domain and infrastructure AppException subclasses."""
        request_id = request.headers.get("X-Request-ID")
        logger.warning(
            "Application exception",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            request_id=request_id,
            path=request.url.path,
        )
        return _error_response(
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            detail=exc.detail,
            request_id=request_id,
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Handle standard Starlette HTTP exceptions (e.g., 404, 405)."""
        request_id = request.headers.get("X-Request-ID")
        logger.warning(
            "HTTP exception",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
        )
        return _error_response(
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
            message=str(exc.detail),
            request_id=request_id,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic v2 request body / query parameter validation errors."""
        request_id = request.headers.get("X-Request-ID")
        errors = []
        for error in exc.errors():
            errors.append(
                {
                    "field": ".".join(str(loc) for loc in error.get("loc", [])),
                    "message": error.get("msg", ""),
                    "type": error.get("type", ""),
                }
            )
        logger.info(
            "Request validation error",
            errors=errors,
            path=request.url.path,
        )
        return _error_response(
            status_code=422,
            error_code="REQUEST_VALIDATION_ERROR",
            message="Request validation failed.",
            detail={"errors": errors},
            request_id=request_id,
        )

    @app.exception_handler(PydanticValidationError)
    async def handle_pydantic_validation_error(
        request: Request, exc: PydanticValidationError
    ) -> JSONResponse:
        """Handle Pydantic v2 schema validation errors raised in service code."""
        request_id = request.headers.get("X-Request-ID")
        logger.warning(
            "Pydantic validation error",
            errors=exc.errors(),
            path=request.url.path,
        )
        return _error_response(
            status_code=422,
            error_code="SCHEMA_VALIDATION_ERROR",
            message="Data validation failed.",
            request_id=request_id,
        )

    @app.exception_handler(Exception)
    async def handle_unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
        """Handle any unhandled exception as a generic 500 error."""
        request_id = request.headers.get("X-Request-ID")
        logger.exception(
            "Unhandled exception",
            exc_info=exc,
            path=request.url.path,
            request_id=request_id,
        )
        return _error_response(
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred. Please try again later.",
            request_id=request_id,
        )
