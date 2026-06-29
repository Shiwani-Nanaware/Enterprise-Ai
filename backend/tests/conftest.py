"""Test configuration and fixtures — MongoDB + ChromaDB edition.

Uses mongomock-motor for in-memory MongoDB during tests.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from auth.password import hash_password
from models.user import User


# ---------------------------------------------------------------------------
# App fixture with DB override
# ---------------------------------------------------------------------------


@pytest.fixture
def app():
    """Return the FastAPI application with an in-memory MongoDB stub."""
    from core.app_factory import create_app
    from database.mongo import get_db

    fastapi_app = create_app()

    # Build a tiny in-memory user store for testing
    _users: dict[str, dict] = {}

    async def _mock_db():
        """Return a mock database object whose collections are MagicMock."""
        from unittest.mock import MagicMock, AsyncMock

        class MockCollection:
            def __init__(self, store: dict):
                self._store = store

            async def find_one(self, query, *args, **kwargs):
                for doc in self._store.values():
                    if all(doc.get(k) == v for k, v in query.items() if not isinstance(v, dict)):
                        return doc
                return None

            def find(self, query, *args, **kwargs):
                class Cursor:
                    def __init__(self, docs):
                        self._docs = docs

                    def sort(self, *a, **kw):
                        return self

                    def skip(self, n):
                        self._docs = self._docs[n:]
                        return self

                    def limit(self, n):
                        self._docs = self._docs[:n]
                        return self

                    async def to_list(self, length=None):
                        return self._docs

                matched = [
                    d for d in self._store.values()
                    if all(d.get(k) == v for k, v in query.items() if not isinstance(v, dict))
                ]
                return Cursor(matched)

            async def insert_one(self, doc):
                from bson import ObjectId
                oid = ObjectId()
                doc["_id"] = oid
                self._store[str(oid)] = doc
                class R:
                    inserted_id = oid
                return R()

            async def update_one(self, query, update, *a, **kw):
                for key, doc in self._store.items():
                    if all(doc.get(k) == v for k, v in query.items() if not isinstance(v, dict)):
                        if "$set" in update:
                            doc.update(update["$set"])
                        class R:
                            modified_count = 1
                        return R()
                class R:
                    modified_count = 0
                return R()

            async def count_documents(self, query):
                return sum(
                    1 for d in self._store.values()
                    if all(d.get(k) == v for k, v in query.items() if not isinstance(v, dict))
                )

            async def create_index(self, *a, **kw):
                pass

        class MockDB:
            def __getitem__(self, name):
                return MockCollection(_users)

        return MockDB()

    fastapi_app.dependency_overrides[get_db] = _mock_db
    return fastapi_app, _users


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Provide an ASGI test client."""
    fastapi_app, _users = app
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as ac:
        yield ac, _users


@pytest_asyncio.fixture
async def seeded_client(app):
    """Client with a pre-seeded admin and regular user."""
    from bson import ObjectId
    from datetime import UTC, datetime

    fastapi_app, _users = app

    admin_id = ObjectId()
    user_id = ObjectId()

    admin_doc = {
        "_id": admin_id,
        "email": "admin@test.com",
        "full_name": "Admin User",
        "hashed_password": hash_password("Password123!"),
        "role": "admin",
        "is_active": True,
        "is_verified": True,
        "is_deleted": False,
        "department": None,
        "job_title": None,
        "avatar_url": None,
        "refresh_token_hash": None,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    user_doc = {
        "_id": user_id,
        "email": "user@test.com",
        "full_name": "Regular User",
        "hashed_password": hash_password("Password123!"),
        "role": "user",
        "is_active": True,
        "is_verified": True,
        "is_deleted": False,
        "department": None,
        "job_title": None,
        "avatar_url": None,
        "refresh_token_hash": None,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    _users[str(admin_id)] = admin_doc
    _users[str(user_id)] = user_doc

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as ac:
        yield ac


def get_auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
