# Technical Implementation Plan: Docker Data Persistence (Retrofit)

## Feature Summary

**Goal:** When the Docker image is rebuilt (`docker compose build && docker compose up`), all previously indexed repositories, FAISS indexes, BM25 data, knowledge graphs, and chat/session history MUST be retained.

**Constraint:** A live deployed version already exists with the team's indexed data in `./data/` on the host. The solution must be a zero-migration retrofit.

---

## Technical Context

### Data Stores Identified

| Store | Host Path | Container Path | Format |
|-------|-----------|----------------|--------|
| FAISS indexes | `./data/vector_store/` | `/app/data/vector_store/` | `.faiss` + `_metadata.pkl` per repo |
| BM25 indexes | `./data/vector_store/` | `/app/data/vector_store/` | `_bm25.pkl` per repo |
| Knowledge graphs | `./data/vector_store/` | `/app/data/vector_store/` | `_graphs.pkl` per repo |
| Chat/session history | `./data/cache/` | `/app/data/cache/` | `cache.db` (DiskCache/SQLite) |
| Cloned repositories | `./repos/` | `/app/repos/` | Git clones |
| Logs | `./logs/` | `/app/logs/` | `.log` files |
| HuggingFace models | `~/.cache/huggingface` | `/root/.cache/huggingface` | Read-only mount |

### Key Insight

The existing bind-mount approach (`./data:/app/data`) is **already correct** for persistence. Data lives on the host, not in the image. `docker compose build` only rebuilds the image layer — it never touches host-mounted directories.

---

## Decision: Bind Mounts (Retrofit-Safe)

Named volumes were considered but rejected because:
- The team already has indexed data in `./data/` on the host
- Switching to named volumes would create empty volumes and make existing data invisible
- That would be a breaking change requiring manual migration on every deployed instance

Bind mounts are the right choice:
- Data lives on the host and is never inside the Docker image
- `docker compose build` only rebuilds the image — bind-mounted dirs are untouched
- Zero migration needed for existing deployments
- Data is directly visible and backupable with `cp`

---

## Implementation

### Dockerfile

- Remove `VOLUME` declarations (they can cause Docker to create anonymous volumes that shadow bind mounts)
- Keep `mkdir -p` for first-run directory creation (overlaid by bind mounts at runtime)
- Add clear comments explaining the persistence model

### docker-compose.yml

- Keep bind mounts: `./data:/app/data`, `./repos:/app/repos`, `./logs:/app/logs`
- Add healthcheck for container monitoring
- Add header comments documenting the persistence guarantee

### Documentation

- README: Explain that `docker compose build && docker compose up -d` preserves all data
- DOCUMENTATION.md: Full data persistence section with backup/restore instructions

---

## Upgrade Path for Live Deployment

```bash
# On the deployed server:
git pull                                    # get updated code
docker compose build                        # rebuild image only
docker compose up -d                        # restart with new image, same data
curl http://localhost:5000/api/repositories  # verify repos still listed
```

No migration scripts needed. No data movement. The existing `./data/` and `./repos/` directories are used as-is.

---

## Generated Artifacts

| File | Description |
|------|-------------|
| `research.md` | Volume strategy analysis and retrofit decision |
| `data-model.md` | Complete data path inventory with sizing |
| `quickstart.md` | Upgrade and backup instructions |
