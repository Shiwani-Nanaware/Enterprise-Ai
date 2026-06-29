"""FastAPI dependency injection providers — MongoDB edition.

All injectable dependencies live here. Routes declare them via Depends().
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.config import Settings, get_settings
from core.exceptions import AuthenticationError
from core.logging import get_logger
from database.mongo import MongoDep, get_db

logger = get_logger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Settings dependency
# ---------------------------------------------------------------------------

SettingsDep = Annotated[Settings, Depends(get_settings)]

# ---------------------------------------------------------------------------
# Database dependency (re-export for convenience)
# ---------------------------------------------------------------------------

DatabaseDep = MongoDep  # AsyncIOMotorDatabase injected via Depends(get_db)


# ---------------------------------------------------------------------------
# Authentication dependencies
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ],
    db: MongoDep,
) -> "User":  # type: ignore[name-defined]  # noqa: F821
    """Extract and validate the JWT access token, returning the active User.

    Args:
        credentials: Bearer credentials from the Authorization header.
        db: MongoDB database handle.

    Returns:
        User: The authenticated user.

    Raises:
        AuthenticationError: If the token is missing, invalid, or the user
            is inactive or deleted.
    """
    from auth.jwt import verify_access_token
    from models.user import User
    from repositories.user_repository import UserRepository

    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authorization header is required.")

    payload = verify_access_token(credentials.credentials)

    subject = payload.get("sub")
    if not subject:
        raise AuthenticationError("Invalid token: missing subject.")

    repo = UserRepository(db)
    user = await repo.get_active_by_id(subject)

    if not user:
        raise AuthenticationError("User account not found or is inactive.")

    return user


async def get_current_active_user(
    current_user: Annotated["User", Depends(get_current_user)],  # type: ignore[name-defined]  # noqa: F821
) -> "User":  # type: ignore[name-defined]  # noqa: F821
    """Verify the current user is active.

    Args:
        current_user: The user returned by ``get_current_user``.

    Returns:
        User: The active user.

    Raises:
        AuthenticationError: If the account is deactivated.
    """
    if not current_user.is_active:
        raise AuthenticationError("User account is deactivated.")
    return current_user


CurrentUserDep = Annotated["User", Depends(get_current_active_user)]  # type: ignore[name-defined]  # noqa: F821
