# Specification: Platform Picture Posts (Instagram & Facebook)

> **Constitution Version:** 1.0.0
> **Feature Number:** 001
> **Date:** 2026-03-03
> **Status:** Approved

---

## Overview

**Problem:** ContentForge AI currently generates text-only marketing content and a single generic image-generation prompt. Users must leave the platform, manually feed the prompt into an external image generator, then manually composite the text onto the image to create a visual post. This breaks the workflow and adds 15-30 minutes of manual effort per platform.

**Solution:** Generate ready-to-download, platform-specific picture posts for Instagram and Facebook — each combining an AI-generated background image with overlaid marketing copy, brand elements, and platform-appropriate dimensions. The user receives a complete visual asset they can publish directly.

**Success Criteria:**
1. For every project, the system produces at least one downloadable picture post for Instagram and one for Facebook.
2. Each picture post is correctly sized for its target platform (Instagram: 1080x1080, Facebook: 1200x630).
3. The generated image includes legible marketing copy overlaid on a visually relevant background.
4. A user can download the picture post in a standard image format (PNG or JPEG) directly from the project detail page.
5. The end-to-end generation time for picture posts adds no more than 30 seconds to the existing content generation workflow.

---

## User Scenarios & Testing

### Scenario 1: First-Time Project Creation with Picture Posts

**Actor:** Authenticated user (marketing manager)

**Flow:**
1. User navigates to "New Project" and fills in product details.
2. User clicks "Generate Content."
3. System generates all text content (existing behavior) **plus** picture posts for Instagram and Facebook.
4. User is redirected to the project detail page.
5. User sees new "Instagram Post" and "Facebook Post" tabs (or sections within existing platform tabs) showing a preview of the generated picture post.
6. User clicks "Download" to save the image file.

**Verification:**
- The picture post preview renders in the browser without errors.
- The downloaded file is a valid PNG/JPEG with correct dimensions.
- The overlaid text is legible and does not overflow the image boundaries.

### Scenario 2: Viewing Picture Posts on an Existing Project

**Actor:** Authenticated user

**Flow:**
1. User opens an existing project from the dashboard.
2. Under the Instagram tab, user sees both the caption text (existing) and a picture post preview (new).
3. Under the Facebook tab, user sees both the post text (existing) and a picture post preview (new).
4. User can toggle between text content and picture post within each tab.

**Verification:**
- Projects created before this feature show text content only (no broken image placeholders).
- Projects created after this feature show both text and picture post.

### Scenario 3: Picture Post Download

**Actor:** Authenticated user

**Flow:**
1. User views a picture post preview on the project detail page.
2. User clicks the "Download Image" button.
3. Browser downloads a file named `{product_name}_{platform}_post.png`.

**Verification:**
- File downloads successfully.
- File is a valid image with the correct platform dimensions.
- File size is reasonable (< 5 MB).

### Scenario 4: Configuring Brand Settings with Logo Upload

**Actor:** Authenticated user

**Flow:**
1. User clicks "Brand Settings" in the navbar or dashboard.
2. User sees the brand settings page with logo upload, position selector, and color picker.
3. User uploads a PNG logo (< 2 MB).
4. User selects "Bottom-Right" as the logo position.
5. User picks a brand color (e.g., `#4c6ef5`).
6. User clicks "Save."
7. User creates a new project.
8. The generated picture posts include the logo in the bottom-right corner and the overlay gradient uses the selected brand color.

**Verification:**
- Logo appears at the correct position on the generated picture post.
- Brand color is reflected in the overlay gradient.
- Settings persist across sessions (stored in DB).
- Removing the logo and saving results in picture posts without a logo.

