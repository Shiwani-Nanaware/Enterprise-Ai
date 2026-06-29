# Enterprise AI Knowledge Assistant


---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  (Vite + TypeScript + Tailwind + Zustand + React Query)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend (Python 3.13)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │   Chat   │  │   Docs   │  │  Analytics   │   │
│  │  (JWT)   │  │  (RAG)   │  │  (RAG)   │  │   Settings   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────────┘   │
│       │             │             │                             │
│  ┌────▼─────────────▼─────────────▼──────────────────────────┐ │
│  │  Guardrails Engine (PII masking, prompt injection, scope)  │ │
│  └─────────────────────────────────────────────────────────── ┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────── ┐ │
│  │              RAG Pipeline                                   │ │
│  │  HuggingFace Embeddings (BAAI/bge-small-en-v1.5, local)    │ │
│  │  ChromaDB (persistent, departmnt-filtered retrieval)        │ │
│  │  Groq LLM (llama3-70b-8192)                                 │ │
│  └──────────────────────────────────────────────────────────── ┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
  MongoDB Atlas      ChromaDB           Local FS
  (users, docs,    (vector store,    (document files,
  conversations,   dept-filtered)     ./storage/)
  audit logs)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State | Zustand, TanStack Query |
| Backend | Python 3.13, FastAPI 0.135, Uvicorn |
| Database | MongoDB Atlas (Motor async driver) |
| Vector Store | ChromaDB 1.5 (persistent, local) |
| Embeddings | BAAI/bge-small-en-v1.5 (sentence-transformers, local, free) |
| LLM | Groq (llama3-70b-8192) — free tier available |
| Auth | JWT (python-jose) + Passlib bcrypt |
| Charts | Recharts |
| Icons | Lucide React |

---

## Folder Structure

```
Enterprise-Ai/
├── backend/
│   ├── api/v1/           # REST endpoints (auth, chat, docs, analytics, settings, guardrails)
│   ├── auth/             # JWT, RBAC, departments, password hashing
│   ├── core/             # Config, exceptions, logging, dependencies, app factory
│   ├── database/         # MongoDB Motor client, indexes
│   ├── guardrails/       # Input/output safety engine (PII, injection, scope)
│   ├── middleware/        # Rate limiting, request ID, timing, exception handler
│   ├── models/           # Python dataclasses (User, Document, Conversation, etc.)
│   ├── rag/              # Embeddings (HuggingFace), ChromaDB client, RAG pipeline
│   ├── repositories/     # MongoDB data access layer
│   ├── schemas/          # Pydantic v2 request/response schemas
│   ├── services/         # Business logic (auth, chat, documents, analytics, settings)
│   └── scripts/          # seed_db.py
├── frontend/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── layouts/      # Dashboard and auth layouts
│       ├── pages/        # All application pages
│       ├── services/     # API service layer (axios)
│       ├── store/        # Zustand stores (auth, chat, UI, notifications)
│       └── types/        # TypeScript type definitions
├── docker/               # Nginx and MongoDB Docker configs
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Features

- **JWT Authentication** — login, refresh tokens, logout, password change
- **Enterprise RBAC** — 7 roles: admin, CEO, finance, marketing, HR, engineering, employee
- **Department-based access** — documents are filtered by department before reaching the LLM
- **Document Management** — drag-drop upload, PDF/DOCX/TXT/CSV/MD support, ChromaDB ingestion
- **RAG Pipeline** — HuggingFace local embeddings + Groq LLM + ChromaDB similarity search
- **Guardrails** — prompt injection, jailbreak, PII masking, SQL injection, XSS, scope enforcement
- **Conversation Memory** — full chat history, rename, delete, continuation
- **Source Citations** — every answer cites source documents with similarity scores
- **Analytics Dashboard** — real-time MongoDB aggregations (users, documents, queries, latency)
- **Settings** — per-user settings persisted to MongoDB (LLM model, RAG params, notifications)
- **Rate Limiting** — sliding-window in-memory rate limiter (60 req/min default)
- **Audit Logs** — immutable append-only audit trail for all significant actions
- **Cost-free** — runs entirely for free (Groq free tier + local HuggingFace embeddings)

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd Enterprise-Ai
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `OPENAI_API_KEY` — your Groq API key
- `JWT_SECRET_KEY` — any strong random string (32+ chars)

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

> The HuggingFace embedding model (`BAAI/bge-small-en-v1.5`, ~33 MB) downloads automatically on first startup and is cached in `~/.cache/huggingface/`.

### 3. Seed demo users

```bash
cd backend
python scripts/seed_db.py
```

### 4. Start the backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## Demo Accounts

All accounts use password: `Password123!`

| Email | Role | Department Access |
|---|---|---|
| admin@finsolve.com | Admin | All departments |
| ceo@finsolve.com | CEO | All departments |
| finance@finsolve.com | Finance | Finance + General |
| hr@finsolve.com | HR | HR + General |
| marketing@finsolve.com | Marketing | Marketing + General |
| engineering@finsolve.com | Engineering | Engineering + General |
| employee@finsolve.com | Employee | General only |

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/
DATABASE_NAME=finsolve_ai

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Groq (LLM)
OPENAI_API_KEY=gsk_your_groq_key
OPENAI_API_BASE=https://api.groq.com/openai/v1
OPENAI_CHAT_MODEL=llama3-70b-8192

# HuggingFace Embeddings (local, no key needed)
EMBEDDING_PROVIDER=huggingface
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# ChromaDB
CHROMA_DB_PATH=./chroma_db
CHROMA_COLLECTION_NAME=enterprise_knowledge
```

---

## MongoDB Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Create a database user with read/write access
3. Whitelist your IP address (or 0.0.0.0/0 for development)
4. Get the connection string: Clusters → Connect → Drivers → Python
5. Paste into `.env` as `MONGODB_URI`

---

## Groq Setup

1. Go to [console.groq.com](https://console.groq.com) → Create account (free)
2. Generate an API key
3. Paste into `.env` as `OPENAI_API_KEY`
4. The free tier supports `llama3-70b-8192` with generous rate limits

---

## Running Locally (Docker)

```bash
docker-compose up -d
```

Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- MongoDB: localhost:27017

---

## Deployment

### Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from `.env`

### Frontend — Vercel

1. Import project on [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Framework: Vite
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`

---

## Future Improvements

- [ ] LangSmith tracing integration
- [ ] RAGAS evaluation pipeline
- [ ] Real-time streaming responses (SSE)
- [ ] Multi-tenant support
- [ ] SAML/SSO authentication
- [ ] Document versioning
- [ ] Background job queue (Celery/Redis)
- [ ] Kubernetes deployment manifests
- [ ] OpenTelemetry metrics

---

## Resume Highlights

Built a **production-ready Enterprise RAG platform** featuring:

- **Full-stack TypeScript + Python** — React 19 frontend + FastAPI async backend
- **MongoDB Atlas** — Motor async driver, compound indexes, aggregation pipelines
- **ChromaDB** — persistent vector store with RBAC metadata pre-filtering
- **HuggingFace Embeddings** — local BAAI/bge-small-en-v1.5 (no API cost)
- **Groq LLM Integration** — llama3-70b-8192 via OpenAI-compatible API
- **Enterprise Security** — JWT + RBAC, guardrails engine (PII masking, injection detection), rate limiting, audit logs
- **Clean Architecture** — Repository pattern, Service layer, Dependency Injection, Pydantic v2
- **Zero-cost AI pipeline** — free embeddings + Groq free tier = $0/month to run

