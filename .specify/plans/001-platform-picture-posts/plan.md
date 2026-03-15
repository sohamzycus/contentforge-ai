# Technical Implementation Plan: Platform Picture Posts

> **Constitution Version:** 1.0.0
> **Feature Number:** 001
> **Date:** 2026-03-03
> **Status:** Approved

---

## Feature Summary

**Goal:** Generate ready-to-download, platform-specific picture posts (Instagram 1080x1080, Facebook 1200x630) combining AI-generated background images with overlaid marketing copy, brand elements, and optional user logos.

**User Story:** As a marketing manager, I want ContentForge to produce complete visual posts for Instagram and Facebook so that I can publish directly without manual image editing.

**Constitution Alignment:**
- [x] Adheres to SOLID principles (Section 2.1) — new `ImageGenerationService` and `PicturePostCompositor` are single-responsibility; `MarketingAgentService` extended via Open/Closed (new nodes, no modification to existing)
- [x] Respects layered architecture (Section 2.2) — services don't import from API; new endpoints delegate to services
- [x] New dependencies justified (Section 3.2) — Pillow (image compositing, MIT), requests (Ollama HTTP, already transitive)
- [x] Security rules followed (Section 4) — no secrets in code; logo upload validated; brand settings scoped to user

---

## Technical Context

### Current State

- `MarketingAgentService` runs a LangGraph workflow with 8 sequential nodes (research → platforms → image_prompt).
- Content stored as JSON in `projects.content` column.
- No image generation capability. Only a text-based image prompt is generated.
- No per-user settings beyond auth credentials.

### Proposed Change

1. **New service: `ImageGenerationService`** — calls Ollama's `/api/generate` to produce background images from prompts.
2. **New service: `PicturePostCompositor`** — uses Pillow to composite background + gradient overlay + headline/tagline/CTA + optional logo into final platform-sized images.
3. **Extended LangGraph workflow** — two new nodes (`generate_overlay_copy`, `generate_picture_posts`) appended after `image_prompt`.
4. **New `brand_settings` table** — stores per-user logo, position, and brand color.
5. **New API endpoints** — CRUD for brand settings (`/api/brand-settings`).
6. **Frontend updates** — picture post preview/download in ProjectDetail; new BrandSettings page; updated Navbar.

### Affected Layers

- [x] Presentation (Frontend) — ProjectDetail picture post view, BrandSettings page, Navbar link
- [x] API Layer (FastAPI routers) — new `brand_settings.py` router; modified project creation flow
- [x] Service Layer (Business logic) — `ImageGenerationService`, `PicturePostCompositor`, extended `MarketingAgentService`
- [x] Data Layer (Models, migrations) — new `BrandSettings` model; Alembic migration
- [x] Infrastructure (Docker, config) — new env vars (`OLLAMA_BASE_URL`, `OLLAMA_IMAGE_MODEL`), new Python deps

---

## Design Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| Image generation provider | DALL-E, Stability AI, Ollama | **Ollama (local)** | Free, self-hosted, user already has Ollama; no API costs; macOS Metal GPU |
| Ollama model | z-image-turbo, flux2-klein | **z-image-turbo (default)** | Apache 2.0, photorealistic quality, 6B params; configurable via env var |
| Image storage | File system, base64 in DB | **Base64 in content JSON** | Simpler architecture; no file serving; acceptable for MVP scale (~3 MB/project) |
| Overlay compositing | HTML/CSS screenshot, Pillow, Cairo | **Pillow** | Python-native, well-established, MIT license, sufficient for text+gradient+logo |
| Font for overlay | System fonts, Google Fonts download | **Bundled Inter TTF** | Matches frontend design system; no runtime download; deterministic rendering |
| Ollama connectivity | Docker service, external | **External (host)** | Image gen requires macOS Metal GPU; Docker Linux VM can't access it |
| Brand settings scope | Per-project, per-user | **Per-user** | Simpler; brand identity is consistent across projects; can scope per-project later |
| Overlay copy generation | Reuse existing captions, new LLM call | **New LLM node** | Captions are too long for image overlay; need dedicated 5-10 word headline |

