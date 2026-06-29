"""User management service — MongoDB edition."""

from __future__ import annotations

from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.password import hash_password
from auth.roles import Role
from core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from core.logging import get_logger
from models.user import User
from repositories.user_repository import UserRepository
from schemas.user import UserCreateRequest, UserUpdateRequest

logger = get_logger(__name__)


class UserService:
    """Handles user CRUD operations."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._repo = UserRepository(db)

    async def create_user(
        self,
        request: UserCreateRequest,
        role: str = Role.USER,
        created_by: str | None = None,
    ) -> User:
        """Create a new user account.

        Args:
            request: Validated user creation payload.
            role: Role to assign (default 'user').
            created_by: Admin user ID creating the account.

        Returns:
            User: The newly created user.

        Raises:
            ConflictError: If the email is already registered.
        """
        email_lower = request.email.lower()
        if await self._repo.email_exists(email_lower):
            raise ConflictError(
                f"An account with email '{email_lower}' already exists.",
                resource="User",
            )

        user = User(
            email=email_lower,
            full_name=request.full_name,
            hashed_password=hash_password(request.password),
            role=role,
            department=request.department,
            job_title=request.job_title,
            is_active=True,
            is_verified=False,
        )
        user = await self._repo.create(user)
        logger.info(
            "User created",
            user_id=str(user.id),
            email=email_lower,
            role=role,
            created_by=created_by,
        )
        return user

    async def get_user(self, user_id: str) -> User:
        """Fetch an active user by ID.

        Args:
            user_id: The target user's string ID.

        Returns:
            User: The user.

        Raises:
            NotFoundError: If no active user with that ID exists.
        """
        user = await self._repo.get_active_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def update_user(
        self,
        user_id: str,
        request: UserUpdateRequest,
        current_user: User,
    ) -> User:
        """Update a user's profile fields.

        Args:
            user_id: Target user ID.
            request: Validated update payload.
            current_user: Authenticated user making the request.

        Returns:
            User: Updated user.

        Raises:
            NotFoundError: If user does not exist.
            PermissionDeniedError: If a non-admin tries to update another user.
        """
        if user_id != str(current_user.id) and current_user.role not in (
            Role.ADMIN, Role.SUPER_ADMIN
        ):
            raise PermissionDeniedError("You may only update your own profile.")

        user = await self._repo.get_active_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)

        updates = {k: v for k, v in request.model_dump(exclude_none=True).items()}
        if not updates:
            return user

        await self._repo.update(user_id, updates)
        updated = await self._repo.get_active_by_id(user_id)
        logger.info("User updated", user_id=user_id)
        return updated or user

    async def list_users(
        self,
        offset: int = 0,
        limit: int = 50,
        role: str | None = None,
        department: str | None = None,
    ) -> tuple[list[User], int]:
        """List users with pagination.

        Args:
            offset: Documents to skip.
            limit: Max documents to return.
            role: Optional role filter.
            department: Optional department filter.

        Returns:
            tuple[list[User], int]: Users and total count.
        """
        users = await self._repo.list_active_users(
            offset=offset, limit=limit, role=role, department=department
        )
        total = await self._repo.count_active_users(role=role, department=department)
        return users, total

    async def assign_role(
        self,
        user_id: str,
        new_role: str,
        admin: User,
    ) -> User:
        """Assign a new role to a user (admin-only).

        Args:
            user_id: Target user ID.
            new_role: Role string to assign.
            admin: Admin performing the action.

        Returns:
            User: Updated user.

        Raises:
            PermissionDeniedError: If caller lacks admin privilege.
            NotFoundError: If user does not exist.
        """
        if admin.role not in (Role.ADMIN, Role.SUPER_ADMIN):
            raise PermissionDeniedError("Only administrators can assign roles.")

        user = await self._repo.get_active_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)

        await self._repo.update(user_id, {"role": new_role})
        updated = await self._repo.get_active_by_id(user_id)
        logger.info("Role assigned", user_id=user_id, new_role=new_role, admin_id=str(admin.id))
        return updated or user

    async def deactivate_user(self, user_id: str, admin: User) -> User:
        """Deactivate a user account (admin-only).

        Args:
            user_id: Target user ID.
            admin: Admin performing the action.

        Returns:
            User: Deactivated user.

        Raises:
            PermissionDeniedError: If caller lacks admin privilege.
            NotFoundError: If user does not exist.
        """
        if admin.role not in (Role.ADMIN, Role.SUPER_ADMIN):
            raise PermissionDeniedError("Only administrators can deactivate users.")

        user = await self._repo.get_active_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)

        await self._repo.update(user_id, {"is_active": False})
        updated = await self._repo.get_active_by_id(user_id) or user
        updated.is_active = False
        logger.info("User deactivated", user_id=user_id, admin_id=str(admin.id))
        return updated
