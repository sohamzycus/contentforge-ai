# Quickstart: Docker Data Persistence

## For New Users

Just run:

```bash
docker compose build
docker compose up -d
```

Data is stored in Docker named volumes and **automatically persists** across:
- `docker compose build` (image rebuilds)
- `docker compose up -d` (container restarts)
- `docker compose down` (container removal)
- `docker compose down && docker compose up -d` (full restart cycle)

**Warning:** `docker compose down -v` removes volumes and WILL delete all indexed data.

---

## For Existing Users (Migration from Bind Mounts)

If you previously had data in `./data/` and `./repos/` on the host:

### Option A: Migrate to Named Volumes (recommended)

```bash
# 1. Stop the current container
docker compose down

# 2. Pull the new compose file (already done if you updated the repo)

# 3. Start with new named volumes (creates empty volumes)
docker compose up -d

# 4. Copy existing data into the running container
docker cp ./data/. codeoracle:/app/data/
docker cp ./repos/. codeoracle:/app/repos/

# 5. Restart to pick up the data
docker compose restart
```

### Option B: Keep Bind Mounts

Create a `docker-compose.override.yml`:

```yaml
services:
  codeoracle:
    volumes:
      - ./data:/app/data
      - ./repos:/app/repos
      - ./logs:/app/logs
```

This overrides the named volumes with your existing host directories.

---

## Backup and Restore

### Backup

```bash
# Quick backup using docker cp
docker cp codeoracle:/app/data ./backup-data-$(date +%Y%m%d)

# Or backup named volumes directly
docker run --rm \
  -v codeoracle_codeoracle-data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/codeoracle-data-$(date +%Y%m%d).tar.gz -C /source .
```

### Restore

```bash
# From docker cp backup
docker cp ./backup-data-20250219/. codeoracle:/app/data/

# From tarball
docker run --rm \
  -v codeoracle_codeoracle-data:/target \
  -v $(pwd):/backup \
  alpine sh -c "cd /target && tar xzf /backup/codeoracle-data-20250219.tar.gz"
```

---

## Verify Persistence

```bash
# 1. Index a repo
curl -X POST http://localhost:5000/api/load-and-index \
  -H "Content-Type: application/json" \
  -d '{"source": "https://github.com/org/repo.git", "is_url": true}'

# 2. Rebuild the image
docker compose build

# 3. Restart
docker compose up -d

# 4. Verify — the repo should still be listed
curl http://localhost:5000/api/repositories
```

---

## Volume Management

```bash
# List volumes
docker volume ls | grep codeoracle

# Inspect a volume
docker volume inspect codeoracle_codeoracle-data

# Remove all CodeOracle volumes (DESTRUCTIVE)
docker compose down -v
```
