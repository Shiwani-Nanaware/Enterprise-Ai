"""Chat API endpoints — MongoDB + ChromaDB + Guardrails RAG edition."""

import json

from fastapi import APIRouter, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.dependencies import CurrentUserDep
from database.mongo import MongoDep
from schemas.common import PaginatedResponse, SuccessResponse
from schemas.conversation import (
    ChatMessageRequest,
    ChatResponse,
    ConversationResponse,
    ConversationWithMessagesResponse,
    MessageFeedbackRequest,
    MessageResponse,
)
from services.chat_service import ChatService
from utils.pagination import calculate_total_pages

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    response_model=SuccessResponse[ChatResponse],
    status_code=status.HTTP_200_OK,
    summary="Send chat message",
    description=(
        "Send a message to the AI assistant. Retrieval is department-filtered "
        "via ChromaDB metadata — unauthorized chunks never reach the LLM."
    ),
)
async def send_message(
    body: ChatMessageRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[ChatResponse]:
    service = ChatService(db)
    conversation, assistant_message, sources = await service.send_message(
        user=current_user,
        content=body.content,
        conversation_id=body.conversation_id,
    )
    response = ChatResponse(
        conversation_id=str(conversation.id),
        message=MessageResponse.from_message(assistant_message),
        sources=sources,
    )
    return SuccessResponse(data=response)


@router.get(
    "/conversations",
    response_model=PaginatedResponse[ConversationResponse],
    status_code=status.HTTP_200_OK,
    summary="List conversations",
)
async def list_conversations(
    current_user: CurrentUserDep,
    db: MongoDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
) -> PaginatedResponse[ConversationResponse]:
    service = ChatService(db)
    offset = (page - 1) * page_size
    convs, total = await service.list_conversations(
        user=current_user, offset=offset, limit=page_size, status=status
    )
    return PaginatedResponse(
        data=[ConversationResponse.from_conversation(c) for c in convs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=SuccessResponse[ConversationWithMessagesResponse],
    status_code=status.HTTP_200_OK,
    summary="Get conversation with messages",
)
async def get_conversation(
    conversation_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[ConversationWithMessagesResponse]:
    service = ChatService(db)
    conv = await service.get_conversation(conversation_id, current_user)
    return SuccessResponse(data=ConversationWithMessagesResponse.from_conversation(conv))


@router.delete(
    "/conversations/{conversation_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete conversation",
)
async def delete_conversation(
    conversation_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[dict]:
    service = ChatService(db)
    await service.delete_conversation(conversation_id, current_user)
    return SuccessResponse(data={}, message="Conversation deleted.")


@router.get(
    "/history/{conversation_id}",
    response_model=SuccessResponse[list[MessageResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get chat history",
)
async def get_chat_history(
    conversation_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
    limit: int = Query(default=50, ge=1, le=200),
) -> SuccessResponse[list[MessageResponse]]:
    service = ChatService(db)
    messages = await service.get_chat_history(conversation_id, current_user, limit=limit)
    return SuccessResponse(data=[MessageResponse.from_message(m) for m in messages])


@router.post(
    "/feedback/{message_id}",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Submit message feedback",
)
async def submit_feedback(
    message_id: str,
    body: MessageFeedbackRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[MessageResponse]:
    service = ChatService(db)
    message = await service.submit_feedback(message_id, body.feedback, current_user)
    return SuccessResponse(data=MessageResponse.from_message(message), message="Feedback recorded.")


class RenameConversationRequest(BaseModel):
    """Request to rename a conversation."""
    title: str = Field(min_length=1, max_length=200)


@router.patch(
    "/conversations/{conversation_id}/rename",
    response_model=SuccessResponse[ConversationResponse],
    status_code=status.HTTP_200_OK,
    summary="Rename conversation",
    description="Update the title of a conversation.",
)
async def rename_conversation(
    conversation_id: str,
    body: RenameConversationRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[ConversationResponse]:
    service = ChatService(db)
    conv = await service.rename_conversation(conversation_id, body.title, current_user)
    return SuccessResponse(data=ConversationResponse.from_conversation(conv), message="Conversation renamed.")