---

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-01 | Generate a background image for each picture post using a local Ollama image-generation model | Must | Ollama HTTP API; model and URL configurable via env vars (`OLLAMA_BASE_URL`, `OLLAMA_IMAGE_MODEL`) |
| FR-02 | Overlay marketing copy onto the background image with legible typography (Pillow) | Must | Semi-transparent gradient overlay bar + white text + text shadow for contrast |
| FR-03 | Produce Instagram picture posts at 1080x1080 pixels (square) | Must | Instagram's standard feed post size |
| FR-04 | Produce Facebook picture posts at 1200x630 pixels (landscape) | Must | Facebook's recommended shared image size |
| FR-05 | Store generated picture posts as base64-encoded PNG strings in the project's content JSON column | Must | Stored under `content.picture_posts.instagram` and `content.picture_posts.facebook` |
| FR-06 | Display picture post previews on the project detail page within the relevant platform tab | Must | Render via `<img src="data:image/png;base64,..." />` |
| FR-07 | Allow users to download picture posts as PNG files | Must | Decode base64 on the client and trigger browser download |
| FR-08 | Generate a concise headline (5-10 words) and tagline (15-20 words) specifically for the picture post overlay | Must | LLM generates these separately from the full caption; stored in content JSON |
| FR-09 | Include a call-to-action element on the picture post (e.g., "Learn More", "Shop Now") | Should | Positioned at the bottom of the overlay bar |
| FR-10 | Backward compatibility: existing projects without picture posts display gracefully | Must | Hide "Picture Post" sub-tab or show "Available for new projects" message |
| FR-11 | Allow users to upload a logo image via a "Brand Settings" section | Should | Stored per-user; applied to all future picture posts for that user |
| FR-12 | Composite the uploaded logo onto picture posts (configurable position: 4 corners) | Should | Default: bottom-right; user selects from TL, TR, BL, BR |
| FR-13 | Allow users to select a brand color for the overlay gradient | Should | Color picker; default: dark semi-transparent black gradient |
| FR-14 | Provide a "Brand Settings" UI accessible from the dashboard or navbar | Should | Simple form: logo upload, position selector, color picker |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Picture post generation time | < 30 seconds additional per platform (dependent on Ollama model speed) |
| NFR-02 | Generated image file size | < 3 MB per image (base64 encoded ~4 MB in JSON) |
| NFR-03 | Image quality | Minimum 72 DPI; visually professional |
| NFR-04 | Text legibility | WCAG AA contrast ratio (4.5:1) between overlay text and background |
| NFR-05 | Storage impact | Project API response with picture posts must not exceed 15 MB (2 images base64 + text) |
| NFR-06 | Logo upload size | Max 2 MB per logo file; PNG or JPEG only |
| NFR-07 | Ollama availability | System must gracefully degrade if Ollama is unreachable (text content still generated) |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| **Picture Post** | A composite image combining a background visual with overlaid marketing copy, sized for a specific platform. Stored as base64 PNG in project content JSON. |
| **Background Image** | An AI-generated image from a local Ollama model, contextually relevant to the product and audience |
| **Overlay Copy** | A short headline (5-10 words) + tagline (15-20 words) + CTA, generated by the LLM specifically for image overlay |
| **Platform Template** | Dimension and layout rules for a specific platform (Instagram 1080x1080, Facebook 1200x630) |
| **Brand Settings** | Per-user configuration: optional logo image (base64), logo position (TL/TR/BL/BR), brand color (hex). Stored on the user record or a related table. |
| **Logo** | User-uploaded brand logo (PNG/JPEG, max 2 MB), composited onto picture posts at the chosen corner position |

---

## UI/UX

### Project Detail Page Changes

Within each platform tab (Instagram, Facebook), the content area should present two sub-views:

1. **Caption / Post Text** (existing) — the full-length text content, rendered as markdown.
2. **Picture Post** (new) — a visual preview of the generated image post.

**Layout:**
- A toggle or sub-tab within the platform tab: "Text" | "Picture Post"
- The picture post preview should be displayed at a reasonable preview size (max-width 600px) with the actual dimensions noted below it (e.g., "1080 x 1080 px").
- A "Download Image" button below the preview.

**Design tokens** (per Constitution Section 8.3):
- Preview card: `rounded-2xl`, `border border-surface-200`, `shadow-soft`
- Download button: same style as existing download/copy buttons in the toolbar
- Dimension label: `text-xs text-gray-400`

### Brand Settings Page (New)

Accessible from the navbar (authenticated users only) or from a settings icon on the dashboard.

**Layout:**
- **Logo Upload** — Drag-and-drop or click-to-upload area. Shows current logo preview if one exists. "Remove" button to clear.
- **Logo Position** — 4-option selector (visual grid): Top-Left, Top-Right, Bottom-Left, Bottom-Right. Default: Bottom-Right.
- **Brand Color** — Color picker input for the overlay gradient accent color. Default: `#000000` (black, semi-transparent).
- **Save** button persists settings. Settings apply to all future picture posts for this user.

**Design tokens** (per Constitution Section 8.3):
- Upload area: `rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50`
- Position selector: 2x2 grid of `rounded-xl` buttons with active state `bg-brand-50 border-brand-400`
- Color picker: native `<input type="color">` styled with `rounded-lg border border-surface-200`

