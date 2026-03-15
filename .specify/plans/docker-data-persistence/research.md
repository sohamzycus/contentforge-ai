# Research: Docker Data Persistence for CodeOracle

## Question 1: Bind Mounts vs Named Volumes?

### Bind Mounts (current approach)

```yaml
volumes:
  - ./data:/app/data
  - ./repos:/app/repos
```

**Pros:**
- Data is visible on the host filesystem (easy to inspect, backup with `cp`)
- Familiar to developers — `ls ./data/vector_store/` just works
- No Docker volume management needed

**Cons:**
- Tied to the host directory structure
- Permission issues if container runs as non-root
- `docker compose down -v` doesn't affect bind mounts (actually a pro for safety)
- Not portable across machines without copying the directory

### Named Volumes

```yaml
volumes:
  codeoracle-data:
    driver: local
  codeoracle-repos:
    driver: local
```

**Pros:**
- Docker manages lifecycle — survives `docker compose down` (without `-v`)
- Portable with `docker volume` commands
- Better performance on Docker Desktop (macOS/Windows) due to gRPC-FUSE bypass
- Can be backed up with `docker run --rm -v vol:/data -v $(pwd):/backup alpine tar czf /backup/vol.tar.gz /data`

**Cons:**
- Data is hidden in Docker's storage directory
- Harder to inspect without `docker exec` or `docker cp`
- `docker compose down -v` WILL destroy named volumes

### Decision: **Bind mounts (retrofit-safe)**

Keep bind mounts as the default. The team already has a live deployed version with indexed data in `./data/` on the host. Switching to named volumes would create empty volumes and make the existing data invisible — a breaking change.

Bind mounts are the correct choice because:
- Data lives on the host and is never inside the Docker image
- `docker compose build` only rebuilds the image layer — bind-mounted host dirs are untouched
- Zero migration needed for the existing deployment
- Data is directly visible and backupable with `cp`

---

## Question 2: What exactly needs to persist?

### Critical (MUST persist)

| Path | Contents | Size (typical) |
|------|----------|----------------|
| `/app/data/vector_store/*.faiss` | FAISS vector indexes | 200KB–5MB per repo |
| `/app/data/vector_store/*_metadata.pkl` | Element metadata | 800KB–50MB per repo |
| `/app/data/vector_store/*_bm25.pkl` | BM25 keyword indexes | 900KB–53MB per repo |
| `/app/data/vector_store/*_graphs.pkl` | Knowledge graphs (call, dep, inheritance, API) | 1MB–52MB per repo |
| `/app/data/cache/cache.db*` | DiskCache SQLite DB (sessions, dialogue history, embeddings) | ~130KB–1GB |

### Important (SHOULD persist)

| Path | Contents | Rationale |
|------|----------|-----------|
| `/app/repos/` | Cloned repository source code | Can be re-cloned, but saves time |
| `/app/logs/` | Application logs | Useful for debugging |

### Not persisted (regenerated)

| Path | Contents | Rationale |
|------|----------|-----------|
| `/root/.cache/huggingface/` | Embedding model weights | Already bind-mounted read-only from host |
| `/app/.tiktoken_cache/` | Tokenizer cache | Baked into image, small |

---

## Question 3: Backup and restore strategy?

### Approach: Volume export/import scripts

```bash
# Backup
docker run --rm \
  -v codeoracle_codeoracle-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/codeoracle-data-$(date +%Y%m%d).tar.gz -C /data .

# Restore
docker run --rm \
  -v codeoracle_codeoracle-data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/codeoracle-data-20250219.tar.gz"
```

### Alternative: `docker cp` from running container

```bash
docker cp codeoracle:/app/data ./backup-data
docker cp codeoracle:/app/repos ./backup-repos
```

### Decision: Provide both as documented options, plus a convenience `backup.sh` script.

---

## Question 4: Migration path for existing users?

Existing users have data in `./data/` and `./repos/` on the host. When switching to named volumes:

1. First run with new compose will create empty named volumes
2. Need a one-time migration: copy host `./data/` into the named volume
3. Provide a `migrate.sh` script and document the process
4. Keep `docker-compose.override.yml.example` for users who want to keep bind mounts

---

## Question 5: Container user and permissions?

Current Dockerfile runs as `root` (default). This is fine for named volumes (Docker sets ownership). For bind mounts, the container writes as root, which can cause permission issues on Linux hosts.

**Decision:** Keep root for now (simplicity), document the permission consideration. A future enhancement could add a non-root user with `--user` flag support.
