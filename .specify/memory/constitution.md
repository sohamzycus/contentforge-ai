# ContentForge AI — Project Constitution

> **Version:** 1.0.0
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Status:** Active

---

## 1. Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | ContentForge AI |
| **Type** | Multi-tenant SaaS — AI-powered marketing content generation |
| **Domain** | MarTech / Content Automation |
| **Stage** | MVP → Production hardening |
| **Repository** | `marketing-content-generator-saas` |

### 1.1 Mission Statement

ContentForge AI enables marketing teams and solo operators to generate publish-ready, platform-specific marketing content from a single product brief — powered by LLM orchestration (LangGraph + Claude). The system must be reliable, secure, and extensible enough to evolve from MVP into an enterprise-grade SaaS product.

---

## 2. Architecture Principles

### 2.1 SOLID Principles (Mandatory)

Every module, class, and service MUST adhere to SOLID:

| Principle | Enforcement |
|-----------|-------------|
| **Single Responsibility** | Each module owns exactly one reason to change. API endpoints delegate to services; services delegate to repositories; AI orchestration is isolated in its own service layer. |
| **Open/Closed** | New platforms (e.g., LinkedIn, Pinterest) are added by extending the LangGraph workflow and registering new nodes — never by modifying existing node logic. Configuration is injected, not hardcoded. |
| **Liskov Substitution** | All LLM providers must be interchangeable behind the `ChatAnthropic` / `BaseChatModel` abstraction. Swapping Claude for GPT-4 must not break the workflow. |
| **Interface Segregation** | Schemas expose only what the consumer needs. `ProjectList` is lean (id, name, audience, date); `Project` includes full content. API responses never leak internal model fields. |
| **Dependency Inversion** | High-level business logic (content generation) depends on abstractions (settings, LLM interface), not on concrete implementations. Configuration is injected via `pydantic-settings`; database sessions via FastAPI `Depends()`. |

