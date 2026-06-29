"""Authentication API endpoints — MongoDB edition.

POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
POST /auth/change-password
"""

from fastapi import APIRouter, Request, status

from core.dependencies import CurrentUserDep
from database.mongo import MongoDep
from schemas.auth import ChangePasswordRequest, LoginRequest, RefreshTokenRequest, TokenResponse
from schemas.common import SuccessResponse
from schemas.user import UserResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=SuccessResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate with email and password. Returns JWT access and refresh tokens.",
)
async def login(
    request: Request,
    body: LoginRequest,
    db: MongoDep,
) -> SuccessResponse[TokenResponse]:
    """Authenticate and return token pair."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    ua = request.headers.get("User-Agent")
    _user, tokens = await service.login(body.email, body.password, ip_address=ip, user_agent=ua)
    return SuccessResponse(data=tokens, message="Login successful.")


@router.post(
    "/refresh",
    response_model=SuccessResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token.",
)
async def refresh_token(
    body: RefreshTokenRequest,
    db: MongoDep,
) -> SuccessResponse[TokenResponse]:
    """Refresh the access token."""
    service = AuthService(db)
    tokens = await service.refresh(body.refresh_token)
    return SuccessResponse(data=tokens, message="Token refreshed.")


@router.post(
    "/logout",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Logout",
    description="Invalidate the current user's refresh token.",
)
async def logout(
    request: Request,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[dict]:
    """Logout — invalidate refresh token."""
    service = AuthService(db)
    ip = request.client.host if request.client else None
    ua = request.headers.get("User-Agent")
    await service.logout(current_user, ip_address=ip, user_agent=ua)
    return SuccessResponse(data={}, message="Logged out successfully.")


@router.get(
    "/me",
    response_model=SuccessResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Return the profile of the currently authenticated user.",
)
async def get_me(current_user: CurrentUserDep) -> SuccessResponse[UserResponse]:
    """Return the authenticated user's profile."""
    return SuccessResponse(data=UserResponse.from_user(current_user))


@router.post(
    "/change-password",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="Change the authenticated user's password. Invalidates existing sessions.",
)
async def change_password(
    body: ChangePasswordRequest,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[dict]:
    """Change current user's password."""
    service = AuthService(db)
    await service.change_password(current_user, body.current_password, body.new_password)
    return SuccessResponse(data={}, message="Password changed successfully.")
