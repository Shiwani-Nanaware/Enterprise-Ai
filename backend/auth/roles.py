"""Role-Based Access Control (RBAC) definitions.

Defines the role hierarchy and permission sets used throughout the platform.
The ``Role`` enum represents all available user roles, and the
``ROLE_PERMISSIONS`` map defines which capabilities each role grants.
"""

from enum import StrEnum


class Role(StrEnum):
    """Platform user roles in ascending privilege order.

    Attributes:
        USER: Standard authenticated user. Can chat and view own documents.
        ANALYST: Extended read access. Can view analytics and all documents.
        MANAGER: Can manage documents and view team analytics.
        ADMIN: Full platform administration.
        SUPER_ADMIN: Unrestricted access including system configuration.
    """

    USER = "user"
    ANALYST = "analyst"
    MANAGER = "manager"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class Permission(StrEnum):
    """Granular permission identifiers.

    Each permission is a ``resource:action`` string, e.g. ``document:read``.
    """

    # Documents
    DOCUMENT_READ = "document:read"
    DOCUMENT_UPLOAD = "document:upload"
    DOCUMENT_DELETE = "document:delete"
    DOCUMENT_MANAGE = "document:manage"

    # Chat
    CHAT_SEND = "chat:send"
    CHAT_VIEW_HISTORY = "chat:view_history"

    # Analytics
    ANALYTICS_VIEW_OWN = "analytics:view_own"
    ANALYTICS_VIEW_ALL = "analytics:view_all"

    # Users
    USER_VIEW_PROFILE = "user:view_profile"
    USER_MANAGE = "user:manage"

    # Admin
    ADMIN_PANEL = "admin:panel"
    SYSTEM_CONFIG = "system:config"

    # Guardrails
    GUARDRAILS_VIEW = "guardrails:view"
    GUARDRAILS_MANAGE = "guardrails:manage"

    # Evaluation
    EVALUATION_VIEW = "evaluation:view"
    EVALUATION_MANAGE = "evaluation:manage"

    # Cost
    COST_VIEW_OWN = "cost:view_own"
    COST_VIEW_ALL = "cost:view_all"


ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.USER: frozenset(
        {
            Permission.DOCUMENT_READ,
            Permission.DOCUMENT_UPLOAD,
            Permission.CHAT_SEND,
            Permission.CHAT_VIEW_HISTORY,
            Permission.ANALYTICS_VIEW_OWN,
            Permission.USER_VIEW_PROFILE,
            Permission.COST_VIEW_OWN,
        }
    ),
    Role.ANALYST: frozenset(
        {
            Permission.DOCUMENT_READ,
            Permission.DOCUMENT_UPLOAD,
            Permission.CHAT_SEND,
            Permission.CHAT_VIEW_HISTORY,
            Permission.ANALYTICS_VIEW_OWN,
            Permission.ANALYTICS_VIEW_ALL,
            Permission.USER_VIEW_PROFILE,
            Permission.COST_VIEW_OWN,
            Permission.COST_VIEW_ALL,
            Permission.EVALUATION_VIEW,
            Permission.GUARDRAILS_VIEW,
        }
    ),
    Role.MANAGER: frozenset(
        {
            Permission.DOCUMENT_READ,
            Permission.DOCUMENT_UPLOAD,
            Permission.DOCUMENT_MANAGE,
            Permission.CHAT_SEND,
            Permission.CHAT_VIEW_HISTORY,
            Permission.ANALYTICS_VIEW_OWN,
            Permission.ANALYTICS_VIEW_ALL,
            Permission.USER_VIEW_PROFILE,
            Permission.COST_VIEW_OWN,
            Permission.COST_VIEW_ALL,
            Permission.EVALUATION_VIEW,
            Permission.EVALUATION_MANAGE,
            Permission.GUARDRAILS_VIEW,
        }
    ),
    Role.ADMIN: frozenset(
        {
            Permission.DOCUMENT_READ,
            Permission.DOCUMENT_UPLOAD,
            Permission.DOCUMENT_DELETE,
            Permission.DOCUMENT_MANAGE,
            Permission.CHAT_SEND,
            Permission.CHAT_VIEW_HISTORY,
            Permission.ANALYTICS_VIEW_OWN,
            Permission.ANALYTICS_VIEW_ALL,
            Permission.USER_VIEW_PROFILE,
            Permission.USER_MANAGE,
            Permission.COST_VIEW_OWN,
            Permission.COST_VIEW_ALL,
            Permission.EVALUATION_VIEW,
            Permission.EVALUATION_MANAGE,
            Permission.GUARDRAILS_VIEW,
            Permission.GUARDRAILS_MANAGE,
            Permission.ADMIN_PANEL,
        }
    ),
    Role.SUPER_ADMIN: frozenset(set(Permission)),
}


def has_permission(role: Role | str, permission: Permission) -> bool:
    """Check whether a role has a specific permission.

    Args:
        role: The user's assigned role.
        permission: The permission to check.

    Returns:
        bool: ``True`` if the role grants the permission.
    """
    if isinstance(role, str):
        try:
            role = Role(role)
        except ValueError:
            return False
    return permission in ROLE_PERMISSIONS.get(role, frozenset())
