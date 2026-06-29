"""Chat / conversation service — MongoDB + ChromaDB + Guardrails RAG edition."""

from __future__ import annotations

import time

from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.departments import get_accessible_departments
from core.config import get_settings
from core.exceptions import GuardrailViolationError, NotFoundError, PermissionDeniedError
from core.logging import get_logger
from guardrails.engine import check_input, check_output
from models.conversation import Conversation, Message
from models.user import User
from rag.pipeline import build_rag_prompt, retrieve_documents, stream_llm_response
from repositories.conversation_repository import ConversationRepository, MessageRepository

logger = get_logger(__name__)
_settings = get_settings()


class ChatService:
    """Handles chat conversations and RAG-powered message generation with guardrails."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._conv_repo = ConversationRepository(db)
        self._msg_repo = MessageRepository(db)

    async def send_message(
        self,
        user: User,
        content: str,
        conversation_id: str | None = None,
        enable_guardrails: bool = True,
    ) -> tuple[Conversation, Message, list[dict]]:
        """Process a user message through guardrails → RAG → LLM pipeline.

        Args:
            user: The authenticated user.
            content: The user's question.
            conversation_id: Existing conversation ID or None to create new.
            enable_guardrails: Whether to run input/output guardrails.

        Returns:
            tuple: (Conversation, assistant Message, source citations).

        Raises:
            GuardrailViolationError: If input fails guardrail checks.
            NotFoundError: If the specified conversation does not exist.
            PermissionDeniedError: If the user does not own the conversation.
        """
        start_time = time.perf_counter()

        # --- Input Guardrails ---
        if enable_guardrails and _settings.guardrails.enabled:
            guard_result = check_input(
                content,
                mask_pii=True,
                check_scope=True,
                max_tokens=_settings.guardrails.max_input_tokens,
            )
            if not guard_result.passed:
                logger.warning(
                    "Guardrail blocked input",
                    violation=guard_result.violation_type,
                    user_id=str(user.id),
                )
                raise GuardrailViolationError(
                    message=guard_result.violation_detail or "Your message was blocked by content policy.",
                    policy=guard_result.violation_type,
                )
            # Use sanitized (PII-masked) version
            sanitized_content = guard_result.sanitized_input or content
        else:
            sanitized_content = content

        # --- Resolve or create conversation ---
        if conversation_id:
            conversation = await self._conv_repo.get_active_by_id(conversation_id)
            if not conversation:
                raise NotFoundError("Conversation", conversation_id)
            if str(conversation.user_id) != str(user.id):
                raise PermissionDeniedError("You do not have access to this conversation.")
        else:
            title = content[:60].strip()
            if len(content) > 60:
                title += "..."
            conversation = Conversation(
                user_id=str(user.id),
                title=title,
                status="active",
                total_tokens_used=0,
                model_used=_settings.openai.chat_model,
            )
            conversation = await self._conv_repo.create(conversation)

        # Persist user message (original, not masked — store original for audit)
        user_message = Message(
            conversation_id=str(conversation.id),
            role="user",
            content=content,
            tokens_used=0,
        )
        user_message = await self._msg_repo.create(user_message)

        # Load recent conversation history
        history = await self._msg_repo.get_recent_for_context(str(conversation.id), limit=10)
        history_dicts = [
            {"role": m.role, "content": m.content}
            for m in history
            if m.id != user_message.id
        ]

        # RBAC-filtered RAG retrieval
        accessible_departments = get_accessible_departments(user.role)
        retrieved_chunks = await retrieve_documents(
            query=sanitized_content,
            departments=accessible_departments,
        )

        # Build prompt and call LLM
        messages = build_rag_prompt(
            query=sanitized_content,
            context_chunks=retrieved_chunks,
            conversation_history=history_dicts,
        )
        answer, tokens_used = await stream_llm_response(messages)

        # --- Output Guardrails (PII masking on LLM response) ---
        if enable_guardrails and _settings.guardrails.enabled:
            output_guard = check_output(answer, mask_pii=True)
            final_answer = output_guard.sanitized_input or answer
            if output_guard.masked_pii:
                logger.info("PII masked in LLM output", types=list(output_guard.masked_pii.keys()))
        else:
            final_answer = answer

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        sources = [
            {
                "document_id": chunk["document_id"],
                "document_title": chunk["filename"],
                "chunk_index": chunk["chunk_id"],
                "content_preview": chunk["content"][:200],
                "similarity_score": chunk["similarity_score"],
                "department": chunk["department"],
            }
            for chunk in retrieved_chunks
        ]

        # Persist assistant message
        assistant_message = Message(
            conversation_id=str(conversation.id),
            role="assistant",
            content=final_answer,
            tokens_used=tokens_used,
            sources=sources,
            latency_ms=round(elapsed_ms, 2),
        )
        assistant_message = await self._msg_repo.create(assistant_message)

        # Update conversation token total
        new_total = (conversation.total_tokens_used or 0) + tokens_used
        await self._conv_repo.update(
            str(conversation.id),
            {"total_tokens_used": new_total, "model_used": _settings.openai.chat_model},
        )
        conversation.total_tokens_used = new_total

        logger.info(
            "Chat message processed",
            user_id=str(user.id),
            conversation_id=str(conversation.id),
            tokens_used=tokens_used,
            sources_count=len(sources),
            latency_ms=round(elapsed_ms, 2),
        )
        return conversation, assistant_message, sources

    async def rename_conversation(self, conversation_id: str, new_title: str, user: User) -> Conversation:
        """Rename a conversation.

        Args:
            conversation_id: String conversation ID.
            new_title: New title string.
            user: Authenticated user.

        Returns:
            Conversation: Updated conversation.
        """
        conv = await self._conv_repo.get_active_by_id(conversation_id)
        if not conv:
            raise NotFoundError("Conversation", conversation_id)
        if str(conv.user_id) != str(user.id):
            raise PermissionDeniedError("You do not have access to this conversation.")
        await self._conv_repo.update(conversation_id, {"title": new_title.strip()[:200]})
        conv.title = new_title.strip()[:200]
        return conv

    async def get_conversation(self, conversation_id: str, user: User) -> Conversation:
        """Fetch a conversation with ownership check."""
        conv = await self._conv_repo.get_with_messages(conversation_id, str(user.id), self._msg_repo)
        if not conv:
            raise NotFoundError("Conversation", conversation_id)
        return conv

    async def list_conversations(
        self, user: User, offset: int = 0, limit: int = 50, status: str | None = None
    ) -> tuple[list[Conversation], int]:
        """List a user's conversations."""
        convs = await self._conv_repo.list_user_conversations(str(user.id), offset=offset, limit=limit, status=status)
        total = await self._conv_repo.count_user_conversations(str(user.id), status=status)
        return convs, total

    async def delete_conversation(self, conversation_id: str, user: User) -> None:
        """Soft-delete a conversation."""
        deleted = await self._conv_repo.soft_delete(conversation_id, str(user.id))
        if not deleted:
            raise NotFoundError("Conversation", conversation_id)

    async def get_chat_history(self, conversation_id: str, user: User, limit: int = 50) -> list[Message]:
        """Return messages for a conversation."""
        conv = await self._conv_repo.get_active_by_id(conversation_id)
        if not conv:
            raise NotFoundError("Conversation", conversation_id)
        if str(conv.user_id) != str(user.id):
            raise PermissionDeniedError("You do not have access to this conversation.")
        return await self._msg_repo.list_conversation_messages(conversation_id, limit=limit)

    async def submit_feedback(self, message_id: str, feedback: str, user: User) -> Message:
        """Submit feedback on an assistant message."""
        msg = await self._msg_repo.get_by_id(message_id)
        if not msg:
            raise NotFoundError("Message", message_id)
        conv = await self._conv_repo.get_active_by_id(str(msg.conversation_id))
        if not conv or str(conv.user_id) != str(user.id):
            raise PermissionDeniedError("You do not have access to this message.")
        updated = await self._msg_repo.update_feedback(message_id, feedback)
        if not updated:
            raise NotFoundError("Message", message_id)
        return updated