---

## Implementation Steps

### Phase 1: Backend Infrastructure (Services + Config)

1. [ ] Add `Pillow==11.1.0` and `requests` (if not already) to `requirements.txt`
2. [ ] Add `OLLAMA_BASE_URL`, `OLLAMA_IMAGE_MODEL`, `OLLAMA_TIMEOUT` to `config.py` Settings
3. [ ] Add env vars to `docker-compose.yml` backend service
4. [ ] Bundle `Inter-Bold.ttf` and `Inter-Regular.ttf` in `backend/app/assets/fonts/`
5. [ ] Create `backend/app/services/image_generation.py` — `ImageGenerationService` class
6. [ ] Create `backend/app/services/image_compositor.py` — `PicturePostCompositor` class

### Phase 2: LangGraph Workflow Extension

7. [ ] Add `overlay_copy` fields to `ProductMarketingState` TypedDict
8. [ ] Add `picture_posts` fields to `ProductMarketingState` TypedDict
9. [ ] Create `_generate_overlay_copy` node — LLM generates headline, tagline, CTA
10. [ ] Create `_generate_picture_posts` node — calls ImageGenerationService + PicturePostCompositor
11. [ ] Register new nodes in workflow; wire edges: `image_prompt` → `overlay_copy` → `picture_posts` → END
12. [ ] Handle Ollama failures gracefully (try/except, set `picture_posts` to None)

### Phase 3: Brand Settings (Data + API)

13. [ ] Create `backend/app/models/brand_settings.py` — SQLAlchemy model
14. [ ] Create `backend/app/schemas/brand_settings.py` — Pydantic schemas
15. [ ] Create Alembic migration: `"Add brand_settings table"`
16. [ ] Create `backend/app/api/endpoints/brand_settings.py` — CRUD router
17. [ ] Register router in `main.py`: `/api/brand-settings`
18. [ ] Pass brand settings to `MarketingAgentService` during project creation

### Phase 4: Frontend — Picture Post Display

19. [ ] Update `ProjectDetail.jsx` — add "Text" / "Picture Post" toggle for Instagram and Facebook tabs
20. [ ] Create `PicturePostPreview` component — renders base64 image, dimensions label, download button
21. [ ] Implement client-side base64-to-PNG download logic
22. [ ] Handle backward compatibility — hide picture post toggle if data is null
23. [ ] Handle image load errors — fallback message

### Phase 5: Frontend — Brand Settings Page

24. [ ] Create `BrandSettings.jsx` page — logo upload, position selector, color picker
25. [ ] Add brand settings API functions to `services/api.js`
26. [ ] Add route `/brand-settings` in `App.jsx` (protected)
27. [ ] Add "Brand Settings" link to `Navbar.jsx`
28. [ ] Implement logo upload with drag-and-drop, preview, remove
29. [ ] Implement 4-corner position selector (visual 2x2 grid)
30. [ ] Implement color picker with hex input

### Phase 6: Integration & Polish

31. [ ] Update `.env.example` with new Ollama env vars
32. [ ] Rebuild Docker images and test end-to-end
33. [ ] Test graceful degradation (Ollama down)
34. [ ] Test backward compatibility (old projects)
35. [ ] Test brand settings flow (upload, position, color, save, generate)

---

## New File Inventory

| File | Layer | Purpose |
|------|-------|---------|
| `backend/app/services/image_generation.py` | Service | Ollama HTTP client for image generation |
| `backend/app/services/image_compositor.py` | Service | Pillow-based image compositing (overlay, logo, resize) |
| `backend/app/models/brand_settings.py` | Data | SQLAlchemy model for brand settings |
| `backend/app/schemas/brand_settings.py` | Data | Pydantic schemas for brand settings API |
| `backend/app/api/endpoints/brand_settings.py` | API | CRUD endpoints for brand settings |
| `backend/app/assets/fonts/Inter-Bold.ttf` | Asset | Font for overlay headline |
| `backend/app/assets/fonts/Inter-Regular.ttf` | Asset | Font for overlay tagline/CTA |
| `backend/alembic/versions/002_add_brand_settings.py` | Migration | Creates brand_settings table |
| `frontend/src/pages/BrandSettings.jsx` | Presentation | Brand settings page |
| `frontend/src/components/PicturePostPreview.jsx` | Presentation | Picture post image preview + download |

