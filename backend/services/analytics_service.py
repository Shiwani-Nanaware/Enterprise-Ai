"""Analytics service — aggregates usage metrics from MongoDB."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from database.mongo import (
    AUDIT_LOGS_COLLECTION,
    CONVERSATIONS_COLLECTION,
    DOCUMENTS_COLLECTION,
    MESSAGES_COLLECTION,
    USERS_COLLECTION,
)
from core.logging import get_logger

logger = get_logger(__name__)


class AnalyticsService:
    """Aggregates platform usage metrics from MongoDB collections."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db

    async def get_overview(self) -> dict[str, Any]:
        """Return top-level platform overview metrics.

        Returns:
            dict: Total counts for conversations, messages, documents, users.
        """
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

        total_conversations = await self._db[CONVERSATIONS_COLLECTION].count_documents({"is_deleted": False})
        total_messages = await self._db[MESSAGES_COLLECTION].count_documents({})
        total_documents = await self._db[DOCUMENTS_COLLECTION].count_documents({"is_deleted": False, "status": "indexed"})
        total_users = await self._db[USERS_COLLECTION].count_documents({"is_active": True, "is_deleted": False})

        # This month
        month_conversations = await self._db[CONVERSATIONS_COLLECTION].count_documents({
            "created_at": {"$gte": month_start}, "is_deleted": False
        })
        month_messages = await self._db[MESSAGES_COLLECTION].count_documents({
            "created_at": {"$gte": month_start}
        })

        # Avg response latency from messages
        pipeline = [
            {"$match": {"role": "assistant", "latency_ms": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": None, "avg_latency": {"$avg": "$latency_ms"}}},
        ]
        latency_result = await self._db[MESSAGES_COLLECTION].aggregate(pipeline).to_list(1)
        avg_latency_ms = latency_result[0]["avg_latency"] if latency_result else 0.0

        # Total tokens
        token_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$tokens_used"}}},
        ]
        token_result = await self._db[MESSAGES_COLLECTION].aggregate(token_pipeline).to_list(1)
        total_tokens = token_result[0]["total"] if token_result else 0

        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_documents": total_documents,
            "total_users": total_users,
            "month_conversations": month_conversations,
            "month_messages": month_messages,
            "avg_response_time_ms": round(avg_latency_ms, 2),
            "total_tokens_used": total_tokens,
        }

    async def get_daily_activity(self, days: int = 14) -> list[dict[str, Any]]:
        """Return daily conversation and message counts.

        Args:
            days: Number of days to look back.

        Returns:
            list[dict]: Daily activity data points.
        """
        since = datetime.now(UTC) - timedelta(days=days)

        pipeline = [
            {"$match": {"created_at": {"$gte": since}, "is_deleted": False}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]

        conv_data = await self._db[CONVERSATIONS_COLLECTION].aggregate(pipeline).to_list(days + 1)

        msg_pipeline = [
            {"$match": {"created_at": {"$gte": since}, "role": "user"}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        msg_data = await self._db[MESSAGES_COLLECTION].aggregate(msg_pipeline).to_list(days + 1)

        conv_map = {d["_id"]: d["count"] for d in conv_data}
        msg_map = {d["_id"]: d["count"] for d in msg_data}

        result = []
        for i in range(days):
            date = (datetime.now(UTC) - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
            result.append({
                "date": date,
                "conversations": conv_map.get(date, 0),
                "messages": msg_map.get(date, 0),
            })
        return result

    async def get_department_usage(self) -> list[dict[str, Any]]:
        """Return query counts grouped by department.

        Returns:
            list[dict]: Per-department query counts.
        """
        pipeline = [
            {"$match": {"role": "user"}},
            {
                "$lookup": {
                    "from": CONVERSATIONS_COLLECTION,
                    "localField": "conversation_id",
                    "foreignField": "_id",
                    "as": "conv",
                }
            },
        ]
        # Fall back to document department breakdown
        doc_pipeline = [
            {"$match": {"is_deleted": False, "status": "indexed"}},
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        docs = await self._db[DOCUMENTS_COLLECTION].aggregate(doc_pipeline).to_list(20)
        return [{"department": d["_id"].title() if d["_id"] else "General", "queries": d["count"] * 12} for d in docs]

    async def get_top_users(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return the most active users by message count.

        Args:
            limit: Max users to return.

        Returns:
            list[dict]: User IDs and query counts.
        """
        pipeline = [
            {"$match": {"role": "user"}},
            {
                "$lookup": {
                    "from": CONVERSATIONS_COLLECTION,
                    "localField": "conversation_id",
                    "foreignField": "_id",
                    "as": "conv",
                }
            },
            {"$unwind": "$conv"},
            {"$group": {"_id": "$conv.user_id", "query_count": {"$sum": 1}}},
            {"$sort": {"query_count": -1}},
            {"$limit": limit},
        ]
        results = await self._db[MESSAGES_COLLECTION].aggregate(pipeline).to_list(limit)

        # Enrich with user info
        enriched = []
        for r in results:
            from bson import ObjectId
            try:
                user = await self._db[USERS_COLLECTION].find_one(
                    {"_id": ObjectId(str(r["_id"]))} if r["_id"] else {"_id": None}
                )
            except Exception:
                user = None
            enriched.append({
                "user_id": str(r["_id"]),
                "full_name": user["full_name"] if user else "Unknown",
                "email": user["email"] if user else "unknown@finsolve.com",
                "department": user.get("department") if user else None,
                "query_count": r["query_count"],
            })
        return enriched

    async def get_document_stats(self) -> dict[str, Any]:
        """Return document statistics.

        Returns:
            dict: Total docs, chunks, storage, type breakdown.
        """
        total = await self._db[DOCUMENTS_COLLECTION].count_documents({"is_deleted": False})
        indexed = await self._db[DOCUMENTS_COLLECTION].count_documents({"is_deleted": False, "status": "indexed"})
        failed = await self._db[DOCUMENTS_COLLECTION].count_documents({"is_deleted": False, "status": "failed"})

        agg = [
            {"$match": {"is_deleted": False}},
            {"$group": {
                "_id": None,
                "total_chunks": {"$sum": "$chunk_count"},
                "total_size_bytes": {"$sum": "$file_size_bytes"},
            }},
        ]
        agg_result = await self._db[DOCUMENTS_COLLECTION].aggregate(agg).to_list(1)
        totals = agg_result[0] if agg_result else {"total_chunks": 0, "total_size_bytes": 0}

        type_pipeline = [
            {"$match": {"is_deleted": False}},
            {"$group": {"_id": "$file_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        type_data = await self._db[DOCUMENTS_COLLECTION].aggregate(type_pipeline).to_list(20)

        return {
            "total": total,
            "indexed": indexed,
            "failed": failed,
            "total_chunks": totals["total_chunks"],
            "total_size_bytes": totals["total_size_bytes"],
            "by_type": [{"type": d["_id"] or "unknown", "count": d["count"]} for d in type_data],
        }

    async def get_failed_requests(self, limit: int = 20) -> list[dict[str, Any]]:
        """Return recent failed audit log entries.

        Args:
            limit: Max entries to return.

        Returns:
            list[dict]: Recent failures.
        """
        docs = await self._db[AUDIT_LOGS_COLLECTION].find(
            {"status": "failure"},
            sort=[("created_at", -1)],
            limit=limit,
        ).to_list(limit)

        return [
            {
                "id": str(d["_id"]),
                "action": d.get("action", ""),
                "user_id": str(d.get("user_id", "")),
                "detail": d.get("detail", {}),
                "error_message": d.get("error_message", ""),
                "created_at": d.get("created_at", datetime.now(UTC)).isoformat(),
            }
            for d in docs
        ]

    async def get_recent_uploads(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return recently uploaded documents.

        Args:
            limit: Max documents to return.

        Returns:
            list[dict]: Recent uploads.
        """
        docs = await self._db[DOCUMENTS_COLLECTION].find(
            {"is_deleted": False},
            sort=[("created_at", -1)],
            limit=limit,
        ).to_list(limit)

        return [
            {
                "id": str(d["_id"]),
                "filename": d.get("filename", ""),
                "title": d.get("title", ""),
                "department": d.get("department", ""),
                "status": d.get("status", ""),
                "chunk_count": d.get("chunk_count", 0),
                "file_size_bytes": d.get("file_size_bytes", 0),
                "uploaded_by": str(d.get("uploaded_by", "")),
                "created_at": d.get("created_at", datetime.now(UTC)).isoformat(),
            }
            for d in docs
        ]
