"""Document API tests — MongoDB + ChromaDB edition."""

import pytest
from httpx import AsyncClient

from tests.conftest import get_auth_headers


@pytest.mark.asyncio
async def test_list_documents_requires_auth(seeded_client: AsyncClient) -> None:
    response = await seeded_client.get("/api/v1/documents")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_documents_authenticated(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.get("/api/v1/documents", headers=get_auth_headers(token))
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_nonexistent_document(seeded_client: AsyncClient) -> None:
    from bson import ObjectId
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    fake_id = str(ObjectId())
    response = await seeded_client.get(
        f"/api/v1/documents/{fake_id}", headers=get_auth_headers(token)
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_unsupported_file_type(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.post(
        "/api/v1/documents/upload",
        headers=get_auth_headers(token),
        files={"file": ("test.exe", b"binary content", "application/octet-stream")},
        data={"department": "general", "title": "Test"},
    )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_upload_wrong_department_access(seeded_client: AsyncClient) -> None:
    """Regular user (role=user) cannot upload to 'finance' department."""
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.post(
        "/api/v1/documents/upload",
        headers=get_auth_headers(token),
        files={"file": ("report.txt", b"Sample content", "text/plain")},
        data={"department": "finance", "title": "Financial Report"},
    )
    assert response.status_code == 403
