# Research: Platform Picture Posts (001)

> **Date:** 2026-03-03
> **Status:** Complete

---

## R-01: Ollama Image Generation API

### Findings

Ollama released experimental image generation support in **January 2026** (macOS only; Windows/Linux coming soon).

**Available models:**

| Model | Params | Size | License | Best For |
|-------|--------|------|---------|----------|
| `x/z-image-turbo` | 6B | 13 GB (fp8) | Apache 2.0 | Photorealistic images, bilingual text rendering |
| `x/flux2-klein` | 4B / 9B | 5.7 GB / 12 GB | Apache 2.0 (4B) / Non-Commercial (9B) | Text in images, UI mockups, product photography |

**API endpoint:** `POST http://localhost:11434/api/generate`

```python
import requests

response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "x/z-image-turbo",
        "prompt": "Product photography of a smart water bottle...",
        "options": {
            "size": "1024x1024"
        }
    }
)
# response.content is raw PNG bytes
with open("output.png", "wb") as f:
    f.write(response.content)
```

**Key constraints:**
- macOS only (as of Jan 2026). The user runs macOS — confirmed compatible.
- The Ollama server must be running locally or accessible via network.
- Image dimensions are set via `options.size` parameter.
- Response is raw image bytes (not JSON), so we write directly to bytes and base64-encode.

### Decision

Use `x/z-image-turbo` as the default model (Apache 2.0, photorealistic quality). Make the model configurable via `OLLAMA_IMAGE_MODEL` env var so users can switch to `x/flux2-klein` if preferred.

**Recommended model:** `x/z-image-turbo` (default)

---

## R-02: Pillow Image Compositing Capabilities

### Findings

Pillow (PIL Fork) is the standard Python imaging library. Current version: **11.1.0**.

**Capabilities needed:**

| Capability | Pillow API | Notes |
|------------|-----------|-------|
| Open/create images | `Image.open()`, `Image.new()` | Supports PNG, JPEG |
| Resize to exact dimensions | `Image.resize((w, h))` | Use `LANCZOS` for quality |
| Text overlay | `ImageDraw.text()` | Requires font file |
| Font rendering | `ImageFont.truetype()` | Bundle Inter font (matches frontend) |
| Semi-transparent overlay | `Image.alpha_composite()` | Create RGBA gradient bar |
| Logo compositing | `Image.paste(logo, position, mask)` | Alpha-aware paste |
| PNG export | `image.save(buffer, format="PNG")` | Write to BytesIO for base64 |
| Base64 encoding | `base64.b64encode(buffer.getvalue())` | stdlib, no extra dep |

**Font strategy:** Bundle `Inter-Bold.ttf` and `Inter-Regular.ttf` in `backend/app/assets/fonts/`. These match the frontend design system (Constitution Section 8.3).

### Decision

Add `Pillow==11.1.0` to `requirements.txt`. Bundle Inter font files in the backend. No additional dependencies needed.

---

## R-03: Base64 Storage Sizing

### Findings

Base64 encoding increases data size by ~33%.

| Image | Raw PNG (est.) | Base64 | Both platforms |
|-------|---------------|--------|---------------|
| Instagram 1080x1080 | ~1.5 MB | ~2.0 MB | — |
| Facebook 1200x630 | ~1.0 MB | ~1.3 MB | — |
| **Total per project** | ~2.5 MB | ~3.3 MB | ~3.3 MB added to content JSON |

**PostgreSQL JSONB limit:** Effectively unlimited (1 GB per field). 3.3 MB is well within bounds.

**API response size:** Current project response is ~10-50 KB (text only). With picture posts: ~3.4 MB. Well under the 15 MB NFR-05 limit.

**Optimization:** For the project list endpoint (`GET /api/projects`), the `ProjectList` schema already excludes the `content` field, so list responses are unaffected.

### Decision

Base64 in content JSON is viable for MVP. No schema changes needed — the existing `content` JSON column absorbs the new data. Add a `ProjectListResponse` that explicitly excludes picture post data for list views.

---

## R-04: Overlay Layout Design

### Findings

Professional social media post overlays typically use:

1. **Gradient bar:** Bottom 30-40% of image with a dark-to-transparent gradient (bottom to top).
2. **Headline:** Large bold text (40-60px at 1080px width), white, positioned in the gradient zone.
3. **Tagline:** Smaller text (20-28px), white with slight transparency, below headline.
4. **CTA:** Small pill/badge at the bottom ("Shop Now", "Learn More"), brand-colored background.
5. **Logo:** Corner-positioned, sized to ~10-15% of image width, with padding from edges.

**Safe zone:** Text should stay within 80% of image width and within the gradient bar height.

### Decision

Implement a `PicturePostCompositor` class in `backend/app/services/image_compositor.py` with the following layout:

```
┌─────────────────────────────┐
│                             │  ← Background image (AI-generated)
│         [LOGO]              │  ← Logo (optional, user-configured corner)
│                             │
│                             │
│  ┌───────────────────────┐  │
│  │  HEADLINE TEXT         │  │  ← Bold, white, 48px (Instagram) / 40px (Facebook)
│  │  Tagline text here     │  │  ← Regular, white/90%, 24px / 20px
│  │                        │  │
│  │  [ Shop Now ]          │  │  ← CTA pill, brand-colored
│  └───────────────────────┘  │  ← Semi-transparent gradient overlay
└─────────────────────────────┘
```

---

## R-05: Ollama as Docker Service vs. External Dependency

### Findings

Ollama can run as a Docker container (`ollama/ollama`), but image generation is macOS-only and requires Metal GPU access. Docker containers on macOS run in a Linux VM, which means:

- **Ollama in Docker cannot use macOS Metal GPU** for image generation.
- Image generation models require GPU acceleration to run in reasonable time.
- The user's Ollama is running natively on macOS (host).

### Decision

Ollama is an **external dependency**, not a Docker service. The backend container connects to the host's Ollama via `host.docker.internal:11434`. Document this in the quickstart. Add `OLLAMA_BASE_URL` env var defaulting to `http://host.docker.internal:11434`.
