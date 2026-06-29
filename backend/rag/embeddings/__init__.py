"""Embeddings package — local HuggingFace embedding provider.

Default model: BAAI/bge-small-en-v1.5 (no API key required).
"""

from rag.embeddings.hf_embeddings import HuggingFaceEmbedder, get_embedding_model

__all__ = ["HuggingFaceEmbedder", "get_embedding_model"]
