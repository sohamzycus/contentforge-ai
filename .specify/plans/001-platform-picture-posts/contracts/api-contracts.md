# API Contracts: Platform Picture Posts (001)

> **Date:** 2026-03-03
> **Base URL:** `/api`

---

## Existing Endpoints (Modified)

### `POST /api/projects` — Create Project

**Change:** Response now includes `picture_posts` in the `content` JSON. No request changes.

**Response (201) — new fields in `content`:**

```json
{
  "id": 1,
  "user_id": 1,
  "product_name": "Smart Water Bottle",
  "product_description": "...",
  "target_audience": "...",
  "unique_selling_points": ["..."],
  "content": {
    "product_info": { "...": "..." },
    "research": { "...": "..." },
    "content": { "facebook": "...", "instagram": "...", "...": "..." },
    "creative": { "image_prompt": "..." },
    "picture_posts": {
      "instagram": {
        "image_base64": "iVBORw0KGgo...",
        "headline": "Stay Hydrated, Stay Sharp",
        "tagline": "Track your water intake effortlessly.",
        "cta": "Shop Now",
        "dimensions": { "width": 1080, "height": 1080 }
      },
      "facebook": {
        "image_base64": "iVBORw0KGgo...",
        "headline": "Stay Hydrated, Stay Sharp",
        "tagline": "Track your water intake effortlessly.",
        "cta": "Shop Now",
        "dimensions": { "width": 1200, "height": 630 }
      }
    }
  },
  "created_at": "2026-03-03T12:00:00Z"
}
```

**Graceful degradation:** If Ollama is unreachable, `picture_posts` is `null`:

```json
{
  "content": {
    "...": "...",
    "picture_posts": null
  }
}
```

### `GET /api/projects/{id}` — Get Project

**Change:** Same as above — response includes `picture_posts` if available.

### `GET /api/projects` — List Projects

**No change.** `ProjectList` schema does not include `content`, so picture post data is never sent in list responses.

---

## New Endpoints

### `GET /api/brand-settings` — Get Brand Settings

Returns the current user's brand settings.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "user_id": 1,
  "has_logo": true,
  "logo_position": "BR",
  "brand_color": "#4c6ef5",
  "created_at": "2026-03-03T12:00:00Z",
  "updated_at": "2026-03-03T14:00:00Z"
}
```

**Response (200) — no settings yet:**

```json
{
  "id": null,
  "user_id": 1,
  "has_logo": false,
  "logo_position": "BR",
  "brand_color": "#000000",
  "created_at": null,
  "updated_at": null
}
```

---

### `PUT /api/brand-settings` — Update Brand Settings

Creates or updates the current user's brand settings (upsert).

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "logo_base64": "iVBORw0KGgo...",
  "logo_mime_type": "image/png",
  "logo_position": "BR",
  "brand_color": "#4c6ef5"
}
```

**Validation rules:**
- `logo_base64`: Optional. If provided, must be valid base64. Decoded size must be < 2 MB.
- `logo_mime_type`: Required if `logo_base64` is provided. Must be `image/png` or `image/jpeg`.
- `logo_position`: Required. Must be one of: `TL`, `TR`, `BL`, `BR`.
- `brand_color`: Required. Must match regex `^#[0-9a-fA-F]{6}$`.

**Response (200):**

```json
{
  "id": 1,
  "user_id": 1,
  "has_logo": true,
  "logo_position": "BR",
  "brand_color": "#4c6ef5",
  "created_at": "2026-03-03T12:00:00Z",
  "updated_at": "2026-03-03T14:30:00Z"
}
```

**Error (422):**

```json
{
  "detail": "Logo must be under 2 MB."
}
```

---

### `DELETE /api/brand-settings/logo` — Remove Logo

Removes only the logo; keeps other brand settings.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "user_id": 1,
  "has_logo": false,
  "logo_position": "BR",
  "brand_color": "#4c6ef5",
  "created_at": "2026-03-03T12:00:00Z",
  "updated_at": "2026-03-03T14:35:00Z"
}
```

---

### `GET /api/brand-settings/logo` — Get Logo Image

Returns the raw logo image for preview.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "logo_base64": "iVBORw0KGgo...",
  "logo_mime_type": "image/png"
}
```

**Response (404):**

```json
{
  "detail": "No logo uploaded."
}
```