### 2.2 Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation    │  React + Vite + Tailwind │  ← UI only, no business logic
├─────────────────────────────────────────────┤
│  API Layer       │  FastAPI routers          │  ← Validation, auth, HTTP concerns
├─────────────────────────────────────────────┤
│  Service Layer   │  MarketingAgentService    │  ← Business logic, AI orchestration
├─────────────────────────────────────────────┤
│  Data Layer      │  SQLAlchemy models        │  ← Persistence, migrations
├─────────────────────────────────────────────┤
│  Infrastructure  │  Docker, PostgreSQL, LLM  │  ← External systems
└─────────────────────────────────────────────┘
```

**Rules:**
- Layers may only call the layer directly below them.
- The Presentation layer communicates with the API layer exclusively via HTTP (Axios client).
- The Service layer MUST NOT import from the API layer.
- The Data layer MUST NOT import from the Service or API layers.

### 2.3 Twelve-Factor App Compliance

| Factor | Implementation |
|--------|---------------|
| **I. Codebase** | Single repo, tracked in Git |
| **II. Dependencies** | `requirements.txt` (pinned), `package.json` (semver ranges) |
| **III. Config** | All config via environment variables; `pydantic-settings` for validation; `.env` files never committed |
| **IV. Backing Services** | PostgreSQL, Anthropic API — treated as attached resources, swappable via env vars |
| **V. Build/Release/Run** | Docker multi-stage; `docker-compose build` → `docker-compose up` |
| **VI. Processes** | Stateless backend; session state in JWT tokens; persistent state in PostgreSQL |
| **VII. Port Binding** | Backend self-contained via uvicorn; frontend via Vite dev server / nginx in prod |
| **VIII. Concurrency** | Horizontal scaling via container replicas (future) |
| **IX. Disposability** | Fast startup; graceful shutdown; no in-process state |
| **X. Dev/Prod Parity** | Docker Compose mirrors production topology |
| **XI. Logs** | Stdout/stderr; structured logging (future: JSON format) |
| **XII. Admin Processes** | Alembic migrations; one-off scripts run in same container |

---

## 3. Technology Governance

### 3.1 Technology Stack (Locked)

| Layer | Technology | Version Constraint | Rationale |
|-------|-----------|-------------------|-----------|
| Backend Runtime | Python | 3.11.x | LTS, LangGraph compatibility |
| Backend Framework | FastAPI | 0.115.x | Async-ready, OpenAPI auto-gen, dependency injection |
| ORM | SQLAlchemy | 2.0.x | Modern 2.0-style, type-safe queries |
| Migrations | Alembic | 1.14.x | SQLAlchemy-native, autogenerate support |
| AI Orchestration | LangGraph | 1.0.x | Stateful agent workflows, composable nodes |
| LLM Client | langchain-anthropic | 1.0.x | First-class Claude support, `BaseChatModel` interface |
| Database | PostgreSQL | 15.x | JSONB for content storage, battle-tested |
| Frontend Runtime | Node.js | 20.x LTS | Current LTS |
| Frontend Framework | React | 18.x | Component model, ecosystem maturity |
| Build Tool | Vite | 5.x | Fast HMR, ESM-native |
| CSS | Tailwind CSS | 3.x | Utility-first, design-system friendly |
| Containerization | Docker + Compose | Latest stable | Reproducible environments |

### 3.2 Dependency Policy

- **No new runtime dependencies** without documented justification in the PR description.
- **Pin exact versions** in `requirements.txt` for Python.
- **Use semver ranges** (`^`) in `package.json` for JavaScript.
- **Security**: Run `npm audit` and `pip audit` before each release. No unresolved critical/high vulnerabilities in production.

### 3.3 Technology Boundaries

- **Backend**: Python only. No Node.js/Deno backend services.
- **Frontend**: React only. No Angular/Vue/Svelte.
- **Database**: PostgreSQL only. No MongoDB, Redis (until caching layer is formally specified).
- **AI Provider**: Anthropic Claude via LiteLLM proxy or direct API. Provider-agnostic interface via `BaseChatModel`.

---

## 4. Security Principles

### 4.1 Authentication & Authorization

| Concern | Implementation |
|---------|---------------|
| Authentication | JWT Bearer tokens; `python-jose` for signing/verification |
| Password Storage | bcrypt with auto-generated salt; never store plaintext |
| Token Expiry | Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30) |
| Authorization | Resource-level: users can only access their own projects (`user_id` filter on all queries) |
| API Key Security | `ANTHROPIC_API_KEY` lives exclusively in backend env; never exposed to frontend |

### 4.2 Security Rules

1. **No secrets in code.** All secrets via environment variables. `.env` is `.gitignore`d.
2. **No secrets in logs.** Logging MUST NOT print API keys, passwords, or tokens.
3. **Input validation at the boundary.** Pydantic schemas validate all API input before it reaches business logic.
4. **SQL injection prevention.** SQLAlchemy ORM only; no raw SQL strings with user input.
5. **CORS whitelist.** Only explicitly configured origins are allowed.
6. **Dependency scanning.** No known CVEs in production dependencies.

### 4.3 Sensitive Files (Never Commit)

```
.env
*.pem
*.key
credentials.json
```

---

## 5. Code Quality Standards

### 5.1 Python (Backend)

| Standard | Rule |
|----------|------|
| **Style** | PEP 8 compliant; max line length 120 characters |
| **Type Hints** | Required on all public function signatures |
| **Docstrings** | Required on all public functions and classes; Google-style format |
| **Imports** | Grouped: stdlib → third-party → local; absolute imports only |
| **Error Handling** | Specific exceptions; never bare `except:`; HTTPException for API errors with appropriate status codes |
| **Configuration** | Via `pydantic-settings` `BaseSettings`; no `os.getenv()` in business logic |
| **Models** | SQLAlchemy declarative; one model per file; relationships explicitly defined |
| **Schemas** | Pydantic v2 `BaseModel`; separate Create/Read/List schemas per resource |

### 5.2 JavaScript/React (Frontend)

| Standard | Rule |
|----------|------|
| **Components** | Functional components with hooks; no class components |
| **State** | Local state via `useState`; shared state via context or lifted state |
| **Side Effects** | `useEffect` with proper dependency arrays; cleanup functions for subscriptions |
| **API Calls** | Centralized in `services/api.js`; Axios interceptors for auth and error handling |
| **Styling** | Tailwind utility classes; no inline `style` objects; design tokens in `tailwind.config.js` |
| **Routing** | React Router v6; `ProtectedRoute` wrapper for authenticated pages |
| **Naming** | PascalCase for components; camelCase for functions/variables; kebab-case for CSS classes |

### 5.3 Comments Policy

- **DO NOT** add comments that narrate what the code does (`// increment counter`).
- **DO** add comments that explain *why* — non-obvious intent, trade-offs, constraints, workarounds.
- **DO** add docstrings on public APIs describing parameters, return values, and raised exceptions.