### Backward Compatibility

- If a project's content JSON does not contain picture post data, the "Picture Post" sub-tab should either be hidden or show a message: "Picture posts are available for new projects."

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| Ollama is unreachable or returns an error | Text content is still generated and saved. Picture post fields are `null`. User sees: "Picture post could not be generated. Text content is available." No crash. |
| Ollama model is not installed / wrong model name | Same graceful degradation as above. Backend logs the specific error for debugging. |
| Product description is too vague for meaningful image generation | System sends the best prompt it can; Ollama generates whatever it can. Overlay copy is still applied. No error to user. |
| Generated overlay text is too long for the image dimensions | Font size reduced dynamically to fit; if still too long, truncated with ellipsis. Never overflow the safe zone. |
| User downloads a picture post while it's still generating | Download button is disabled with a loading state until generation is complete. |
| Existing project (pre-feature) is viewed | No picture post section shown, or a graceful "not available" message. No broken image elements. |
| Very long product name in the overlay | Truncate to 40 characters with ellipsis in the overlay; full name remains in the text content. |
| User uploads a logo larger than 2 MB | Rejected with validation error: "Logo must be under 2 MB." |
| User uploads a non-image file as logo | Rejected with validation error: "Only PNG and JPEG files are accepted." |
| User has no logo uploaded | Picture posts are generated without a logo. No placeholder or broken image. |
| Base64 image data is corrupted in DB | Frontend shows a fallback message: "Image could not be loaded." instead of a broken `<img>` tag. |
| Ollama generation is slow (> 60s) | Backend has a configurable timeout. On timeout, picture post fields are `null` with graceful degradation. |

---

## Dependencies

- [x] **AI Image Generation Service** — Local Ollama instance with a Stable Diffusion or similar image-generation model. Free, self-hosted, no API costs. Backend connects to Ollama's HTTP API.
- [ ] **Image Compositing Capability** — Pillow (Python). Server-side text overlay, resizing, and compositing. Justification per Constitution Section 3.2: required for core feature; Pillow is a well-established, MIT-licensed library with no security concerns.
- [ ] **Ollama Python client or HTTP integration** — `ollama` Python package or direct HTTP calls to `http://localhost:11434`. Justification: required to invoke local image generation models.

---

## Clarifications

> Recorded 2026-03-03 — resolves all 3 open questions from initial spec.

### C-01: Image Generation Provider

**Question:** Which AI image generation API should be used?

**Answer:** Use a local **Ollama** instance with a free image-generation model (e.g., Stable Diffusion via Ollama). The user already has Ollama models running locally. This means:
- Zero API cost.
- Backend calls Ollama's HTTP API (default: `http://localhost:11434`).
- The Ollama base URL must be configurable via environment variable (`OLLAMA_BASE_URL`).
- The image model name must be configurable (`OLLAMA_IMAGE_MODEL`).
- The Ollama service must be added to `docker-compose.yml` or documented as an external dependency.

**Spec impact:** FR-01 updated. Infrastructure section needed.

### C-02: Storage Strategy

**Question:** File system or base64 in database?

**Answer:** **Base64-encoded strings stored in the project's content JSON column** in PostgreSQL. Rationale:
- Simpler architecture — no file storage layer, no static file serving, no cleanup jobs.
- Acceptable for MVP scale (tens/hundreds of projects, not millions).
- Frontend renders via `data:image/png;base64,{data}` src attribute.
- Trade-off accepted: larger DB rows (~1-3 MB per image), larger API responses.

**Spec impact:** FR-05 updated. NFR-05 limit raised to accommodate base64 payloads.

### C-03: Brand Customization

**Question:** Default template or user-configurable branding?

**Answer:** **Default professional template for MVP** with an **additional option for logo upload**. Specifically:
- MVP ships with a clean, professional default overlay template (semi-transparent gradient bar, white text, modern sans-serif font).
- Users can optionally upload a logo image via a new "Brand Settings" section.
- The uploaded logo is composited onto the picture post (e.g., bottom-right corner or top-left).
- A simple customization menu allows: logo upload, logo position (4 corners), and optional brand color (applied to the overlay gradient).
- Full brand customization (custom fonts, multiple templates) is deferred post-MVP.

**Spec impact:** FR-08, FR-09 updated. New FR-11 through FR-14 added. New UI section for brand settings.

---

## Open Questions

All original open questions have been resolved (see Clarifications above). No remaining blockers for planning.
