"""Health check endpoints — MongoDB + ChromaDB edition.

GET /health        — liveness probe
GET /health/ready  — readiness probe
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from core.config import get_settings
from core.logging import get_logger
from schemas.common import HealthStatus

logger = get_logger(__name__)
router = APIRouter()


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="Liveness probe",
    description="Returns 200 if the application is alive.",
)
async def health_check() -> HealthStatus:
    """Application liveness probe."""
    settings = get_settings()
    return HealthStatus(
        status="healthy",
        version=settings.app_version,
        environment=settings.app_env,
        checks={},
    )


@router.get(
    "/health/ready",
    summary="Readiness probe",
    description="Checks MongoDB and ChromaDB connectivity. Returns 200 when healthy, 503 otherwise.",
)
async def readiness_check() -> JSONResponse:
    """Readiness probe — checks MongoDB and ChromaDB."""
    settings = get_settings()
    checks: dict[str, str] = {}
    overall_status = "healthy"

    # MongoDB check
    try:
        from database.mongo import ping_database
        ok = await ping_database()
        checks["mongodb"] = "healthy" if ok else "unhealthy"
        if not ok:
            overall_status = "degraded"
    except Exception as exc:
        checks["mongodb"] = f"unhealthy: {exc!s}"
        overall_status = "degraded"

    # ChromaDB check
    try:
        from rag.vectorstore.chroma_client import get_or_create_collection
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, get_or_create_collection)
        checks["chromadb"] = "healthy"
    except Exception as exc:
        checks["chromadb"] = f"unhealthy: {exc!s}"
        overall_status = "degraded"

    # Redis check (optional / best-effort)
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis.url, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
        checks["redis"] = "healthy"
    except Exception as exc:
        checks["redis"] = f"unavailable: {exc!s}"

    http_status = 200 if overall_status == "healthy" else 503
    return JSONResponse(
        status_code=http_status,
        content={
            "status": overall_status,
            "version": settings.app_version,
            "environment": settings.app_env,
            "checks": checks,
        },
    )
