"""Generic MongoDB base repository.

All concrete repositories inherit from ``MongoRepository``.
Motor (async) is used for all database access.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

ModelT = TypeVar("ModelT")


class MongoRepository(Generic[ModelT]):
    """Generic repository for a single MongoDB collection.

    Type Parameters:
        ModelT: The dataclass model this repository manages.

    Attributes:
        _db: Active Motor database handle.
        _collection_name: MongoDB collection name.
    """

    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str) -> None:
        """Initialise the repository.

        Args:
            db: Motor async database handle.
            collection_name: Target collection name.
        """
        self._db = db
        self._collection = db[collection_name]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_object_id(value: str | ObjectId) -> ObjectId:
        """Convert a string or ObjectId to ObjectId.

        Args:
            value: String hex ID or ObjectId.

        Returns:
            ObjectId: Converted ObjectId.

        Raises:
            ValueError: If the value is not a valid ObjectId.
        """
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except Exception:
            raise ValueError(f"Invalid ObjectId: {value!r}")

    # ------------------------------------------------------------------
    # Base CRUD
    # ------------------------------------------------------------------

    async def _insert(self, document: dict[str, Any]) -> str:
        """Insert a document and return the new string ID.

        Args:
            document: BSON-compatible dict to insert.

        Returns:
            str: String representation of the new ``_id``.
        """
        result = await self._collection.insert_one(document)
        return str(result.inserted_id)

    async def _find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        """Find a single document matching the query.

        Args:
            query: MongoDB filter dict.

        Returns:
            dict | None: Raw MongoDB document or None.
        """
        return await self._collection.find_one(query)

    async def _find_many(
        self,
        query: dict[str, Any],
        sort: list[tuple[str, int]] | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Find multiple documents.

        Args:
            query: MongoDB filter dict.
            sort: Optional sort specification.
            skip: Number of documents to skip.
            limit: Max documents to return.

        Returns:
            list[dict]: List of raw MongoDB documents.
        """
        cursor = self._collection.find(query)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def _count(self, query: dict[str, Any]) -> int:
        """Count documents matching a query.

        Args:
            query: MongoDB filter dict.

        Returns:
            int: Document count.
        """
        return await self._collection.count_documents(query)

    async def _update_one(
        self, query: dict[str, Any], update: dict[str, Any]
    ) -> bool:
        """Update a single document.

        Args:
            query: Filter dict.
            update: MongoDB update operator dict (e.g. ``{"$set": {...}}``).

        Returns:
            bool: True if a document was modified.
        """
        result = await self._collection.update_one(query, update)
        return result.modified_count > 0

    async def _delete_one(self, query: dict[str, Any]) -> bool:
        """Permanently delete a single document.

        Args:
            query: Filter dict.

        Returns:
            bool: True if a document was deleted.
        """
        result = await self._collection.delete_one(query)
        return result.deleted_count > 0
