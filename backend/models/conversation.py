"""Conversation and Message models — MongoDB edition.

Stored in ``conversations`` and ``messages`` collections.
No SQLAlchemy. Plain Python dataclasses.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class Conversation:
    """Chat session between a user and the AI assistant.

    Attributes:
        id: MongoDB ObjectId string.
        user_id: Owning user ID string.
        title: Auto-generated or user-defined title.
        status: active | archived.
        total_tokens_used: Cumulative token count.
        model_used: LLM model identifier.
        is_deleted: Soft-delete flag.
        deleted_at: Timestamp of soft-deletion.
        deleted_by: Who deleted the conversation.
        created_at: Record creation timestamp.
        updated_at: Last update timestamp.
        messages: Optionally hydrated list of messages (not stored here).
    """

    user_id: str
    title: str
    status: str = "active"
    total_tokens_used: int = 0
    model_used: str | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: str | None = None
    messages: list["Message"] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialise to MongoDB-ready dict (excludes messages list).

        Returns:
            dict: BSON-compatible document.
        """
        return {
            "user_id": self.user_id,
            "title": self.title,
            "status": self.status,
            "total_tokens_used": self.total_tokens_used,
            "model_used": self.model_used,
            "is_deleted": self.is_deleted,
            "deleted_at": self.deleted_at,
            "deleted_by": self.deleted_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Conversation":
        """Deserialise a MongoDB document into a Conversation instance.

        Args:
            data: Raw MongoDB document.

        Returns:
            Conversation: Populated Conversation dataclass.
        """
        doc_id = data.get("_id") or data.get("id")
        return cls(
            id=str(doc_id) if doc_id is not None else None,
            user_id=data.get("user_id", ""),
            title=data.get("title", ""),
            status=data.get("status", "active"),
            total_tokens_used=data.get("total_tokens_used", 0),
            model_used=data.get("model_used"),
            is_deleted=data.get("is_deleted", False),
            deleted_at=data.get("deleted_at"),
            deleted_by=data.get("deleted_by"),
            created_at=data.get("created_at", datetime.now(UTC)),
            updated_at=data.get("updated_at", datetime.now(UTC)),
        )


@dataclass
class Message:
    """Single message within a conversation.

    Attributes:
        id: MongoDB ObjectId string.
        conversation_id: Parent conversation ID string.
        role: user | assistant | system.
        content: Message text.
        tokens_used: Token count for this message.
        sources: RAG source citations list.
        latency_ms: Response latency in milliseconds.
        feedback: positive | negative | None.
        created_at: Timestamp.
    """

    conversation_id: str
    role: str
    content: str
    tokens_used: int = 0
    sources: list[Any] = field(default_factory=list)
    latency_ms: float | None = None
    feedback: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialise to MongoDB-ready dict.

        Returns:
            dict: BSON-compatible document.
        """
        return {
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "tokens_used": self.tokens_used,
            "sources": self.sources,
            "latency_ms": self.latency_ms,
            "feedback": self.feedback,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Message":
        """Deserialise a MongoDB document into a Message instance.

        Args:
            data: Raw MongoDB document.

        Returns:
            Message: Populated Message dataclass.
        """
        doc_id = data.get("_id") or data.get("id")
        return cls(
            id=str(doc_id) if doc_id is not None else None,
            conversation_id=data.get("conversation_id", ""),
            role=data.get("role", "user"),
            content=data.get("content", ""),
            tokens_used=data.get("tokens_used", 0),
            sources=data.get("sources") or [],
            latency_ms=data.get("latency_ms"),
            feedback=data.get("feedback"),
            created_at=data.get("created_at", datetime.now(UTC)),
        )
