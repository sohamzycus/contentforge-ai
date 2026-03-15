# Quickstart: Platform Picture Posts (001)

> **Date:** 2026-03-03

---

## Prerequisites

1. **macOS** (Ollama image generation is macOS-only as of Jan 2026)
2. **Ollama installed and running** on the host machine
3. **Image generation model pulled:**

```bash
ollama pull x/z-image-turbo
```

4. **Existing ContentForge AI stack running** (Docker Compose with backend, frontend, db)

---

## Environment Configuration

Add to your `.env` file:

```bash
# Ollama Image Generation
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_IMAGE_MODEL=x/z-image-turbo
```

These are also added to `docker-compose.yml` as environment variables for the backend service.

---

## Verify Ollama Connectivity

From the backend container:

```bash
docker-compose exec backend python -c "
import requests
try:
    r = requests.get('http://host.docker.internal:11434/api/tags')
    models = [m['name'] for m in r.json().get('models', [])]
    print('Connected. Models:', models)
except Exception as e:
    print('Failed:', e)
"
```

---

## Database Migration

After pulling the new code:

```bash
docker-compose exec backend alembic upgrade head
```

This creates the `brand_settings` table. No data migration needed — existing projects are unaffected.

---

## Integration Scenarios

### Scenario A: Generate Picture Posts (Happy Path)

1. Ensure Ollama is running with `x/z-image-turbo` pulled.
2. Log in to ContentForge at `http://localhost:3001`.
3. Create a new project with product details.
4. Wait for generation (~90-150 seconds total: ~60-90s text + ~20-30s per image).
5. On the project detail page, click the Instagram tab.
6. Toggle to "Picture Post" view.
7. Verify: a composite image with headline, tagline, CTA, and background is displayed.
8. Click "Download Image" — verify a valid PNG downloads.
9. Repeat for Facebook tab.

### Scenario B: Ollama Unavailable (Graceful Degradation)

1. Stop Ollama: `ollama stop` or kill the process.
2. Create a new project.
3. Verify: text content generates successfully.
4. Verify: picture post section shows "Picture post could not be generated."
5. No errors, no crashes.

### Scenario C: Brand Settings with Logo

1. Navigate to "Brand Settings" (navbar link).
2. Upload a PNG logo (< 2 MB).
3. Select "Top-Left" position.
4. Pick brand color `#4c6ef5`.
5. Click "Save."
6. Create a new project.
7. Verify: picture posts include the logo in the top-left corner.
8. Verify: overlay gradient uses the selected brand color.

### Scenario D: Backward Compatibility

1. Open a project that was created before this feature.
2. Verify: text content displays normally.
3. Verify: no "Picture Post" tab or a graceful "not available" message.
4. No broken images, no console errors.

---

## Rebuild & Deploy

```bash
# Rebuild backend (new dependencies: Pillow, requests)
docker-compose up -d --build backend

# Run migration
docker-compose exec backend alembic upgrade head

# Verify
curl http://localhost:8002/health
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "Connection refused" to Ollama | Ensure Ollama is running: `ollama serve`. Check `OLLAMA_BASE_URL` in `.env`. |
| "Model not found" | Pull the model: `ollama pull x/z-image-turbo` |
| Image generation timeout | Increase `OLLAMA_TIMEOUT` env var (default: 120s). Larger models need more time. |
| Blank/black background image | Check Ollama logs. The prompt may be too vague — the system will still overlay text. |
| Logo not appearing | Verify brand settings saved (check `/api/brand-settings`). Ensure logo is < 2 MB PNG/JPEG. |
| Large API responses | Expected with base64 images (~3-4 MB per project). List endpoint is unaffected. |
