"""Authentication endpoint tests — MongoDB edition."""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

from tests.conftest import get_auth_headers


@pytest.mark.asyncio
async def test_login_success(seeded_client: AsyncClient) -> None:
    """POST /auth/login with valid credentials returns tokens."""
    response = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(seeded_client: AsyncClient) -> None:
    """POST /auth/login with wrong password returns 401."""
    response = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(seeded_client: AsyncClient) -> None:
    """POST /auth/login with unknown email returns 401."""
    response = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@finsolve.com", "password": "Password123!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_unauthenticated(seeded_client: AsyncClient) -> None:
    """GET /auth/me without token returns 401."""
    response = await seeded_client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(seeded_client: AsyncClient) -> None:
    """GET /auth/me returns profile when authenticated."""
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]

    response = await seeded_client.get(
        "/api/v1/auth/me", headers=get_auth_headers(token)
    )
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "user@test.com"


@pytest.mark.asyncio
async def test_logout(seeded_client: AsyncClient) -> None:
    """POST /auth/logout invalidates the session."""
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.post(
        "/api/v1/auth/logout", headers=get_auth_headers(token)
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
