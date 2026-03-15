# Data Model: Platform Picture Posts (001)

> **Date:** 2026-03-03

---

## Existing Entities (Modified)

### `projects.content` JSON Column — Extended Schema

The existing `content` JSON column gains a new top-level key: `picture_posts`.

```json
{
  "product_info": { "name": "...", "description": "...", "target_audience": "...", "usps": [] },
  "research": { "audience_insights": "...", "competitor_analysis": "..." },
  "content": {
    "facebook": "...",
    "instagram": "...",
    "tiktok": "...",
    "youtube": "...",
    "google_ads": "..."
  },
  "creative": { "image_prompt": "..." },
  "picture_posts": {
    "instagram": {
      "image_base64": "iVBORw0KGgo...",
      "headline": "Stay Hydrated, Stay Sharp",
      "tagline": "The smart bottle that tracks your daily water intake and reminds you to drink.",
      "cta": "Shop Now",
      "dimensions": { "width": 1080, "height": 1080 }
    },
    "facebook": {
      "image_base64": "iVBORw0KGgo...",
      "headline": "Stay Hydrated, Stay Sharp",
      "tagline": "The smart bottle that tracks your daily water intake and reminds you to drink.",
      "cta": "Shop Now",
      "dimensions": { "width": 1200, "height": 630 }
    }
  }
}
```

**Notes:**
- `picture_posts` is `null` or absent for pre-feature projects (backward compatible).
- `image_base64` is a PNG image encoded as a base64 string (no `data:` prefix — frontend prepends it).
- `headline`, `tagline`, `cta` are stored separately so the frontend can display them as metadata.
- `dimensions` is informational for the UI.

---

## New Entity: `brand_settings` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `Integer` (PK) | No | auto-increment | Primary key |
| `user_id` | `Integer` (FK → `users.id`) | No | — | One-to-one with users |
| `logo_base64` | `Text` | Yes | `null` | Base64-encoded logo image (PNG/JPEG) |
| `logo_mime_type` | `String(20)` | Yes | `null` | `image/png` or `image/jpeg` |
| `logo_position` | `String(2)` | No | `BR` | `TL`, `TR`, `BL`, `BR` |
| `brand_color` | `String(7)` | No | `#000000` | Hex color for overlay gradient |
| `created_at` | `DateTime(tz)` | No | `func.now()` | Creation timestamp |
| `updated_at` | `DateTime(tz)` | Yes | `null` | Last update timestamp |

**Constraints:**
- `UNIQUE(user_id)` — one brand settings record per user.
- `FK(user_id)` → `users.id` with `ON DELETE CASCADE`.

**Relationship:**
- `User.brand_settings` → one-to-one with `BrandSettings` (uselist=False).
- `BrandSettings.owner` → back-reference to `User`.

---

## New Pydantic Schemas

### `BrandSettingsBase`

```python
class BrandSettingsBase(BaseModel):
    logo_position: str = "BR"       # TL, TR, BL, BR
    brand_color: str = "#000000"    # Hex color
```

### `BrandSettingsUpdate`

```python
class BrandSettingsUpdate(BrandSettingsBase):
    logo_base64: Optional[str] = None
    logo_mime_type: Optional[str] = None
```

### `BrandSettingsResponse`

```python
class BrandSettingsResponse(BrandSettingsBase):
    id: int
    user_id: int
    has_logo: bool                  # Computed: logo_base64 is not None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
```

**Note:** `BrandSettingsResponse` does NOT include `logo_base64` to keep list responses lean. A separate endpoint returns the logo image.

### `BrandSettingsWithLogo`

```python
class BrandSettingsWithLogo(BrandSettingsResponse):
    logo_base64: Optional[str] = None
    logo_mime_type: Optional[str] = None
```

---

## Migration

**Alembic migration:** `"Add brand_settings table"`

```python
def upgrade():
    op.create_table(
        "brand_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("logo_base64", sa.Text(), nullable=True),
        sa.Column("logo_mime_type", sa.String(20), nullable=True),
        sa.Column("logo_position", sa.String(2), nullable=False, server_default="BR"),
        sa.Column("brand_color", sa.String(7), nullable=False, server_default="#000000"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_brand_settings_user_id", "brand_settings", ["user_id"])

def downgrade():
    op.drop_table("brand_settings")
```

**No migration needed for `projects` table** — the `content` JSON column is schemaless; new keys are added at the application level.
