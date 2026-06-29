"""User repository — MongoDB implementation."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from database.mongo import USERS_COLLECTION
from models.user import User
from repositories.base import MongoRepository


class UserRepository(MongoRepository[User]):
    """Repository for User documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, USERS_COLLECTION)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_by_id(self, user_id: str) -> User | None:
        """Fetch a user by their string ID.

        Args:
            user_id: String ObjectId.

        Returns:
            User | None: The user or None.
        """
        try:
            oid = self._to_object_id(user_id)
        except ValueError:
            return None
        doc = await self._find_one({"_id": oid})
        return User.from_dict(doc) if doc else None

    async def get_active_by_id(self, user_id: str) -> User | None:
        """Fetch an active, non-deleted user by ID.

        Args:
            user_id: String ObjectId.

        Returns:
            User | None: Active user or None.
        """
        try:
            oid = self._to_object_id(user_id)
        except ValueError:
            return None
        doc = await self._find_one(
            {"_id": oid, "is_active": True, "is_deleted": False}
        )
        return User.from_dict(doc) if doc else None

    async def get_by_email(self, email: str) -> User | None:
        """Fetch an active user by email address.

        Args:
            email: Email string (lowercased).

        Returns:
            User | None: Matching user or None.
        """
        doc = await self._find_one(
            {"email": email.lower(), "is_deleted": False}
        )
        return User.from_dict(doc) if doc else None

    async def email_exists(self, email: str) -> bool:
        """Check whether an email is already registered.

        Args:
            email: Email to check.

        Returns:
            bool: True if taken.
        """
        return await self._count({"email": email.lower(), "is_deleted": False}) > 0

    async def list_active_users(
        self,
        offset: int = 0,
        limit: int = 50,
        role: str | None = None,
        department: str | None = None,
    ) -> list[User]:
        """List active users with optional filters.

        Args:
            offset: Documents to skip.
            limit: Max documents to return.
            role: Optional role filter.
            department: Optional department filter.

        Returns:
            list[User]: Matching users.
        """
        query: dict[str, Any] = {"is_deleted": False, "is_active": True}
        if role:
            query["role"] = role
        if department:
            query["department"] = department
        docs = await self._find_many(
            query,
            sort=[("created_at", -1)],
            skip=offset,
            limit=limit,
        )
        return [User.from_dict(d) for d in docs]

    async def count_active_users(
        self,
        role: str | None = None,
        department: str | None = None,
    ) -> int:
        """Count active users with optional filters.

        Args:
            role: Optional role filter.
            department: Optional department filter.

        Returns:
            int: Count.
        """
        query: dict[str, Any] = {"is_deleted": False, "is_active": True}
        if role:
            query["role"] = role
        if department:
            query["department"] = department
        return await self._count(query)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def create(self, user: User) -> User:
        """Insert a new user document.

        Args:
            user: User dataclass (id will be set after insert).

        Returns:
            User: User with id populated.
        """
        doc = user.to_dict()
        new_id = await self._insert(doc)
        user.id = new_id
        return user

    async def update(self, user_id: str, updates: dict[str, Any]) -> bool:
        """Apply field updates to a user.

        Args:
            user_id: String ObjectId.
            updates: Fields to update.

        Returns:
            bool: True if modified.
        """
        updates["updated_at"] = datetime.now(UTC)
        try:
            oid = self._to_object_id(user_id)
        except ValueError:
            return False
        return await self._update_one(
            {"_id": oid},
            {"$set": updates},
        )

    async def update_refresh_token(
        self, user_id: str, token_hash: str | None
    ) -> None:
        """Update or clear the stored refresh token hash.

        Args:
            user_id: String ObjectId.
            token_hash: New hash or None to invalidate.
        """
        try:
            oid = self._to_object_id(user_id)
        except ValueError:
            return
        await self._update_one(
            {"_id": oid},
            {"$set": {"refresh_token_hash": token_hash, "updated_at": datetime.now(UTC)}},
        )

    async def soft_delete(self, user_id: str, deleted_by: str) -> bool:
        """Soft-delete a user account.

        Args:
            user_id: String ObjectId.
            deleted_by: Who is deleting.

        Returns:
            bool: True if modified.
        """
        try:
            oid = self._to_object_id(user_id)
        except ValueError:
            return False
        return await self._update_one(
            {"_id": oid},
            {
                "$set": {
                    "is_deleted": True,
                    "is_active": False,
                    "deleted_at": datetime.now(UTC),
                    "deleted_by": deleted_by,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
