"""Application-wide exception hierarchy.

All domain and infrastructure exceptions inherit from ``AppException``.
The global exception handler in ``middleware/exception_handler.py``
maps these to structured HTTP responses.
"""

from http import HTTPStatus


class AppException(Exception):
    """Base class for all application exceptions.

    Attributes:
        message: Human-readable error message.
        status_code: HTTP status code for the response.
        error_code: Machine-readable error identifier.
        detail: Optional additional context dictionary.
    """

    def __init__(
        self,
        message: str,
        status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_ERROR",
        detail: dict | None = None,
    ) -> None:
        """Initialize the application exception.

        Args:
            message: Human-readable error description.
            status_code: HTTP status code. Defaults to 500.
            error_code: Machine-readable identifier. Defaults to 'INTERNAL_ERROR'.
            detail: Optional dictionary with extra diagnostic information.
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail or {}


# ---------------------------------------------------------------------------
# Authentication & Authorization
# ---------------------------------------------------------------------------


class AuthenticationError(AppException):
    """Raised when authentication credentials are invalid or missing."""

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.UNAUTHORIZED,
            error_code="AUTHENTICATION_FAILED",
        )


class TokenExpiredError(AppException):
    """Raised when a JWT token has expired."""

    def __init__(self, message: str = "Token has expired") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.UNAUTHORIZED,
            error_code="TOKEN_EXPIRED",
        )


class PermissionDeniedError(AppException):
    """Raised when a user lacks permission to perform an action."""

    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.FORBIDDEN,
            error_code="PERMISSION_DENIED",
        )


# ---------------------------------------------------------------------------
# Resource Errors
# ---------------------------------------------------------------------------


class NotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, identifier: str | int) -> None:
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=HTTPStatus.NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            detail={"resource": resource, "identifier": str(identifier)},
        )


class ConflictError(AppException):
    """Raised when a resource already exists or a conflict occurs."""

    def __init__(self, message: str, resource: str | None = None) -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.CONFLICT,
            error_code="RESOURCE_CONFLICT",
            detail={"resource": resource} if resource else {},
        )


# ---------------------------------------------------------------------------
# Validation Errors
# ---------------------------------------------------------------------------


class ValidationError(AppException):
    """Raised when input data fails domain-level validation."""

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            detail={"field": field} if field else {},
        )


# ---------------------------------------------------------------------------
# Document Errors
# ---------------------------------------------------------------------------


class DocumentProcessingError(AppException):
    """Raised when document ingestion or parsing fails."""

    def __init__(self, message: str, filename: str | None = None) -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            error_code="DOCUMENT_PROCESSING_FAILED",
            detail={"filename": filename} if filename else {},
        )


class DocumentTooLargeError(AppException):
    """Raised when an uploaded document exceeds the size limit."""

    def __init__(self, filename: str, size_mb: float, max_size_mb: int) -> None:
        super().__init__(
            message=f"Document '{filename}' ({size_mb:.1f} MB) exceeds the {max_size_mb} MB limit.",
            status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            error_code="DOCUMENT_TOO_LARGE",
            detail={
                "filename": filename,
                "size_mb": size_mb,
                "max_size_mb": max_size_mb,
            },
        )


class UnsupportedFileTypeError(AppException):
    """Raised when an uploaded file type is not supported."""

    def __init__(self, filename: str, file_type: str) -> None:
        super().__init__(
            message=f"File type '{file_type}' is not supported for '{filename}'.",
            status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            error_code="UNSUPPORTED_FILE_TYPE",
            detail={"filename": filename, "file_type": file_type},
        )


# ---------------------------------------------------------------------------
# AI / LLM Errors
# ---------------------------------------------------------------------------


class LLMError(AppException):
    """Raised when the LLM provider returns an error."""

    def __init__(self, message: str = "LLM request failed") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.BAD_GATEWAY,
            error_code="LLM_ERROR",
        )


class GuardrailViolationError(AppException):
    """Raised when input or output violates guardrail policies."""

    def __init__(self, message: str, policy: str | None = None) -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            error_code="GUARDRAIL_VIOLATION",
            detail={"policy": policy} if policy else {},
        )


class RateLimitError(AppException):
    """Raised when a user or IP exceeds the configured rate limit."""

    def __init__(self, retry_after: int = 60) -> None:
        super().__init__(
            message=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            status_code=HTTPStatus.TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            detail={"retry_after": retry_after},
        )


# ---------------------------------------------------------------------------
# Infrastructure Errors
# ---------------------------------------------------------------------------


class DatabaseError(AppException):
    """Raised when a database operation fails unexpectedly."""

    def __init__(self, message: str = "A database error occurred") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
        )


class VectorStoreError(AppException):
    """Raised when a vector store operation fails."""

    def __init__(self, message: str = "Vector store operation failed") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            error_code="VECTOR_STORE_ERROR",
        )


class CacheError(AppException):
    """Raised when a Redis cache operation fails."""

    def __init__(self, message: str = "Cache operation failed") -> None:
        super().__init__(
            message=message,
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            error_code="CACHE_ERROR",
        )
