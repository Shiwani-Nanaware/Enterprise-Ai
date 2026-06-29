"""RBAC FastAPI dependency factories — MongoDB edition.

Provides ``require_permission`` and ``require_role`` factories that
raise ``PermissionDeniedError`` when the current user lacks access.
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends

from auth.roles import Permission, Role, has_permission
from core.dependencies import CurrentUserDep, get_current_active_user
from core.exceptions import PermissionDeniedError
from models.user import User

# Convenience alias — same as CurrentUserDep
CurrentUser = CurrentUserDep


def require_permission(permission: Permission) -> Callable:
    """Return a FastAPI dependency that enforces a single permission.

    Args:
        permission: The permission the current user must hold.

    Returns:
        Callable: Async dependency that raises ``PermissionDeniedError`` on failure.
    """

    async def _check(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if not has_permission(current_user.role, permission):
            raise PermissionDeniedError(
                f"Permission '{permission}' is required to access this resource."
            )
        return current_user

    return _check


def require_role(*roles: Role) -> Callable:
    """Return a FastAPI dependency that restricts access to specific roles.

    Args:
        *roles: One or more permitted roles.

    Returns:
        Callable: Async dependency that raises ``PermissionDeniedError`` on failure.
    """

    async def _check(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        try:
            user_role = Role(current_user.role)
        except ValueError:
            raise PermissionDeniedError(f"Unrecognized role: '{current_user.role}'.")
        if user_role not in roles:
            raise PermissionDeniedError(
                f"Role '{current_user.role}' is not authorised for this resource."
            )
        return current_user

    return _check
