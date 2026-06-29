#!/usr/bin/env bash
# Run Alembic database migrations
set -euo pipefail

cd "$(dirname "$0")/../backend"
source .venv/bin/activate 2>/dev/null || . .venv/Scripts/activate 2>/dev/null || true

echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete."