---

## Migration / Data Impact

**New table:** `brand_settings` (created via Alembic migration).

**No changes to existing tables.** The `projects.content` JSON column absorbs new `picture_posts` data at the application level. Existing projects with no `picture_posts` key are handled gracefully (null check in frontend).

**Migration command:**

```bash
docker-compose exec backend alembic upgrade head
```

**Rollback:** `alembic downgrade -1` drops the `brand_settings` table. Picture post data in existing projects' content JSON is harmless if the feature is removed.

---

## Testing Plan

| Test Type | What to Test | Status |
|-----------|-------------|--------|
| Unit | `PicturePostCompositor` — overlay layout, text truncation, logo positioning | TODO |
| Unit | `ImageGenerationService` — Ollama call, timeout, error handling | TODO |
| Unit | Brand settings schemas — validation (color format, position enum, logo size) | TODO |
| Integration | `POST /api/projects` — verify `picture_posts` in response when Ollama is up | TODO |
| Integration | `POST /api/projects` — verify graceful degradation when Ollama is down | TODO |
| Integration | Brand settings CRUD — create, read, update, delete logo | TODO |
| Manual | End-to-end: create project → view picture post → download | TODO |
| Manual | Brand settings: upload logo → create project → verify logo on image | TODO |
| Manual | Backward compatibility: view old project → no broken UI | TODO |

---

## Rollback Plan

1. **Revert code** to pre-feature commit.
2. **Downgrade migration:** `alembic downgrade -1` (drops `brand_settings` table).
3. **Existing projects** are unaffected — `picture_posts` key in content JSON is simply ignored by the old frontend.
4. **No data loss** — text content, research, and platform content are untouched.
5. **Remove env vars** (`OLLAMA_*`) from `.env` and `docker-compose.yml`.
6. **Remove `Pillow`** from `requirements.txt` and rebuild.

---

## Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   Ollama (Host)  │
                                    │  z-image-turbo   │
                                    └────────▲────────┘
                                             │ HTTP (11434)
┌──────────────┐    HTTP     ┌───────────────┴──────────────────┐
│   Frontend   │ ◄─────────► │           Backend (Docker)       │
│  (React)     │   (8002)    │                                  │
│              │             │  ┌─────────────────────────────┐ │
│ ProjectDetail│             │  │   MarketingAgentService      │ │
│  └─PicturePost             │  │   (LangGraph Workflow)       │ │
│    Preview   │             │  │                              │ │
│              │             │  │  research → competitors →    │ │
│ BrandSettings│             │  │  fb → ig → tiktok → yt →    │ │
│  └─LogoUpload│             │  │  google_ads → image_prompt → │ │
│  └─Position  │             │  │  overlay_copy → picture_posts│ │ ← NEW NODES
│  └─ColorPick │             │  │       │              │       │ │
└──────────────┘             │  │       ▼              ▼       │ │
                             │  │  ChatAnthropic  ImageGenSvc  │ │
                             │  │  (Claude)       (Ollama)     │ │
                             │  │                     │        │ │
                             │  │              PicturePost     │ │
                             │  │              Compositor      │ │
                             │  │              (Pillow)        │ │
                             │  └─────────────────────────────┘ │
                             │                                  │
                             │  ┌──────────┐  ┌──────────────┐ │
                             │  │ projects │  │brand_settings│ │
                             │  │ (content │  │ (logo, color │ │
                             │  │  JSON)   │  │  position)   │ │
                             │  └──────────┘  └──────────────┘ │
                             │         PostgreSQL               │
                             └──────────────────────────────────┘
```
