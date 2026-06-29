"""User settings service — persists user preferences in MongoDB."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.logging import get_logger

logger = get_logger(__name__)

SETTINGS_COLLECTION = "user_settings"

_DEFAULT_SETTINGS: dict[str, Any] = {
    "theme": "system",
    "language": "en",
    "llm_model": "llama3-70b-8192",
    "llm_temperature": 0.1,
    "llm_top_p": 0.9,
    "embedding_model": "BAAI/bge-small-en-v1.5",
    "chunk_size": 600,
    "chunk_overlap": 100,
    "top_k": 5,
    "similarity_threshold": 0.7,
    "notifications_email": True,
    "notifications_in_app": True,
    "guardrails_enabled": True,
    "pii_masking_enabled": True,
}


class SettingsService:
    """Manages per-user application settings stored in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._col = db[SETTINGS_COLLECTION]

    async def get_settings(self, user_id: str) -> dict[str, Any]:
        """Return a user's settings, falling back to defaults.

        Args:
            user_id: The user's string ID.

        Returns:
            dict: Merged settings dict (user overrides + defaults).
        """
        doc = await self._col.find_one({"user_id": user_id})
        if not doc:
            return dict(_DEFAULT_SETTINGS)

        merged = dict(_DEFAULT_SETTINGS)
        merged.update({k: v for k, v in doc.items() if k not in ("_id", "user_id", "updated_at")})
        return merged

    async def update_settings(
        self, user_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """Upsert a user's settings.

        Args:
            user_id: The user's string ID.
            updates: Partial settings dict to merge.

        Returns:
            dict: Updated settings.
        """
        # Validate allowed keys
        allowed = set(_DEFAULT_SETTINGS.keys())
        filtered = {k: v for k, v in updates.items() if k in allowed}

        await self._col.update_one(
            {"user_id": user_id},
            {
                "$set": {**filtered, "updated_at": datetime.now(UTC)},
                "$setOnInsert": {"user_id": user_id, "created_at": datetime.now(UTC)},
            },
            upsert=True,
        )

        logger.info("User settings updated", user_id=user_id, keys=list(filtered.keys()))
        return await self.get_settings(user_id)

    async def reset_settings(self, user_id: str) -> dict[str, Any]:
        """Reset a user's settings to defaults.

        Args:
            user_id: The user's string ID.

        Returns:
            dict: Default settings.
        """
        await self._col.delete_one({"user_id": user_id})
        logger.info("User settings reset", user_id=user_id)
        return dict(_DEFAULT_SETTINGS)

    @staticmethod
    def get_defaults() -> dict[str, Any]:
        """Return the default settings dict.

        Returns:
            dict: Default settings.
        """
        return dict(_DEFAULT_SETTINGS)
