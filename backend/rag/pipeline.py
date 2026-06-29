"""RAG retrieval pipeline — ChromaDB edition.

Implements department-filtered similarity search and prompt construction.

Security guarantee: department metadata filtering happens BEFORE any
content reaches the LLM. Unauthorized chunks are never retrieved.
"""

from __future__ import annotations

from typing import Any

from core.config import get_settings
from core.exceptions import LLMError, VectorStoreError
from core.logging import get_logger
from rag.embeddings.hf_embeddings import get_embedding_model
from rag.vectorstore.chroma_client import search_documents

logger = get_logger(__name__)

_settings = get_settings()


async def retrieve_documents(
    query: str,
    departments: list[str],
    collection_name: str | None = None,
    top_k: int | None = None,
    score_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """Retrieve relevant document chunks from ChromaDB with department filtering.

    Args:
        query: The user's question.
        departments: Allowed departments (RBAC-enforced — applied BEFORE LLM).
        collection_name: ChromaDB collection name (defaults to settings).
        top_k: Number of results to return.
        score_threshold: Minimum similarity score (0–1). Chunks below are dropped.

    Returns:
        list[dict]: Retrieved chunks with content and metadata.

    Raises:
        VectorStoreError: If embedding generation fails.
    """
    k = top_k or _settings.rag.top_k_results
    threshold = score_threshold or _settings.rag.similarity_threshold
    coll = collection_name or _settings.chroma.collection_name

    try:
        embed_model = get_embedding_model()
        query_vector: list[float] = await embed_model.aembed_query(query)
    except Exception as exc:
        logger.exception("Embedding generation failed", query_length=len(query))
        raise VectorStoreError(f"Failed to generate query embedding: {exc}") from exc

    # ChromaDB search with department pre-filter (sync — runs in thread pool)
    import asyncio

    loop = asyncio.get_event_loop()
    chunks = await loop.run_in_executor(
        None,
        lambda: search_documents(
            query_embedding=query_vector,
            departments=departments,
            top_k=k,
            collection_name=coll,
        ),
    )

    # Apply similarity threshold
    chunks = [c for c in chunks if c["similarity_score"] >= threshold]

    logger.info(
        "RAG retrieval complete",
        query_length=len(query),
        results=len(chunks),
        departments=departments,
        collection=coll,
    )
    return chunks


def build_system_prompt() -> str:
    """Return the enterprise AI system prompt.

    Returns:
        str: The system instruction string.
    """
    return (
        "You are an Enterprise AI Knowledge Assistant for FinSolve Technologies. "
        "Your role is to answer questions accurately using ONLY the provided context documents. "
        "You must:\n"
        "1. Base every answer strictly on the retrieved context.\n"
        "2. Cite the document sources used in your answer.\n"
        "3. If the context does not contain sufficient information, say so clearly.\n"
        "4. Never fabricate or hallucinate information.\n"
        "5. Maintain a professional, concise tone.\n"
        "6. Format structured data (tables, lists) clearly.\n"
        "Keep answers focused and directly relevant to the question."
    )


def build_rag_prompt(
    query: str,
    context_chunks: list[dict[str, Any]],
    conversation_history: list[dict[str, str]],
) -> list[dict[str, str]]:
    """Build the full message list for the LLM with injected context.

    Args:
        query: The user's current question.
        context_chunks: Retrieved document chunks.
        conversation_history: Prior conversation messages.

    Returns:
        list[dict]: Message list for the chat completion API.
    """
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"[Source {i}: {chunk['filename']} — {chunk['department'].title()} dept]\n"
            f"{chunk['content']}"
        )

    context_text = (
        "\n\n---\n\n".join(context_parts)
        if context_parts
        else "No relevant documents found."
    )

    messages: list[dict[str, str]] = [
        {"role": "system", "content": build_system_prompt()},
    ]

    for msg in conversation_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append(
        {
            "role": "user",
            "content": f"Context Documents:\n{context_text}\n\nQuestion: {query}",
        }
    )
    return messages


async def stream_llm_response(
    messages: list[dict[str, str]],
) -> tuple[str, int]:
    """Call the LLM and return the full response text and token count.

    Args:
        messages: The message list for the chat completion.

    Returns:
        tuple[str, int]: The assistant response text and tokens used.

    Raises:
        LLMError: If the LLM call fails.
    """
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    settings = _settings

    try:
        llm = ChatOpenAI(
            api_key=settings.openai.api_key,
            base_url=settings.openai.api_base,
            model=settings.openai.chat_model,
            temperature=settings.openai.temperature,
            max_tokens=settings.openai.max_tokens,
        )

        lc_messages = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))

        response = await llm.ainvoke(lc_messages)
        answer = response.content if hasattr(response, "content") else str(response)
        tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens = response.usage_metadata.get("total_tokens", 0)

        return str(answer), int(tokens)

    except Exception as exc:
        logger.exception("LLM call failed")
        raise LLMError(f"LLM request failed: {exc}") from exc
