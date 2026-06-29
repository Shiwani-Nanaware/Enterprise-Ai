"""Audit log repository — MongoDB append-only implementation."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from database.mongo import AUDIT_LOGS_COLLECTION
from models.audit import AuditLog
from repositories.base import MongoRepository


class AuditRepository(MongoRepository[AuditLog]):
    """Repository for AuditLog documents — append-only writes."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, AUDIT_LOGS_COLLECTION)

    async def log(
        self,
        action: str,
        user_id: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        status: str = "success",
        detail: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> AuditLog:
        """Append a new audit log entry.

        Args:
            action: Machine-readable action identifier.
            user_id: Acting user ID string (None for system events).
            resource_type: Type of affected resource.
            resource_id: ID of the affected resource.
            ip_address: Client IP address.
            user_agent: HTTP User-Agent string.
            status: 'success' or 'failure'.
            detail: Structured metadata dict.
            error_message: Error message if the action failed.

        Returns:
            AuditLog: The persisted audit entry.
        """
        entry = AuditLog(
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            detail=detail or {},
            error_message=error_message,
        )
        new_id = await self._insert(entry.to_dict())
        entry.id = new_id
        return entry

    async def get_user_activity(
        self,
        user_id: str,
        offset: int = 0,
        limit: int = 50,
        since: datetime | None = None,
    ) -> list[AuditLog]:
        """Retrieve audit log entries for a specific user.

        Args:
            user_id: User ID string.
            offset: Documents to skip.
            limit: Max documents to return.
            since: Optional lower-bound timestamp.

        Returns:
            list[AuditLog]: Matching entries.
        """
        query: dict[str, Any] = {"user_id": user_id}
        if since:
            query["created_at"] = {"$gte": since}
        docs = await self._find_many(
            query, sort=[("created_at", -1)], skip=offset, limit=limit
        )
        return [AuditLog.from_dict(d) for d in docs]
