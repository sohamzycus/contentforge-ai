# Requirements Checklist: Platform Picture Posts (001)

> **Spec:** `.specify/specs/001-platform-picture-posts/spec.md`
> **Date:** 2026-03-03
> **Status:** All open questions resolved. Ready for planning.

---

## Functional Requirements

- [ ] **FR-01** Generate background image using local Ollama image-generation model
- [ ] **FR-02** Overlay marketing copy with legible typography (Pillow, gradient bar + white text)
- [ ] **FR-03** Instagram picture posts at 1080x1080 px
- [ ] **FR-04** Facebook picture posts at 1200x630 px
- [ ] **FR-05** Store picture posts as base64 PNG in project content JSON
- [ ] **FR-06** Display picture post previews on project detail page
- [ ] **FR-07** Download picture posts as PNG files
- [ ] **FR-08** Generate concise headline (5-10 words) + tagline (15-20 words) for overlay
- [ ] **FR-09** Include CTA element on picture post
- [ ] **FR-10** Backward compatibility with existing projects
- [ ] **FR-11** Logo upload via Brand Settings page
- [ ] **FR-12** Composite logo onto picture posts (configurable 4-corner position)
- [ ] **FR-13** Brand color picker for overlay gradient
- [ ] **FR-14** Brand Settings UI (navbar accessible, form with upload + position + color)

## Non-Functional Requirements

- [ ] **NFR-01** Generation time < 30s per platform (Ollama dependent)
- [ ] **NFR-02** Image file size < 3 MB (~4 MB base64)
- [ ] **NFR-03** Image quality minimum 72 DPI
- [ ] **NFR-04** Text legibility WCAG AA contrast (4.5:1)
- [ ] **NFR-05** Project API response < 15 MB (with 2 base64 images)
- [ ] **NFR-06** Logo upload max 2 MB, PNG/JPEG only
- [ ] **NFR-07** Graceful degradation if Ollama unreachable

## User Scenarios

- [ ] **S-01** First-time project creation produces picture posts
- [ ] **S-02** Existing projects display gracefully without picture posts
- [ ] **S-03** Picture post download works correctly
- [ ] **S-04** Brand settings with logo upload flow

## Edge Cases

- [ ] **EC-01** Ollama unreachable — text content still saved
- [ ] **EC-02** Ollama model not installed — graceful degradation + backend log
- [ ] **EC-03** Vague product description — best-effort image generated
- [ ] **EC-04** Overlay text too long — font reduced or truncated
- [ ] **EC-05** Download during generation — button disabled
- [ ] **EC-06** Pre-feature projects — no broken images
- [ ] **EC-07** Long product name — truncated in overlay
- [ ] **EC-08** Logo > 2 MB — validation error
- [ ] **EC-09** Non-image logo upload — validation error
- [ ] **EC-10** No logo uploaded — posts generated without logo
- [ ] **EC-11** Corrupted base64 in DB — fallback message in UI
- [ ] **EC-12** Ollama timeout (> 60s) — graceful degradation

## Clarifications Resolved

- [x] **C-01** Image generation provider → Local Ollama (free, self-hosted)
- [x] **C-02** Storage strategy → Base64 in PostgreSQL content JSON
- [x] **C-03** Brand customization → Default template + logo upload + position + color picker