---

## 6. API Design Standards

### 6.1 REST Conventions

| Convention | Rule |
|------------|------|
| **Base Path** | `/api/{resource}` |
| **Naming** | Plural nouns for collections (`/api/projects`); singular for singletons (`/api/auth/me`) |
| **Methods** | `GET` (read), `POST` (create), `PUT` (full update), `PATCH` (partial update), `DELETE` (remove) |
| **Status Codes** | `200` OK, `201` Created, `204` No Content, `400` Bad Request, `401` Unauthorized, `404` Not Found, `422` Validation Error, `500` Internal Server Error |
| **Error Format** | `{"detail": "Human-readable message"}` — consistent across all error responses |
| **Pagination** | `?skip=0&limit=20` for list endpoints (implement when needed) |

### 6.2 API Versioning Strategy

- Current: unversioned (`/api/projects`).
- Future: prefix versioning (`/api/v1/projects`) when breaking changes are introduced.
- Old versions maintained for minimum 2 release cycles after deprecation notice.

### 6.3 Documentation

- OpenAPI/Swagger auto-generated by FastAPI at `/docs`.
- Every endpoint MUST have a docstring that appears in the Swagger UI.

---

## 7. Database Governance

### 7.1 Schema Rules

1. **Every table** has an auto-increment `id` primary key.
2. **Every table** has a `created_at` timestamp with `server_default=func.now()`.
3. **Foreign keys** are explicitly declared with appropriate `ON DELETE` behavior.
4. **JSON columns** (`content`, `unique_selling_points`) are typed as `JSON` (PostgreSQL JSONB).
5. **Indexes** on all foreign keys and frequently queried columns.

### 7.2 Migration Rules

1. **All schema changes** go through Alembic migrations — no manual DDL.
2. **Migrations are forward-only** in production. Downgrades are for development only.
3. **Migration messages** are descriptive: `"Add updated_at to projects"`, not `"update"`.
4. **Data migrations** are separate from schema migrations.
5. **Test migrations** on a fresh database before merging.

### 7.3 Data Integrity

- **No orphaned records.** Cascade deletes configured on parent relationships.
- **No nullable foreign keys** unless explicitly justified.
- **Unique constraints** on natural keys (e.g., `users.email`).

---

## 8. Frontend Architecture

### 8.1 Component Hierarchy

```
App.jsx
├── Navbar                    (global, always visible)
├── LandingPage               (public)
├── LoginPage / RegisterPage  (public, redirect if authenticated)
├── Dashboard                 (protected)
├── NewProject                (protected)
└── ProjectDetail             (protected)
    └── MarkdownContent       (RTE rendering via react-markdown)
```

### 8.2 State Management Rules

1. **Auth state**: Token in `localStorage`; helper functions in `utils/auth.js`.
2. **Page-level state**: `useState` + `useEffect` for data fetching.
3. **No global state library** until the app has 3+ pages sharing non-auth state.
4. **Optimistic UI** is not required at MVP; all mutations wait for server confirmation.

### 8.3 Design System

| Token | Value |
|-------|-------|
| **Brand Primary** | Indigo scale (`brand-50` through `brand-950`) |
| **Surface Colors** | Neutral gray scale (`surface-0` through `surface-300`) |
| **Accent Colors** | Emerald, Amber, Rose, Violet, Cyan |
| **Border Radius** | `rounded-xl` (inputs), `rounded-2xl` (cards) |
| **Shadows** | `shadow-soft`, `shadow-card`, `shadow-elevated`, `shadow-glow` |
| **Font** | Inter (sans), JetBrains Mono (mono) |
| **Animations** | `animate-fade-in`, `animate-slide-up`, `animate-slide-down` |

