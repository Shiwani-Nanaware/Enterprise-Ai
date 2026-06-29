"""FastAPI application factory — MongoDB + ChromaDB edition."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from api.routes import router as api_router
from core.config import Settings, get_settings
from core.logging import configure_logging, get_logger
from middleware.exception_handler import register_exception_handlers
from middleware.request_id import RequestIDMiddleware
from middleware.timing import RequestTimingMiddleware

logger = get_logger(__name__)


def _configure_sentry(settings: Settings) -> None:
    if not settings.sentry_dsn or settings.is_development:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.app_env,
            release=f"{settings.app_name}@{settings.app_version}",
            traces_sample_rate=0.1,
            integrations=[FastApiIntegration(transaction_style="endpoint")],
            send_default_pii=False,
        )
        logger.info("Sentry SDK initialised")
    except ImportError:
        logger.warning("Sentry SDK not installed, skipping")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup/shutdown lifecycle — MongoDB + ChromaDB."""
    settings = get_settings()

    logger.info(
        "Application starting",
        name=settings.app_name,
        version=settings.app_version,
        env=settings.app_env,
    )

    # Ensure document storage directory exists
    from pathlib import Path
    Path(settings.document_storage_path).mkdir(parents=True, exist_ok=True)
    logger.info("Document storage ready", path=settings.document_storage_path)

    # Create MongoDB indexes (idempotent)
    try:
        from database.mongo import ensure_indexes
        await ensure_indexes()
        logger.info("MongoDB indexes ensured")
    except Exception as exc:
        logger.warning("MongoDB index creation failed — will retry on next start", error=str(exc))

    # Initialise ChromaDB collection
    try:
        import asyncio
        from rag.vectorstore.chroma_client import get_or_create_collection
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: get_or_create_collection())
        logger.info("ChromaDB collection ready", collection=settings.chroma.collection_name)
    except Exception as exc:
        logger.warning("ChromaDB init failed — will retry on first request", error=str(exc))

    # Warm up embedding model (downloads once, cached thereafter)
    # NOTE: skipped on startup to avoid paging file exhaustion on low-memory systems.
    # The model loads automatically on the first document upload or chat query.
    logger.info(
        "Embedding model will load on first use",
        model=settings.embedding.model,
        provider=settings.embedding.provider,
    )

    logger.info("Application startup complete")
    yield

    # Shutdown
    logger.info("Application shutting down")
    try:
        from database.mongo import get_mongo_client
        get_mongo_client().close()
        logger.info("MongoDB connection closed")
    except Exception as exc:
        logger.warning("Error closing MongoDB connection", error=str(exc))
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()
    configure_logging()
    _configure_sentry(settings)

    app = FastAPI(
        title=settings.app_name,
        description=(
            "Enterprise AI Knowledge Assistant API — "
            "MongoDB + ChromaDB RAG platform."
        ),
        version=settings.app_version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=settings.debug,
        lifespan=lifespan,
    )

    if settings.is_production:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RequestTimingMiddleware)

    # Rate limiting
    if settings.rate_limit_enabled:
        from middleware.rate_limit import RateLimitMiddleware
        app.add_middleware(
            RateLimitMiddleware,
            requests_per_minute=settings.rate_limit_requests_per_minute,
            burst=settings.rate_limit_burst,
        )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    logger.info(
        "FastAPI application created",
        debug=settings.debug,
        api_prefix=settings.api_v1_prefix,
    )
    return app
