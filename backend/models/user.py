"""User document model — MongoDB edition.

Plain dataclass representing a user stored in the ``users`` collection.
No SQLAlchemy. All fields map directly to MongoDB BSON documents.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class User:
    """Represents a platform user account in MongoDB.

    Attributes:
        id: MongoDB ObjectId string (``_id`` mapped to ``id``).
        email: Unique email address.
        full_name: Display name.
        hashed_password: Bcrypt hash of the password.
        role: RBAC role string.
        is_active: Whether the account is active.
        is_verified: Whether the email is verified.
        avatar_url: Optional avatar URL.
        department: Optional department name.
        job_title: Optional job title.
        refresh_token_hash: Bcrypt hash of the current refresh token.
        is_deleted: Soft-delete flag.
        deleted_at: Timestamp of soft-deletion.
        deleted_by: Who deleted the account.
        created_at: Record creation timestamp.
        updated_at: Last update timestamp.
    """

    email: str
    full_name: str
    hashed_password: str
    role: str = "user"
    is_active: bool = True
    is_verified: bool = False
    avatar_url: str | None = None
    department: str | None = None
    job_title: str | None = None
    refresh_token_hash: str | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: str | None = None  # MongoDB _id (str representation of ObjectId)

    # ------------------------------------------------------------------
    # Serialisation helpers
    # ------------------------------------------------------------------

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a MongoDB-ready dictionary (excludes ``id``).

        Returns:
            dict: BSON-compatible document dict.
        """
        return {
            "email": self.email,
            "full_name": self.full_name,
            "hashed_password": self.hashed_password,
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "avatar_url": self.avatar_url,
            "department": self.department,
            "job_title": self.job_title,
            "refresh_token_hash": self.refresh_token_hash,
            "is_deleted": self.is_deleted,
            "deleted_at": self.deleted_at,
            "deleted_by": self.deleted_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "User":
        """Deserialise a MongoDB document into a User instance.

        Args:
            data: Raw MongoDB document.

        Returns:
            User: Populated User dataclass.
        """
        doc_id = data.get("_id") or data.get("id")
        return cls(
            id=str(doc_id) if doc_id is not None else None,
            email=data["email"],
            full_name=data.get("full_name", ""),
            hashed_password=data.get("hashed_password", ""),
            role=data.get("role", "user"),
            is_active=data.get("is_active", True),
            is_verified=data.get("is_verified", False),
            avatar_url=data.get("avatar_url"),
            department=data.get("department"),
            job_title=data.get("job_title"),
            refresh_token_hash=data.get("refresh_token_hash"),
            is_deleted=data.get("is_deleted", False),
            deleted_at=data.get("deleted_at"),
            deleted_by=data.get("deleted_by"),
            created_at=data.get("created_at", datetime.now(UTC)),
            updated_at=data.get("updated_at", datetime.now(UTC)),
        )