---

## 9. AI / LLM Integration Governance

### 9.1 LLM Abstraction

- All LLM calls go through `MarketingAgentService`, which wraps `ChatAnthropic` (or any `BaseChatModel`).
- The model name, API key, and base URL are injected via configuration — never hardcoded.
- The LangGraph workflow is the single orchestrator for multi-step content generation.

### 9.2 Prompt Engineering Standards

1. **Prompts are co-located** with the service method that uses them (inside `marketing_agent.py`).
2. **Prompts include explicit constraints**: character limits, format requirements, tone guidance.
3. **Prompts reference state data** via f-string interpolation from the LangGraph state.
4. **No prompt injection vectors**: user input is interpolated into structured prompt templates, not concatenated as raw instructions.

### 9.3 LLM Resilience

- **Timeout**: LLM calls should have a configurable timeout (default: 120s per node).
- **Retry**: Transient failures (429, 500, 503) should be retried with exponential backoff (implement when needed).
- **Fallback**: If the LLM fails, the API returns a clear error message — never a partial/corrupt result.
- **Cost awareness**: Each project generation invokes the LLM 8 times (8 workflow nodes). Monitor usage.

---

## 10. DevOps & Infrastructure

### 10.1 Container Strategy

| Service | Image | Exposed Port | Persistence |
|---------|-------|-------------|-------------|
| `db` | `postgres:15-alpine` | 5433 (host) → 5432 (container) | Named volume: `postgres_data` |
| `backend` | Custom (Python 3.11-slim) | 8002 (host) → 8000 (container) | None (stateless) |
| `frontend` | Custom (Node 20-alpine) | 3001 (host) → 3000 (container) | None (stateless) |

### 10.2 Environment Parity

- Development: `docker-compose up` with hot-reload (uvicorn `--reload`, Vite HMR).
- Staging/Production: Same Docker images; env vars swapped; hot-reload disabled; frontend served via nginx (future).

### 10.3 Health Checks

- Backend: `GET /health` → `{"status": "healthy"}`
- Database: `pg_isready -U postgres` (configured in `docker-compose.yml`)
- Frontend: HTTP 200 on `/` (Vite dev server)

---

## 11. Git & Workflow Governance

### 11.1 Branch Strategy

| Branch | Purpose | Merge Target |
|--------|---------|-------------|
| `main` | Production-ready code | — |
| `develop` | Integration branch | `main` |
| `feature/<name>` | New features | `develop` |
| `fix/<name>` | Bug fixes | `develop` |
| `hotfix/<name>` | Critical production fixes | `main` + `develop` |

### 11.2 Commit Message Format

