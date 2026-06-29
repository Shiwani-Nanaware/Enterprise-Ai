"""Common Pydantic v2 response envelope schemas.

All API responses are wrapped in ``SuccessResponse`` or ``ErrorResponse``
for consistent client-side parsing.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class SuccessResponse(BaseModel, Generic[DataT]):
    """Generic success response envelope.

    Attributes:
        success: Always ``True`` for success responses.
        data: The response payload.
        message: Optional human-readable status message.
    """

    success: bool = Field(default=True)
    data: DataT
    message: str | None = Field(default=None)


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Paginated list response envelope.

    Attributes:
        success: Always ``True``.
        data: List of items for the current page.
        total: Total number of items across all pages.
        page: Current page number (1-indexed).
        page_size: Number of items per page.
        total_pages: Total number of pages.
    """

    success: bool = Field(default=True)
    data: list[DataT]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorDetail(BaseModel):
    """Structured error detail within an error response.

    Attributes:
        code: Machine-readable error code.
        message: Human-readable error description.
        detail: Optional dictionary with extra diagnostic information.
    """

    code: str
    message: str
    detail: dict = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """Standard error response envelope.

    Attributes:
        success: Always ``False`` for error responses.
        error: Structured error details.
        request_id: Optional trace ID for log correlation.
    """

    success: bool = Field(default=False)
    error: ErrorDetail
    request_id: str | None = Field(default=None)


class HealthStatus(BaseModel):
    """API health check response schema.

    Attributes:
        status: Overall health status (``healthy`` | ``degraded`` | ``unhealthy``).
        version: Application version string.
        environment: Deployment environment name.
        checks: Dictionary of individual service health check results.
    """

    status: str
    version: str
    environment: str
    checks: dict[str, str] = Field(default_factory=dict)
