"""Analytics API endpoints.

GET /analytics/overview
GET /analytics/daily-activity
GET /analytics/department-usage
GET /analytics/top-users
GET /analytics/documents
GET /analytics/failed-requests
GET /analytics/recent-uploads
"""

from fastapi import APIRouter, Query, status

from auth.roles import Role
from core.dependencies import CurrentUserDep
from core.exceptions import PermissionDeniedError
from database.mongo import MongoDep
from schemas.common import SuccessResponse
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _require_admin_or_analyst(user: "User") -> None:  # type: ignore[name-defined]
    if user.role not in (Role.ADMIN, Role.SUPER_ADMIN, Role.ANALYST, Role.MANAGER, "ceo"):
        raise PermissionDeniedError("Analytics access requires analyst role or above.")


@router.get("/overview", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK, summary="Platform overview metrics")
async def get_overview(current_user: CurrentUserDep, db: MongoDep) -> SuccessResponse[dict]:
    """Return top-level platform KPIs."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_overview()
    return SuccessResponse(data=data)


@router.get("/daily-activity", response_model=SuccessResponse[list], status_code=status.HTTP_200_OK, summary="Daily activity data")
async def get_daily_activity(
    current_user: CurrentUserDep,
    db: MongoDep,
    days: int = Query(default=14, ge=1, le=90),
) -> SuccessResponse[list]:
    """Return daily conversation and message counts."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_daily_activity(days=days)
    return SuccessResponse(data=data)


@router.get("/department-usage", response_model=SuccessResponse[list], status_code=status.HTTP_200_OK, summary="Department usage breakdown")
async def get_department_usage(current_user: CurrentUserDep, db: MongoDep) -> SuccessResponse[list]:
    """Return query counts per department."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_department_usage()
    return SuccessResponse(data=data)


@router.get("/top-users", response_model=SuccessResponse[list], status_code=status.HTTP_200_OK, summary="Top users by query count")
async def get_top_users(
    current_user: CurrentUserDep,
    db: MongoDep,
    limit: int = Query(default=10, ge=1, le=50),
) -> SuccessResponse[list]:
    """Return most active users."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_top_users(limit=limit)
    return SuccessResponse(data=data)


@router.get("/documents", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK, summary="Document statistics")
async def get_document_stats(current_user: CurrentUserDep, db: MongoDep) -> SuccessResponse[dict]:
    """Return document counts and storage stats."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_document_stats()
    return SuccessResponse(data=data)


@router.get("/failed-requests", response_model=SuccessResponse[list], status_code=status.HTTP_200_OK, summary="Recent failed requests")
async def get_failed_requests(
    current_user: CurrentUserDep,
    db: MongoDep,
    limit: int = Query(default=20, ge=1, le=100),
) -> SuccessResponse[list]:
    """Return recent failed audit log entries."""
    if current_user.role not in (Role.ADMIN, Role.SUPER_ADMIN):
        raise PermissionDeniedError("Admin access required.")
    svc = AnalyticsService(db)
    data = await svc.get_failed_requests(limit=limit)
    return SuccessResponse(data=data)


@router.get("/recent-uploads", response_model=SuccessResponse[list], status_code=status.HTTP_200_OK, summary="Recent document uploads")
async def get_recent_uploads(
    current_user: CurrentUserDep,
    db: MongoDep,
    limit: int = Query(default=10, ge=1, le=50),
) -> SuccessResponse[list]:
    """Return recently uploaded documents."""
    _require_admin_or_analyst(current_user)
    svc = AnalyticsService(db)
    data = await svc.get_recent_uploads(limit=limit)
    return SuccessResponse(data=data)