```
<type>(<scope>): <short description>

<optional body>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `ci`
**Scopes:** `backend`, `frontend`, `infra`, `ai`, `auth`, `projects`, `db`

**Examples:**
- `feat(ai): add LinkedIn content generation node`
- `fix(auth): handle expired JWT token gracefully`
- `refactor(backend): extract repository layer from endpoints`

### 11.3 Pull Request Rules

1. Every PR has a description with **Summary** and **Test Plan** sections.
2. No direct pushes to `main` or `develop`.
3. PRs must pass all CI checks before merge (when CI is configured).
4. Self-review checklist: no secrets, no `console.log` / `print()` debug statements, no TODO without issue reference.

---

## 12. Testing Strategy (Target State)

### 12.1 Testing Pyramid

| Level | Tool | Coverage Target | Status |
|-------|------|----------------|--------|
| **Unit** | pytest | Services, utilities, security | TODO(TESTING): Implement |
| **Integration** | pytest + TestClient | API endpoints with test DB | TODO(TESTING): Implement |
| **E2E** | Playwright or Cypress | Critical user flows | TODO(TESTING): Implement |
| **Frontend Unit** | Vitest + React Testing Library | Components, hooks | TODO(TESTING): Implement |

### 12.2 Test Rules (When Implemented)

1. No PR merges with failing tests.
2. New features require corresponding tests.
3. Bug fixes require a regression test.
4. Test data is isolated — no shared mutable state between tests.
5. LLM calls are mocked in tests — never hit real APIs in CI.

---

## 13. Performance & Scalability Considerations

### 13.1 Current Bottleneck

Content generation is synchronous and takes 60-120 seconds (8 sequential LLM calls). This blocks the API thread.

### 13.2 Future Improvements (Prioritized)

1. **Background task processing**: Move content generation to a background worker (Celery/ARQ) with status polling.
2. **Parallel LLM calls**: After research nodes complete, platform content nodes can run in parallel.
3. **Response caching**: Cache generated content by input hash to avoid redundant LLM calls.
4. **Connection pooling**: SQLAlchemy connection pool tuning for concurrent users.
5. **CDN for frontend**: Serve static assets via CDN in production.

---

## 14. Observability (Target State)

| Concern | Tool | Status |
|---------|------|--------|
| **Logging** | Python `logging` → stdout | Partial (print statements need migration) |
| **Metrics** | Prometheus + FastAPI middleware | TODO(OBSERVABILITY): Implement |
| **Tracing** | OpenTelemetry | TODO(OBSERVABILITY): Implement |
| **Error Tracking** | Sentry | TODO(OBSERVABILITY): Implement |
| **LLM Cost Tracking** | Custom middleware logging token usage | TODO(OBSERVABILITY): Implement |

---

## 15. Decision Log

| ID | Date | Decision | Rationale | Status |
|----|------|----------|-----------|--------|
| D-001 | 2026-03-03 | Use LangGraph for AI orchestration | Stateful workflows, composable nodes, better than raw chain-of-prompts | Active |
| D-002 | 2026-03-03 | PostgreSQL JSONB for content storage | Flexible schema for varied platform content; avoids over-normalization | Active |
| D-003 | 2026-03-03 | JWT for authentication | Stateless, horizontally scalable; no server-side session store needed | Active |
| D-004 | 2026-03-03 | Bind mounts for Docker data persistence | Existing data on host; zero-migration retrofit; directly backupable | Active |
| D-005 | 2026-03-03 | Tailwind CSS for styling | Utility-first; design-system friendly; fast iteration; small bundle | Active |
| D-006 | 2026-03-03 | react-markdown for RTE rendering | Lightweight; GFM support via remark-gfm; no heavy WYSIWYG editor needed | Active |
| D-007 | 2026-03-03 | LiteLLM proxy for Anthropic API | Allows model routing, fallback, and cost tracking without code changes | Active |

---

## Appendix A: File Structure Convention

```
marketing-content-generator-saas/
├── .specify/                    # Spec-driven development artifacts
│   ├── memory/                  # Constitution, decisions
│   ├── plans/                   # Feature plans
│   ├── templates/               # Templates for specs, plans, tasks
│   └── config/                  # Integration configs
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/       # One file per resource (auth.py, projects.py)
│   │   │   └── deps.py          # Shared dependencies (get_current_user)
│   │   ├── core/                # Config, database, security
│   │   ├── models/              # SQLAlchemy models (one per file)
│   │   ├── schemas/             # Pydantic schemas (one per resource)
│   │   ├── services/            # Business logic (marketing_agent.py)
│   │   └── main.py              # FastAPI app factory
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route-level page components
│   │   ├── services/            # API client (api.js)
│   │   └── utils/               # Helpers (auth.js)
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Project** | A unit of work: one product brief → generated marketing content for all platforms |
| **Platform** | A marketing channel: Facebook, Instagram, TikTok, YouTube, Google Ads |
| **USP** | Unique Selling Point — a differentiating product benefit provided by the user |
| **Workflow** | A LangGraph `StateGraph` that orchestrates sequential LLM calls |
| **Node** | A single step in the LangGraph workflow (e.g., `research_audience`, `facebook`) |
| **RTE** | Rich Text Editor / Rich Text Rendering — markdown-to-HTML rendering of AI output |
| **Constitution** | This document — the governing principles for all development decisions |

---

*This constitution governs all specification, planning, and implementation decisions for ContentForge AI. Any deviation requires an explicit Decision Log entry with rationale.*
