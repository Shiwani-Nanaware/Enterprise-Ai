"""Database package — MongoDB Motor async client.

Exports the primary access points used throughout the application.
"""

from database.mongo import (
    AUDIT_LOGS_COLLECTION,
    CONVERSATIONS_COLLECTION,
    DOCUMENTS_COLLECTION,
    MESSAGES_COLLECTION,
    USERS_COLLECTION,
    MongoDep,
    ensure_indexes,
    get_database,
    get_db,
    get_mongo_client,
    ping_database,
)

__all__ = [
    "AUDIT_LOGS_COLLECTION",
    "CONVERSATIONS_COLLECTION",
    "DOCUMENTS_COLLECTION",
    "MESSAGES_COLLECTION",
    "USERS_COLLECTION",
    "MongoDep",
    "ensure_indexes",
    "get_database",
    "get_db",
    "get_mongo_client",
    "ping_database",
]
