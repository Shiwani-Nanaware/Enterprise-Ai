"""RBAC and department access control tests — MongoDB edition."""

import pytest
from httpx import AsyncClient

from auth.departments import can_access_department, get_accessible_departments
from auth.roles import Role, has_permission, Permission
from tests.conftest import get_auth_headers


# ---------------------------------------------------------------------------
# Unit tests — roles and permissions (no DB required)
# ---------------------------------------------------------------------------

def test_admin_has_all_permissions() -> None:
    assert has_permission(Role.ADMIN, Permission.DOCUMENT_DELETE)
    assert has_permission(Role.ADMIN, Permission.USER_MANAGE)
    assert has_permission(Role.ADMIN, Permission.ADMIN_PANEL)


def test_user_has_limited_permissions() -> None:
    assert not has_permission(Role.USER, Permission.DOCUMENT_DELETE)
    assert not has_permission(Role.USER, Permission.USER_MANAGE)
    assert not has_permission(Role.USER, Permission.ADMIN_PANEL)


def test_finance_role_accesses_finance_and_general() -> None:
    deps = get_accessible_departments("finance")
    assert "finance" in deps
    assert "general" in deps
    assert "hr" not in deps


def test_hr_role_accesses_hr_and_general() -> None:
    deps = get_accessible_departments("hr")
    assert "hr" in deps
    assert "general" in deps
    assert "finance" not in deps


def test_admin_accesses_all_departments() -> None:
    deps = get_accessible_departments("admin")
    for dept in ["finance", "marketing", "hr", "engineering", "general"]:
        assert dept in deps


def test_ceo_accesses_all_departments() -> None:
    deps = get_accessible_departments("ceo")
    for dept in ["finance", "marketing", "hr", "engineering", "general"]:
        assert dept in deps


def test_employee_accesses_only_general() -> None:
    deps = get_accessible_departments("employee")
    assert deps == ["general"]


def test_can_access_department_finance_user() -> None:
    assert can_access_department("finance", "finance") is True
    assert can_access_department("finance", "general") is True
    assert can_access_department("finance", "hr") is False


# ---------------------------------------------------------------------------
# API-level RBAC tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_can_list_users(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.get("/api/v1/users", headers=get_auth_headers(token))
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_regular_user_cannot_list_users(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.get("/api/v1/users", headers=get_auth_headers(token))
    assert response.status_code == 403
