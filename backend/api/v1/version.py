"""Version endpoint.

Exposes application version metadata for tooling, CI/CD pipelines,
and client-side version display.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.config import get_settings

router = APIRouter()


class VersionResponse(BaseModel):
    """Version metadata response schema.

    Attributes:
        name: Application name.
        version: Semantic version string.
        environment: Deployment environment.
        api_version: API contract version prefix.
    """

    name: str
    version: str
    environment: str
    api_version: str


@router.get(
    "/version",
    response_model=VersionResponse,
    summary="Application version",
    description="Returns the current application version and environment metadata.",
)
async def get_version() -> VersionResponse:
    """Return application version metadata.

    Returns:
        VersionResponse: Version and environment information.
    """
    settings = get_settings()
    return VersionResponse(
        name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        api_version="v1",
    )
