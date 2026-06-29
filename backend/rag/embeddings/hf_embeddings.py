"""Hugging Face local embedding provider.

Uses BAAI/bge-small-en-v1.5 via sentence-transformers.
No API key required. Model downloads once on first use (~33 MB)
and is cached locally by the HuggingFace hub.

The model is loaded once at application startup and reused for
every embed_documents / embed_query call.
"""

from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Any

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class HuggingFaceEmbedder:
    """Thin async wrapper around a SentenceTransformer model.

    Exposes the same interface as LangChain's Embeddings classes
    (``aembed_documents`` / ``aembed_query``) so it is a drop-in
    replacement throughout the RAG pipeline.

    Attributes:
        model_name: HuggingFace model identifier.
        _model: The underlying SentenceTransformer instance.
    """

    def __init__(self, model_name: str) -> None:
        """Load the sentence-transformers model.

        Args:
            model_name: HuggingFace model identifier.
                        The model is downloaded on first use and
                        cached in ~/.cache/huggingface/.
        """
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name
        logger.info("Loading embedding model", model=model_name)
        self._model: SentenceTransformer = SentenceTransformer(model_name)
        logger.info(
            "Embedding model ready",
            model=model_name,
            dim=self._model.get_sentence_embedding_dimension(),
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of documents synchronously.

        Args:
            texts: List of text strings to embed.

        Returns:
            list[list[float]]: Embedding vectors, one per text.
        """
        embeddings = self._model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return [emb.tolist() for emb in embeddings]

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string synchronously.

        Args:
            text: The query text.

        Returns:
            list[float]: The embedding vector.
        """
        embedding = self._model.encode(
            text,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embedding.tolist()

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of documents asynchronously (runs in thread pool).

        Args:
            texts: List of text strings to embed.

        Returns:
            list[list[float]]: Embedding vectors.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.embed_documents, texts)

    async def aembed_query(self, text: str) -> list[float]:
        """Embed a single query string asynchronously (runs in thread pool).

        Args:
            text: The query text.

        Returns:
            list[float]: The embedding vector.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.embed_query, text)

    @property
    def embedding_dimension(self) -> int:
        """Return the embedding vector dimension.

        Returns:
            int: Dimension of the produced embedding vectors.
        """
        return self._model.get_sentence_embedding_dimension() or 384


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbedder:
    """Return the cached HuggingFace embedding model singleton.

    The model is loaded exactly once during the application lifecycle.
    Subsequent calls return the same cached instance with zero overhead.

    Returns:
        HuggingFaceEmbedder: Ready-to-use embedding instance.
    """
    settings = get_settings()
    model_name = settings.embedding.model
    return HuggingFaceEmbedder(model_name)
