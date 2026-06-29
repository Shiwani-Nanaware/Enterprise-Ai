"""User management API endpoints — MongoDB edition."""

from fastapi import APIRouter, Query, status

from auth.roles import Role
from core.dependencies import CurrentUserDep
from core.exceptions import PermissionDeniedError
from database.mongo import MongoDep
from schemas.common import PaginatedResponse, SuccessResponse
from schemas.user import UserCreateRequest, UserResponse, UserUpdateRequest
from services.user_service import UserService
from utils.pagination import calculate_total_pages

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=PaginatedResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users",
    description="Admin-only. List all active users.",
)
async def list_users(
    current_user: CurrentUserDep,
    db: MongoDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: str | None = Query(default=None),
    department: str | None = Query(default=None),
) -> PaginatedResponse[UserResponse]:
    if current_user.role not in (Role.ADMIN, Role.SUPER_ADMIN):
        raise PermissionDeniedError("Only administrators can list all users.")
    service = UserService(db)
    offset = (page - 1) * page_size
    users, total = await service.list_users(offset=offset, limit=page_size, role=role, department=department)
    return PaginatedResponse(
        data=[UserResponse.from_user(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.post(
    "",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    description="Admin-only. Create a new user account.",
)
async def create_user(
    body: UserCreateRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
    role: str = Query(default=Role.USER),
) -> SuccessResponse[UserResponse]:
    if current_user.role not in (Role.ADMIN, Role.SUPER_ADMIN):
        raise PermissionDeniedError("Only administrators can create users.")
    service = UserService(db)
    user = await service.create_user(body, role=role, created_by=str(current_user.id))
    return SuccessResponse(data=UserResponse.from_user(user), message="User created successfully.")


@router.get(
    "/{user_id}",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
)
async def get_user(
    user_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[UserResponse]:
    if user_id != str(current_user.id) and current_user.role not in (Role.ADMIN, Role.SUPER_ADMIN):
        raise PermissionDeniedError("You may only view your own profile.")
    service = UserService(db)
    user = await service.get_user(user_id)
    return SuccessResponse(data=UserResponse.from_user(user))


@router.patch(
    "/{user_id}",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Update user profile",
)
async def update_user(
    user_id: str,
    body: UserUpdateRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[UserResponse]:
    service = UserService(db)
    user = await service.update_user(user_id, body, current_user)
    return SuccessResponse(data=UserResponse.from_user(user), message="Profile updated.")


@router.post(
    "/{user_id}/role",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Assign role (admin-only)",
)
async def assign_role(
    user_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
    new_role: str = Query(...),
) -> SuccessResponse[UserResponse]:
    service = UserService(db)
    user = await service.assign_role(user_id, new_role, current_user)
    return SuccessResponse(data=UserResponse.from_user(user), message=f"Role updated to '{new_role}'.")


@router.post(
    "/{user_id}/deactivate",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Deactivate user (admin-only)",
)
async def deactivate_user(
    user_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[UserResponse]:
    service = UserService(db)
    user = await service.deactivate_user(user_id, current_user)
    return SuccessResponse(data=UserResponse.from_user(user), message="User deactivated.")
