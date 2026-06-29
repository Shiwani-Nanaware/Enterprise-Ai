"""Database seed script — MongoDB edition.

Creates initial demo users for all enterprise roles.
Run: python scripts/seed_db.py

Each user follows:
    email: <role>@finsolve.com
    password: Password123!
"""

import asyncio
import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from auth.password import hash_password
from core.logging import configure_logging, get_logger
from database.mongo import get_database, ensure_indexes, USERS_COLLECTION

configure_logging()
logger = get_logger(__name__)

SEED_USERS = [
    {
        "email": "admin@finsolve.com",
        "full_name": "System Admin",
        "role": "admin",
        "department": None,
        "job_title": "System Administrator",
        "is_verified": True,
    },
    {
        "email": "ceo@finsolve.com",
        "full_name": "Sarah Chen",
        "role": "ceo",
        "department": None,
        "job_title": "Chief Executive Officer",
        "is_verified": True,
    },
    {
        "email": "finance@finsolve.com",
        "full_name": "Michael Torres",
        "role": "finance",
        "department": "finance",
        "job_title": "Finance Manager",
        "is_verified": True,
    },
    {
        "email": "marketing@finsolve.com",
        "full_name": "Emma Wilson",
        "role": "marketing",
        "department": "marketing",
        "job_title": "Marketing Lead",
        "is_verified": True,
    },
    {
        "email": "hr@finsolve.com",
        "full_name": "David Kim",
        "role": "hr",
        "department": "hr",
        "job_title": "HR Director",
        "is_verified": True,
    },
    {
        "email": "engineering@finsolve.com",
        "full_name": "Priya Patel",
        "role": "engineering",
        "department": "engineering",
        "job_title": "Engineering Lead",
        "is_verified": True,
    },
    {
        "email": "employee@finsolve.com",
        "full_name": "Alex Johnson",
        "role": "employee",
        "department": None,
        "job_title": "General Employee",
        "is_verified": True,
    },
]

DEFAULT_PASSWORD = "Password123!"


async def seed() -> None:
    """Insert seed users if they do not already exist."""
    from datetime import UTC, datetime

    await ensure_indexes()

    db = get_database()
    collection = db[USERS_COLLECTION]
    hashed = hash_password(DEFAULT_PASSWORD)
    created = 0

    for user_data in SEED_USERS:
        existing = await collection.find_one({"email": user_data["email"]})
        if existing:
            logger.info("User already exists, skipping", email=user_data["email"])
            continue

        doc = {
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "hashed_password": hashed,
            "role": user_data["role"],
            "department": user_data.get("department"),
            "job_title": user_data.get("job_title"),
            "is_active": True,
            "is_verified": user_data.get("is_verified", False),
            "avatar_url": None,
            "refresh_token_hash": None,
            "is_deleted": False,
            "deleted_at": None,
            "deleted_by": None,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        await collection.insert_one(doc)
        logger.info("Created seed user", email=user_data["email"], role=user_data["role"])
        created += 1

    print(f"\n✅ Seeded {created} new user(s) (skipped {len(SEED_USERS) - created} existing)")
    print(f"   Default password: {DEFAULT_PASSWORD}")
    print("   Users:")
    for u in SEED_USERS:
        print(f"     {u['email']}  —  role: {u['role']}")


if __name__ == "__main__":
    asyncio.run(seed())
