"""MongoDB Motor async client — replaces SQLAlchemy/PostgreSQL.

Provides:
- A singleton Motor async client
- A database accessor
- A FastAPI dependency that injects the database handle
- Collection name constants
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

import motor.motor_asyncio
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Collection name constants
# ---------------------------------------------------------------------------

USERS_COLLECTION = "users"
DOCUMENTS_COLLECTION = "documents"
CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_COLLECTION = "messages"
AUDIT_LOGS_COLLECTION = "audit_logs"


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient:
    """Return the cached Motor async client singleton.

    Returns:
        AsyncIOMotorClient: Connected Motor client.
    """
    settings = get_settings()
    client: AsyncIOMotorClient = motor.motor_asyncio.AsyncIOMotorClient(
        settings.mongo.uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=30000,
        maxPoolSize=20,
        minPoolSize=2,
    )
    logger.info("MongoDB client created", uri_prefix=settings.mongo.uri[:30])
    return client


def get_database() -> AsyncIOMotorDatabase:
    """Return the application database handle.

    Returns:
        AsyncIOMotorDatabase: The Motor database instance.
    """
    settings = get_settings()
    return get_mongo_client()[settings.mongo.database_name]


async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — inject the MongoDB database handle.

    Yields:
        AsyncIOMotorDatabase: Active database handle.
    """
    return get_database()


# Annotated dependency alias used across routes
MongoDep = Annotated[AsyncIOMotorDatabase, Depends(get_db)]


async def ping_database() -> bool:
    """Test connectivity to MongoDB.

    Returns:
        bool: True if the ping succeeds.
    """
    try:
        client = get_mongo_client()
        await client.admin.command("ping")
        return True
    except Exception as exc:
        logger.warning("MongoDB ping failed", error=str(exc))
        return False


async def ensure_indexes() -> None:
    """Create all required MongoDB indexes on startup.

    Idempotent — safe to call on every restart.
    """
    db = get_database()

    # users
    await db[USERS_COLLECTION].create_index("email", unique=True)
    await db[USERS_COLLECTION].create_index("role")
    await db[USERS_COLLECTION].create_index("is_deleted")
    await db[USERS_COLLECTION].create_index("is_active")

    # documents
    await db[DOCUMENTS_COLLECTION].create_index("department")
    await db[DOCUMENTS_COLLECTION].create_index("uploaded_by")
    await db[DOCUMENTS_COLLECTION].create_index("status")
    await db[DOCUMENTS_COLLECTION].create_index("is_deleted")
    await db[DOCUMENTS_COLLECTION].create_index([("filename", 1), ("department", 1)])
    await db[DOCUMENTS_COLLECTION].create_index([("title", "text"), ("filename", "text")])

    # conversations
    await db[CONVERSATIONS_COLLECTION].create_index("user_id")
    await db[CONVERSATIONS_COLLECTION].create_index("status")
    await db[CONVERSATIONS_COLLECTION].create_index("is_deleted")

    # messages
    await db[MESSAGES_COLLECTION].create_index("conversation_id")
    await db[MESSAGES_COLLECTION].create_index("role")
    await db[MESSAGES_COLLECTION].create_index("created_at")

    # audit_logs
    await db[AUDIT_LOGS_COLLECTION].create_index("user_id")
    await db[AUDIT_LOGS_COLLECTION].create_index("action")
    await db[AUDIT_LOGS_COLLECTION].create_index("created_at")
    await db[AUDIT_LOGS_COLLECTION].create_index("resource_id")

    logger.info("MongoDB indexes ensured")
