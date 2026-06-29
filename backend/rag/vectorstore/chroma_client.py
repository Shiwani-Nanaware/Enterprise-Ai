"""ChromaDB 1.x persistent vector store client.

Provides:
- A singleton ChromaDB PersistentClient
- Department-filtered similarity search (metadata filter applied BEFORE LLM)
- Helpers for adding and deleting document vectors
"""

from __future__ import annotations

import threading
from typing import Any

import chromadb
from chromadb import Collection

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

_client_lock = threading.Lock()
_chroma_client: chromadb.PersistentClient | None = None


def get_chroma_client() -> chromadb.PersistentClient:
    """Return the cached ChromaDB persistent client singleton (thread-safe).

    Returns:
        chromadb.PersistentClient: Client backed by local disk storage.
    """
    global _chroma_client
    if _chroma_client is None:
        with _client_lock:
            if _chroma_client is None:
                settings = get_settings()
                _chroma_client = chromadb.PersistentClient(
                    path=settings.chroma.db_path,
                )
                logger.info(
                    "ChromaDB client initialised",
                    path=settings.chroma.db_path,
                )
    return _chroma_client


def get_or_create_collection(collection_name: str | None = None) -> Collection:
    """Get or create the named ChromaDB collection.

    Args:
        collection_name: Name override. Defaults to settings value.

    Returns:
        Collection: ChromaDB collection instance.
    """
    settings = get_settings()
    name = collection_name or settings.chroma.collection_name
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )
    logger.debug("ChromaDB collection ready", collection=name)
    return collection


def delete_document_vectors(document_id: str, collection_name: str | None = None) -> int:
    """Remove all vectors for a document from ChromaDB.

    Args:
        document_id: The document ID whose chunks should be removed.
        collection_name: Optional collection override.

    Returns:
        int: Number of vectors deleted.
    """
    settings = get_settings()
    name = collection_name or settings.chroma.collection_name
    client = get_chroma_client()

    try:
        collection = client.get_collection(name)
    except Exception:
        logger.warning("Collection not found during delete", collection=name)
        return 0

    try:
        existing = collection.get(
            where={"document_id": {"$eq": document_id}},
            include=[],
        )
        ids_to_delete: list[str] = existing.get("ids") or []
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            logger.info(
                "Deleted document vectors from ChromaDB",
                document_id=document_id,
                count=len(ids_to_delete),
            )
        return len(ids_to_delete)
    except Exception as exc:
        logger.warning(
            "Failed to delete vectors for document",
            document_id=document_id,
            error=str(exc),
        )
        return 0


def search_documents(
    query_embedding: list[float],
    departments: list[str],
    top_k: int = 5,
    collection_name: str | None = None,
) -> list[dict[str, Any]]:
    """Similarity search with department metadata pre-filtering.

    Security: Only chunks whose ``department`` metadata is in ``departments``
    are returned. Unauthorized chunks never reach the LLM.

    Args:
        query_embedding: Query embedding vector.
        departments: Permitted departments (RBAC-enforced).
        top_k: Number of results to return.
        collection_name: Optional collection override.

    Returns:
        list[dict]: Retrieved chunks with content and metadata.
    """
    settings = get_settings()
    name = collection_name or settings.chroma.collection_name
    client = get_chroma_client()

    try:
        collection = client.get_collection(name)
    except Exception as exc:
        logger.warning("ChromaDB collection not found for query", error=str(exc))
        return []

    # ChromaDB 1.x where filter — $in for multiple, $eq for single
    if len(departments) == 1:
        where_filter: dict[str, Any] = {"department": {"$eq": departments[0]}}
    else:
        where_filter = {"department": {"$in": departments}}

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, collection.count())),
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        logger.warning("ChromaDB query failed", error=str(exc))
        return []

    retrieved: list[dict[str, Any]] = []
    docs_list: list[str] = (results.get("documents") or [[]])[0] or []
    metas_list: list[dict] = (results.get("metadatas") or [[]])[0] or []
    dist_list: list[float] = (results.get("distances") or [[]])[0] or []

    for content, meta, distance in zip(docs_list, metas_list, dist_list):
        # Cosine distance 0→identical, 2→opposite; convert to 0–1 similarity
        similarity = round(max(0.0, 1.0 - (distance / 2.0)), 4)
        m = meta or {}
        retrieved.append(
            {
                "content": content or "",
                "document_id": m.get("document_id", ""),
                "filename": m.get("filename", ""),
                "department": m.get("department", ""),
                "source": m.get("source", ""),
                "chunk_id": m.get("chunk_id", 0),
                "similarity_score": similarity,
            }
        )

    logger.info(
        "ChromaDB search complete",
        results=len(retrieved),
        departments=departments,
        collection=name,
    )
    return retrieved


def add_chunks_to_collection(
    chunk_ids: list[str],
    embeddings: list[list[float]],
    documents: list[str],
    metadatas: list[dict[str, Any]],
    collection_name: str | None = None,
) -> None:
    """Add text chunks with embeddings to ChromaDB.

    Args:
        chunk_ids: Unique IDs for each chunk.
        embeddings: Embedding vectors.
        documents: Text content for each chunk.
        metadatas: Metadata dicts for each chunk.
        collection_name: Optional collection override.
    """
    collection = get_or_create_collection(collection_name)
    collection.add(
        ids=chunk_ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )
    settings = get_settings()
    logger.info(
        "Chunks added to ChromaDB",
        count=len(chunk_ids),
        collection=collection_name or settings.chroma.collection_name,
    )
