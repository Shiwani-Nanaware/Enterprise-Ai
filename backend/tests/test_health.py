"""Health endpoint tests — MongoDB edition."""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_health_check_returns_healthy(client) -> None:
    """GET /health returns 200 with status=healthy."""
    ac, _ = client
    response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_version_endpoint_returns_metadata(client) -> None:
    """GET /version returns application version metadata."""
    ac, _ = client
    response = await ac.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data or "data" in data
