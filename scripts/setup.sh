#!/usr/bin/env bash
# =============================================================================
# Enterprise AI Knowledge Assistant — Development Setup Script
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Enterprise AI Knowledge Assistant — Dev Setup      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || error "Node.js is required but not installed."
command -v python3 >/dev/null 2>&1 || error "Python 3.11+ is required but not installed."
command -v docker >/dev/null 2>&1 || warn "Docker not found. Docker services will not be started."

info "Setting up environment files..."
[ -f .env ] || cp .env.example .env && success "Created .env from .env.example"
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env && success "Created frontend/.env"

info "Installing frontend dependencies..."
cd frontend
npm install
success "Frontend dependencies installed"
cd ..

info "Setting up Python virtual environment..."
cd backend
python3 -m venv .venv
source .venv/bin/activate 2>/dev/null || . .venv/Scripts/activate 2>/dev/null || true
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
success "Backend dependencies installed"
cd ..

echo ""
success "Setup complete! 🚀"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys and credentials"
echo "  2. Start infrastructure: docker-compose up -d postgres redis qdrant"
echo "  3. Run backend:  cd backend && uvicorn main:app --reload"
echo "  4. Run frontend: cd frontend && npm run dev"
echo ""
