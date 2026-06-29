"""Audit Log model — MongoDB edition.

Append-only record of platform actions stored in ``audit_logs``.
No SQLAlchemy.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class AuditLog:
    """Immutable audit trail entry.

    Attributes:
        id: MongoDB ObjectId string.
        user_id: Acting user ID (None for system events).
        action: Machine-readable action (e.g. ``auth.login``).
        resource_type: Type of affected resource.
        resource_id: ID of the affected resource.
        ip_address: Client IP address.
        user_agent: HTTP User-Agent string.
        status: success | failure.
        detail: Structured metadata dict.
        error_message: Error message if the action failed.
        created_at: Immutable creation timestamp.
    """

    action: str
    user_id: str | None = None
    resource_type: str | None = None
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    status: str = "success"
    detail: dict[str, Any] = field(default_factory=dict)
    error_message: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialise to MongoDB-ready dict.

        Returns:
            dict: BSON-compatible audit log document.
        """
        return {
            "action": self.action,
            "user_id": self.user_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "status": self.status,
            "detail": self.detail,
            "error_message": self.error_message,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "AuditLog":
        """Deserialise a MongoDB document into an AuditLog instance.

        Args:
            data: Raw MongoDB document.

        Returns:
            AuditLog: Populated AuditLog dataclass.
        """
        doc_id = data.get("_id") or data.get("id")
        return cls(
            id=str(doc_id) if doc_id is not None else None,
            action=data.get("action", ""),
            user_id=data.get("user_id"),
            resource_type=data.get("resource_type"),
            resource_id=data.get("resource_id"),
            ip_address=data.get("ip_address"),
            user_agent=data.get("user_agent"),
            status=data.get("status", "success"),
            detail=data.get("detail") or {},
            error_message=data.get("error_message"),
            created_at=data.get("created_at", datetime.now(UTC)),
        )
