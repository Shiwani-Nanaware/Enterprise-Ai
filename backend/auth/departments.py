"""Department-based access control mapping.

Maps each enterprise role to the set of document collections (departments)
they are permitted to retrieve documents from.

Unauthorized documents are filtered out at both the database and vector
store levels — they never reach the LLM.
"""

from auth.roles import Role

# Department collection names (match Document.collection_name values)
DEPARTMENTS = [
    "finance",
    "marketing",
    "hr",
    "engineering",
    "general",
]

# Roles and the departments they can access
ROLE_DEPARTMENT_ACCESS: dict[str, list[str]] = {
    Role.SUPER_ADMIN: DEPARTMENTS,
    Role.ADMIN: DEPARTMENTS,
    # CEO sees everything
    "ceo": DEPARTMENTS,
    Role.ANALYST: DEPARTMENTS,
    Role.MANAGER: DEPARTMENTS,
    # Department-specific roles — role value == department name
    "finance": ["finance", "general"],
    "marketing": ["marketing", "general"],
    "hr": ["hr", "general"],
    "engineering": ["engineering", "general"],
    # Default user role
    Role.USER: ["general"],
    "employee": ["general"],
}

# Roles → display names for legacy/enterprise mapping
ENTERPRISE_ROLE_MAP: dict[str, str] = {
    "admin": Role.ADMIN,
    "super_admin": Role.SUPER_ADMIN,
    "ceo": "ceo",
    "finance": "finance",
    "marketing": "marketing",
    "hr": "hr",
    "engineering": "engineering",
    "analyst": Role.ANALYST,
    "manager": Role.MANAGER,
    "user": Role.USER,
    "employee": "employee",
}


def get_accessible_departments(role: str) -> list[str]:
    """Return the list of department collections a role may access.

    CEO role and admin/super_admin roles receive access to all departments.
    Unmapped roles fall back to ``['general']`` only.

    Args:
        role: The user's role string.

    Returns:
        list[str]: Names of accessible department collections.
    """
    return ROLE_DEPARTMENT_ACCESS.get(role, ["general"])


def can_access_department(role: str, department: str) -> bool:
    """Check whether a role may access a specific department.

    Args:
        role: The user's role string.
        department: The department collection name.

    Returns:
        bool: True if access is permitted.
    """
    return department in get_accessible_departments(role)
