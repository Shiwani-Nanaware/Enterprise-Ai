"""Conversation and Message repositories — MongoDB implementation."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from database.mongo import CONVERSATIONS_COLLECTION, MESSAGES_COLLECTION
from models.conversation import Conversation, Message
from repositories.base import MongoRepository


class ConversationRepository(MongoRepository[Conversation]):
    """Repository for Conversation documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, CONVERSATIONS_COLLECTION)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_active_by_id(self, conversation_id: str) -> Conversation | None:
        """Fetch a non-deleted conversation by ID.

        Args:
            conversation_id: String ObjectId.

        Returns:
            Conversation | None: The conversation or None.
        """
        try:
            oid = self._to_object_id(conversation_id)
        except ValueError:
            return None
        doc = await self._find_one({"_id": oid, "is_deleted": False})
        return Conversation.from_dict(doc) if doc else None

    async def get_with_messages(
        self,
        conversation_id: str,
        user_id: str,
        msg_repo: "MessageRepository",
    ) -> Conversation | None:
        """Fetch a conversation with its messages loaded.

        Args:
            conversation_id: String ObjectId.
            user_id: Owner user ID for access control.
            msg_repo: MessageRepository instance for loading messages.

        Returns:
            Conversation | None: Conversation with messages or None.
        """
        try:
            oid = self._to_object_id(conversation_id)
        except ValueError:
            return None
        doc = await self._find_one(
            {"_id": oid, "user_id": user_id, "is_deleted": False}
        )
        if not doc:
            return None
        conv = Conversation.from_dict(doc)
        conv.messages = await msg_repo.list_conversation_messages(conversation_id)
        return conv

    async def list_user_conversations(
        self,
        user_id: str,
        offset: int = 0,
        limit: int = 50,
        status: str | None = None,
    ) -> list[Conversation]:
        """List conversations for a user.

        Args:
            user_id: User ID string.
            offset: Documents to skip.
            limit: Max documents to return.
            status: Optional status filter.

        Returns:
            list[Conversation]: The user's conversations.
        """
        query: dict[str, Any] = {"user_id": user_id, "is_deleted": False}
        if status:
            query["status"] = status
        docs = await self._find_many(
            query, sort=[("updated_at", -1)], skip=offset, limit=limit
        )
        return [Conversation.from_dict(d) for d in docs]

    async def count_user_conversations(
        self, user_id: str, status: str | None = None
    ) -> int:
        """Count a user's conversations.

        Args:
            user_id: User ID string.
            status: Optional status filter.

        Returns:
            int: Count.
        """
        query: dict[str, Any] = {"user_id": user_id, "is_deleted": False}
        if status:
            query["status"] = status
        return await self._count(query)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def create(self, conversation: Conversation) -> Conversation:
        """Insert a new conversation document.

        Args:
            conversation: Conversation dataclass.

        Returns:
            Conversation: With id populated.
        """
        doc = conversation.to_dict()
        new_id = await self._insert(doc)
        conversation.id = new_id
        return conversation

    async def update(self, conversation_id: str, updates: dict[str, Any]) -> bool:
        """Apply field updates to a conversation.

        Args:
            conversation_id: String ObjectId.
            updates: Fields to set.

        Returns:
            bool: True if modified.
        """
        updates["updated_at"] = datetime.now(UTC)
        try:
            oid = self._to_object_id(conversation_id)
        except ValueError:
            return False
        return await self._update_one({"_id": oid}, {"$set": updates})

    async def soft_delete(self, conversation_id: str, user_id: str) -> bool:
        """Soft-delete a conversation owned by a user.

        Args:
            conversation_id: String ObjectId.
            user_id: Owning user ID.

        Returns:
            bool: True if modified.
        """
        try:
            oid = self._to_object_id(conversation_id)
        except ValueError:
            return False
        return await self._update_one(
            {"_id": oid, "user_id": user_id, "is_deleted": False},
            {
                "$set": {
                    "is_deleted": True,
                    "deleted_at": datetime.now(UTC),
                    "deleted_by": user_id,
                    "updated_at": datetime.now(UTC),
                }
            },
        )


class MessageRepository(MongoRepository[Message]):
    """Repository for Message documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, MESSAGES_COLLECTION)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_by_id(self, message_id: str) -> Message | None:
        """Fetch a message by ID.

        Args:
            message_id: String ObjectId.

        Returns:
            Message | None: The message or None.
        """
        try:
            oid = self._to_object_id(message_id)
        except ValueError:
            return None
        doc = await self._find_one({"_id": oid})
        return Message.from_dict(doc) if doc else None

    async def list_conversation_messages(
        self, conversation_id: str, limit: int = 50
    ) -> list[Message]:
        """List messages for a conversation ordered oldest-first.

        Args:
            conversation_id: Parent conversation ID string.
            limit: Max messages.

        Returns:
            list[Message]: Messages in chronological order.
        """
        docs = await self._find_many(
            {"conversation_id": conversation_id},
            sort=[("created_at", 1)],
            limit=limit,
        )
        return [Message.from_dict(d) for d in docs]

    async def get_recent_for_context(
        self, conversation_id: str, limit: int = 10
    ) -> list[Message]:
        """Get the most recent messages for LLM context, oldest-first.

        Args:
            conversation_id: Parent conversation ID string.
            limit: Number of recent messages.

        Returns:
            list[Message]: Messages in chronological order.
        """
        docs = await self._find_many(
            {"conversation_id": conversation_id},
            sort=[("created_at", -1)],
            limit=limit,
        )
        messages = [Message.from_dict(d) for d in docs]
        return list(reversed(messages))

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def create(self, message: Message) -> Message:
        """Insert a new message document.

        Args:
            message: Message dataclass.

        Returns:
            Message: With id populated.
        """
        doc = message.to_dict()
        new_id = await self._insert(doc)
        message.id = new_id
        return message

    async def update_feedback(
        self, message_id: str, feedback: str
    ) -> Message | None:
        """Update the feedback field on a message.

        Args:
            message_id: String ObjectId.
            feedback: 'positive' or 'negative'.

        Returns:
            Message | None: The updated message or None.
        """
        try:
            oid = self._to_object_id(message_id)
        except ValueError:
            return None
        await self._update_one(
            {"_id": oid},
            {"$set": {"feedback": feedback}},
        )
        return await self.get_by_id(message_id)
