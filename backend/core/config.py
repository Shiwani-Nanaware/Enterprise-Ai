"""Application configuration.

Centralises all environment variable loading using Pydantic Settings.
MongoDB Atlas + ChromaDB edition. No PostgreSQL or Qdrant.

Strategy: load .env into os.environ at import time so every sub-settings
class reads the correct values regardless of where it is instantiated.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# ---------------------------------------------------------------------------
# Load .env into process environment early — before any BaseSettings init.
# Search for .env in the backend directory and one level up (project root).
# ---------------------------------------------------------------------------
_here = Path(__file__).resolve().parent.parent  # backend/
_env_candidates = [
    _here / ".env",
    _here.parent / ".env",
]
for _env_path in _env_candidates:
    if _env_path.exists():
        load_dotenv(str(_env_path), override=False)
        break


# ---------------------------------------------------------------------------
# Sub-settings — read from os.environ (already populated by load_dotenv)
# ---------------------------------------------------------------------------

class MongoSettings(BaseSettings):
    """MongoDB Atlas connection configuration."""

    model_config = SettingsConfigDict(env_prefix="MONGODB_", extra="ignore")

    uri: str = Field(default="mongodb://localhost:27017")
    database_name: str = Field(default="finsolve_ai")

    def model_post_init(self, __context: object) -> None:
        """Fall back to DATABASE_NAME if MONGODB_DATABASE_NAME not set."""
        if self.database_name == "finsolve_ai":
            env_val = os.environ.get("DATABASE_NAME", "").strip()
            if env_val:
                object.__setattr__(self, "database_name", env_val)


class RedisSettings(BaseSettings):
    """Redis cache configuration."""

    model_config = SettingsConfigDict(env_prefix="REDIS_", extra="ignore")

    host: str = Field(default="localhost")
    port: int = Field(default=6379)
    password: str = Field(default="changeme")
    db: int = Field(default=0)

    @property
    def url(self) -> str:
        """Construct the Redis connection URL."""
        return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"


class JWTSettings(BaseSettings):
    """JWT authentication configuration."""

    model_config = SettingsConfigDict(env_prefix="JWT_", extra="ignore")

    secret_key: str = Field(default="changeme-in-production-min-32-chars")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    refresh_token_expire_days: int = Field(default=7)


class OpenAISettings(BaseSettings):
    """OpenAI-compatible LLM provider configuration (also works with Groq).

    Note: only used for the CHAT model. Embeddings use HuggingFace locally.
    """

    model_config = SettingsConfigDict(env_prefix="OPENAI_", extra="ignore")

    api_key: str = Field(default="")
    api_base: str = Field(default="https://api.groq.com/openai/v1")
    chat_model: str = Field(default="llama3-70b-8192")
    max_tokens: int = Field(default=4096)
    temperature: float = Field(default=0.1)


class EmbeddingSettings(BaseSettings):
    """Local Hugging Face embedding configuration. No API key required."""

    model_config = SettingsConfigDict(env_prefix="EMBEDDING_", extra="ignore")

    provider: str = Field(default="huggingface")
    model: str = Field(default="BAAI/bge-small-en-v1.5")


class ChromaSettings(BaseSettings):
    """ChromaDB persistent vector store configuration."""

    model_config = SettingsConfigDict(env_prefix="CHROMA_", extra="ignore")

    db_path: str = Field(default="./chroma_db")
    collection_name: str = Field(default="enterprise_knowledge")


class RAGSettings(BaseSettings):
    """Retrieval-Augmented Generation pipeline configuration."""

    model_config = SettingsConfigDict(env_prefix="RAG_", extra="ignore")

    chunk_size: int = Field(default=600)
    chunk_overlap: int = Field(default=100)
    top_k_results: int = Field(default=5)
    similarity_threshold: float = Field(default=0.7)


class GuardrailsSettings(BaseSettings):
    """AI guardrails configuration."""

    model_config = SettingsConfigDict(env_prefix="GUARDRAILS_", extra="ignore")

    enabled: bool = Field(default=True)
    max_input_tokens: int = Field(default=8192)
    max_output_tokens: int = Field(default=4096)
    content_filter_enabled: bool = Field(default=True)


# ---------------------------------------------------------------------------
# Root settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    """Root application settings — MongoDB + ChromaDB edition."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="Enterprise AI Knowledge Assistant")
    app_env: Literal["development", "staging", "production"] = Field(default="development")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)
    secret_key: str = Field(default="changeme-in-production")

    # API
    backend_host: str = Field(default="0.0.0.0")
    backend_port: int = Field(default=8000)
    backend_workers: int = Field(default=4)
    api_v1_prefix: str = Field(default="/api/v1")
    allowed_origins: list[str] = Field(default=["http://localhost:5173"])

    # Document storage
    document_storage_path: str = Field(default="./storage/documents")
    max_document_size_mb: int = Field(default=50)
    allowed_document_types: list[str] = Field(
        default=["pdf", "docx", "txt", "md", "csv"]
    )

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO"
    )
    log_format: Literal["json", "text"] = Field(default="json")

    # Sentry (optional)
    sentry_dsn: str = Field(default="")
    enable_metrics: bool = Field(default=True)
    metrics_port: int = Field(default=9090)

    # Rate limiting
    rate_limit_enabled: bool = Field(default=True)
    rate_limit_requests_per_minute: int = Field(default=60)
    rate_limit_burst: int = Field(default=100)

    # Sub-configurations — constructed after .env is loaded into os.environ
    mongo: MongoSettings = Field(default_factory=MongoSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    jwt: JWTSettings = Field(default_factory=JWTSettings)
    openai: OpenAISettings = Field(default_factory=OpenAISettings)
    chroma: ChromaSettings = Field(default_factory=ChromaSettings)
    rag: RAGSettings = Field(default_factory=RAGSettings)
    guardrails: GuardrailsSettings = Field(default_factory=GuardrailsSettings)
    embedding: EmbeddingSettings = Field(default_factory=EmbeddingSettings)

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        """Accept JSON array or comma-separated string."""
        if isinstance(value, list):
            return value
        # strip surrounding brackets if present then split
        v = value.strip()
        if v.startswith("["):
            import json
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    @field_validator("allowed_document_types", mode="before")
    @classmethod
    def parse_allowed_document_types(cls, value: str | list[str]) -> list[str]:
        """Accept JSON array or comma-separated string."""
        if isinstance(value, list):
            return value
        v = value.strip()
        if v.startswith("["):
            import json
            return [t.strip().lower() for t in json.loads(v)]
        return [t.strip().lower() for t in v.split(",") if t.strip()]

    @property
    def is_production(self) -> bool:
        """Return True when running in production."""
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        """Return True when running in development."""
        return self.app_env == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached application settings singleton.

    Guaranteed to only construct Settings once. The .env file is already
    loaded into os.environ at module import time, so all sub-settings
    read the correct values.
    """
    return Settings()
