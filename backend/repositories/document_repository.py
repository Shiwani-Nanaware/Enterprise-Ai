"""Document repository — MongoDB implementation."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from database.mongo import DOCUMENTS_COLLECTION
from models.document import Document
from repositories.base import MongoRepository


class DocumentRepository(MongoRepository[Document]):
    """Repository for Document documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, DOCUMENTS_COLLECTION)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_active_by_id(self, document_id: str) -> Document | None:
        """Fetch a non-deleted document by ID.

        Args:
            document_id: String ObjectId.

        Returns:
            Document | None: The document or None.
        """
        try:
            oid = self._to_object_id(document_id)
        except ValueError:
            return None
        doc = await self._find_one({"_id": oid, "is_deleted": False})
        return Document.from_dict(doc) if doc else None

    async def list_documents(
        self,
        offset: int = 0,
        limit: int = 50,
        departments: list[str] | None = None,
        status: str | None = None,
        file_type: str | None = None,
        uploaded_by: str | None = None,
        search: str | None = None,
    ) -> list[Document]:
        """List non-deleted documents with optional filters.

        Args:
            offset: Documents to skip.
            limit: Max documents to return.
            departments: Optional department whitelist.
            status: Optional status filter.
            file_type: Optional file type filter.
            uploaded_by: Optional uploader ID filter.
            search: Optional text search on title/filename.

        Returns:
            list[Document]: Matching documents.
        """
        query: dict[str, Any] = {"is_deleted": False}
        if departments:
            query["department"] = {"$in": departments}
        if status:
            query["status"] = status
        if file_type:
            query["file_type"] = file_type
        if uploaded_by:
            query["uploaded_by"] = uploaded_by
        if search:
            pattern = re.compile(re.escape(search), re.IGNORECASE)
            query["$or"] = [
                {"title": {"$regex": pattern}},
                {"filename": {"$regex": pattern}},
            ]
        docs = await self._find_many(
            query, sort=[("created_at", -1)], skip=offset, limit=limit
        )
        return [Document.from_dict(d) for d in docs]

    async def count_documents(
        self,
        departments: list[str] | None = None,
        status: str | None = None,
        file_type: str | None = None,
        uploaded_by: str | None = None,
        search: str | None = None,
    ) -> int:
        """Count documents matching optional filters.

        Args:
            departments: Optional department whitelist.
            status: Optional status filter.
            file_type: Optional file type filter.
            uploaded_by: Optional uploader filter.
            search: Optional search term.

        Returns:
            int: Count.
        """
        query: dict[str, Any] = {"is_deleted": False}
        if departments:
            query["department"] = {"$in": departments}
        if status:
            query["status"] = status
        if file_type:
            query["file_type"] = file_type
        if uploaded_by:
            query["uploaded_by"] = uploaded_by
        if search:
            pattern = re.compile(re.escape(search), re.IGNORECASE)
            query["$or"] = [
                {"title": {"$regex": pattern}},
                {"filename": {"$regex": pattern}},
            ]
        return await self._count(query)

    async def find_duplicate(self, filename: str, department: str) -> Document | None:
        """Check for an existing document with same filename+department.

        Args:
            filename: Filename to check.
            department: Department to check.

        Returns:
            Document | None: Duplicate document or None.
        """
        doc = await self._find_one(
            {
                "filename": filename,
                "department": department,
                "is_deleted": False,
                "status": {"$ne": "failed"},
            }
        )
        return Document.from_dict(doc) if doc else None

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def create(self, document: Document) -> Document:
        """Insert a new document record.

        Args:
            document: Document dataclass (id populated after insert).

        Returns:
            Document: Document with id set.
        """
        doc = document.to_dict()
        new_id = await self._insert(doc)
        document.id = new_id
        return document

    async def update(self, document_id: str, updates: dict[str, Any]) -> bool:
        """Apply field updates to a document.

        Args:
            document_id: String ObjectId.
            updates: Fields to set.

        Returns:
            bool: True if modified.
        """
        updates["updated_at"] = datetime.now(UTC)
        try:
            oid = self._to_object_id(document_id)
        except ValueError:
            return False
        return await self._update_one({"_id": oid}, {"$set": updates})

    async def soft_delete(self, document_id: str, deleted_by: str) -> bool:
        """Soft-delete a document.

        Args:
            document_id: String ObjectId.
            deleted_by: Who is deleting.

        Returns:
            bool: True if modified.
        """
        try:
            oid = self._to_object_id(document_id)
        except ValueError:
            return False
        return await self._update_one(
            {"_id": oid, "is_deleted": False},
            {
                "$set": {
                    "is_deleted": True,
                    "deleted_at": datetime.now(UTC),
                    "deleted_by": deleted_by,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
