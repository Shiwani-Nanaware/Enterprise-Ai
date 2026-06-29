"""Authentication service — MongoDB edition.

Login, logout, token refresh, password change.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.jwt import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from auth.password import hash_password, verify_password
from core.config import get_settings
from core.exceptions import AuthenticationError
from core.logging import get_logger
from models.user import User
from repositories.audit_repository import AuditRepository
from repositories.user_repository import UserRepository
from schemas.auth import TokenResponse

logger = get_logger(__name__)
_settings = get_settings()


class AuthService:
    """Handles authentication: login, refresh, logout, password change."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._user_repo = UserRepository(db)
        self._audit_repo = AuditRepository(db)

    async def login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, TokenResponse]:
        """Authenticate a user and return a JWT token pair.

        Args:
            email: The user's email address.
            password: The plaintext password.
            ip_address: Client IP for audit logging.
            user_agent: Client user-agent for audit logging.

        Returns:
            tuple[User, TokenResponse]: Authenticated user and tokens.

        Raises:
            AuthenticationError: If credentials are invalid or account inactive.
        """
        user = await self._user_repo.get_by_email(email)

        if not user or not verify_password(password, user.hashed_password):
            await self._audit_repo.log(
                action="auth.login",
                status="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"email": email, "reason": "invalid_credentials"},
            )
            raise AuthenticationError("Invalid email or password.")

        if not user.is_active:
            await self._audit_repo.log(
                action="auth.login",
                user_id=user.id,
                status="failure",
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"reason": "account_inactive"},
            )
            raise AuthenticationError("Account is deactivated. Contact your administrator.")

        access_token, _ = create_access_token(subject=str(user.id), role=user.role)
        refresh_token, _ = create_refresh_token(subject=str(user.id))

        refresh_hash = hash_password(refresh_token)
        await self._user_repo.update_refresh_token(str(user.id), refresh_hash)

        await self._audit_repo.log(
            action="auth.login",
            user_id=user.id,
            status="success",
            ip_address=ip_address,
            user_agent=user_agent,
            detail={"role": user.role},
        )
        logger.info("User logged in", user_id=str(user.id), role=user.role)

        expires_in = _settings.jwt.access_token_expire_minutes * 60
        return user, TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token using a valid refresh token.

        Args:
            refresh_token: The refresh JWT string.

        Returns:
            TokenResponse: New access token.

        Raises:
            AuthenticationError: If the refresh token is invalid or revoked.
        """
        payload = verify_refresh_token(refresh_token)
        subject = payload.get("sub")
        if not subject:
            raise AuthenticationError("Invalid refresh token.")

        user = await self._user_repo.get_active_by_id(subject)
        if not user or not user.refresh_token_hash:
            raise AuthenticationError("Refresh token has been revoked.")

        if not verify_password(refresh_token, user.refresh_token_hash):
            raise AuthenticationError("Refresh token mismatch.")

        access_token, _ = create_access_token(subject=str(user.id), role=user.role)
        logger.info("Token refreshed", user_id=str(user.id))

        expires_in = _settings.jwt.access_token_expire_minutes * 60
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    async def logout(
        self,
        user: User,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Invalidate the user's refresh token.

        Args:
            user: The authenticated user.
            ip_address: Client IP for audit logging.
            user_agent: Client user-agent for audit logging.
        """
        await self._user_repo.update_refresh_token(str(user.id), None)
        await self._audit_repo.log(
            action="auth.logout",
            user_id=user.id,
            status="success",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        logger.info("User logged out", user_id=str(user.id))

    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        """Change the authenticated user's password.

        Args:
            user: The authenticated user.
            current_password: Current plaintext password.
            new_password: New plaintext password.

        Raises:
            AuthenticationError: If current password is incorrect.
        """
        if not verify_password(current_password, user.hashed_password):
            raise AuthenticationError("Current password is incorrect.")

        new_hash = hash_password(new_password)
        await self._user_repo.update(str(user.id), {"hashed_password": new_hash})
        await self._user_repo.update_refresh_token(str(user.id), None)

        await self._audit_repo.log(
            action="auth.password_change",
            user_id=user.id,
            status="success",
        )
        logger.info("Password changed", user_id=str(user.id))
