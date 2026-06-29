"""User settings API endpoints.

GET    /settings          — get current user settings
PUT    /settings          — update settings
DELETE /settings          — reset to defaults
GET    /settings/defaults — get default values
"""

from typing import Any

from fastapi import APIRouter, status

from core.dependencies import CurrentUserDep
from database.mongo import MongoDep
from schemas.common import SuccessResponse
from services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get user settings",
    description="Return the current user's application settings.",
)
async def get_settings(current_user: CurrentUserDep, db: MongoDep) -> SuccessResponse[dict]:
    """Get the current user's settings."""
    svc = SettingsService(db)
    data = await svc.get_settings(str(current_user.id))
    return SuccessResponse(data=data)


@router.put(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Update user settings",
    description="Save user preferences. Only valid setting keys are persisted.",
)
async def update_settings(
    body: dict[str, Any],
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[dict]:
    """Update the current user's settings."""
    svc = SettingsService(db)
    data = await svc.update_settings(str(current_user.id), body)
    return SuccessResponse(data=data, message="Settings saved.")


@router.delete(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Reset settings to defaults",
)
async def reset_settings(current_user: CurrentUserDep, db: MongoDep) -> SuccessResponse[dict]:
    """Reset the current user's settings to defaults."""
    svc = SettingsService(db)
    data = await svc.reset_settings(str(current_user.id))
    return SuccessResponse(data=data, message="Settings reset to defaults.")


@router.get(
    "/defaults",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get default settings",
)
async def get_defaults(current_user: CurrentUserDep) -> SuccessResponse[dict]:
    """Return the default settings values."""
    return SuccessResponse(data=SettingsService.get_defaults())
