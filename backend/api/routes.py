"""API router registration — all versioned API routers."""

from fastapi import APIRouter

from api.v1 import analytics, auth, chat, documents, guardrails, health, settings, users, version

router = APIRouter()

# System
router.include_router(health.router, tags=["System"])
router.include_router(version.router, tags=["System"])

# Authentication
router.include_router(auth.router)

# Users
router.include_router(users.router)

# Documents
router.include_router(documents.router)

# Chat / Conversations
router.include_router(chat.router)

# Analytics
router.include_router(analytics.router)

# Settings
router.include_router(settings.router)

# Guardrails
router.include_router(guardrails.router)
