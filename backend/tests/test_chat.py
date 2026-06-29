"""Chat API tests — MongoDB + ChromaDB RAG edition."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from bson import ObjectId

from tests.conftest import get_auth_headers


@pytest.mark.asyncio
async def test_list_conversations_requires_auth(seeded_client: AsyncClient) -> None:
    response = await seeded_client.get("/api/v1/chat/conversations")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_conversations_empty(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    response = await seeded_client.get(
        "/api/v1/chat/conversations", headers=get_auth_headers(token)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_nonexistent_conversation(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]
    fake_id = str(ObjectId())
    response = await seeded_client.get(
        f"/api/v1/chat/conversations/{fake_id}", headers=get_auth_headers(token)
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_chat_requires_auth(seeded_client: AsyncClient) -> None:
    response = await seeded_client.post(
        "/api/v1/chat", json={"content": "What is the revenue forecast?"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_sends_message_and_creates_conversation(seeded_client: AsyncClient) -> None:
    login = await seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "user@test.com", "password": "Password123!"},
    )
    token = login.json()["data"]["access_token"]

    with (
        patch("rag.pipeline.retrieve_documents", new_callable=AsyncMock, return_value=[]),
        patch("rag.pipeline.stream_llm_response", new_callable=AsyncMock, return_value=("Mock response.", 30)),
    ):
        response = await seeded_client.post(
            "/api/v1/chat",
            headers=get_auth_headers(token),
            json={"content": "What is the company policy on remote work?"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "conversation_id" in data["data"]
    assert data["data"]["message"]["role"] == "assistant"
    assert data["data"]["message"]["content"] == "Mock response."
