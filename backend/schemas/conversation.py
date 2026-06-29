"""Conversation and Message Pydantic v2 schemas — MongoDB edition."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Message response schema."""
    id: str
    conversation_id: str
    role: str
    content: str
    tokens_used: int
    sources: list[Any]
    latency_ms: float | None
    feedback: str | None
    created_at: datetime

    @classmethod
    def from_message(cls, msg: "Message") -> "MessageResponse":  # type: ignore[name-defined]  # noqa: F821
        return cls(
            id=str(msg.id),
            conversation_id=str(msg.conversation_id),
            role=msg.role,
            content=msg.content,
            tokens_used=msg.tokens_used,
            sources=msg.sources or [],
            latency_ms=msg.latency_ms,
            feedback=msg.feedback,
            created_at=msg.created_at,
        )


class ConversationResponse(BaseModel):
    """Conversation response schema."""
    id: str
    title: str
    user_id: str
    status: str
    total_tokens_used: int
    model_used: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_conversation(cls, conv: "Conversation") -> "ConversationResponse":  # type: ignore[name-defined]  # noqa: F821
        return cls(
            id=str(conv.id),
            title=conv.title,
            user_id=str(conv.user_id),
            status=conv.status,
            total_tokens_used=conv.total_tokens_used,
            model_used=conv.model_used,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )


class ConversationWithMessagesResponse(ConversationResponse):
    """Conversation response with embedded messages."""
    messages: list[MessageResponse] = Field(default_factory=list)

    @classmethod
    def from_conversation(cls, conv: "Conversation") -> "ConversationWithMessagesResponse":  # type: ignore[name-defined]  # noqa: F821
        base = ConversationResponse.from_conversation(conv)
        return cls(
            **base.model_dump(),
            messages=[MessageResponse.from_message(m) for m in conv.messages],
        )


class ChatMessageRequest(BaseModel):
    """Schema for submitting a chat message."""
    content: str = Field(min_length=1, max_length=32768)
    conversation_id: str | None = Field(default=None)


class MessageFeedbackRequest(BaseModel):
    """Schema for submitting feedback on a message."""
    feedback: str = Field(pattern="^(positive|negative)$")


class ChatResponse(BaseModel):
    """Response schema for a chat message exchange."""
    conversation_id: str
    message: MessageResponse
    sources: list[dict[str, Any]] = Field(default_factory=list)
