# Data Model: CodeOracle Persistent Storage

## Storage Layout

```
/app/
├── data/                              ← VOLUME: codeoracle-data
│   ├── vector_store/
│   │   ├── {repo_name}.faiss          ← FAISS vector index (per repo)
│   │   ├── {repo_name}_metadata.pkl   ← Element metadata (per repo)
│   │   ├── {repo_name}_bm25.pkl       ← BM25 keyword index (per repo)
│   │   └── {repo_name}_graphs.pkl     ← NetworkX graphs: call, dependency,
│   │                                     inheritance, API (per repo)
│   └── cache/
│       ├── cache.db                   ← DiskCache SQLite database
│       ├── cache.db-shm               ← SQLite shared memory
│       └── cache.db-wal               ← SQLite write-ahead log
│
├── repos/                             ← VOLUME: codeoracle-repos
│   ├── {repo_name}/                   ← Cloned git repository
│   └── ...
│
└── logs/                              ← VOLUME: codeoracle-logs
    └── codeoracle.log                 ← Application log file
```

## Data Entities

### Per-Repository Index Files (in `data/vector_store/`)

Each indexed repository produces 4 files:

| File | Format | Producer | Consumer | Description |
|------|--------|----------|----------|-------------|
| `{repo}.faiss` | FAISS binary | `VectorStore.save()` | `VectorStore.load()` | Dense vector index for semantic search |
| `{repo}_metadata.pkl` | Python pickle | `VectorStore.save()` | `VectorStore.load()` | CodeElement metadata (signatures, paths, types, API info) |
| `{repo}_bm25.pkl` | Python pickle | `HybridRetriever.save_bm25()` | `HybridRetriever.load_bm25()` | Tokenized corpus for BM25 keyword search |
| `{repo}_graphs.pkl` | Python pickle | `CodeGraphBuilder.save()` | `CodeGraphBuilder.load()` | NetworkX DiGraphs: call_graph, dependency_graph, inheritance_graph, api_graph + lookup maps |

### Cache Database (in `data/cache/`)

DiskCache (SQLite-backed) stores:

| Key Pattern | Content | TTL |
|-------------|---------|-----|
| `embedding_{hash}` | Cached embedding vectors | 3600s (1 hour) |
| `dialogue_session_{id}_turn_{n}` | Single dialogue turn (question + answer + context) | 2592000s (30 days) |
| `dialogue_session_{id}_index` | Session metadata (created_at, updated_at, total_turns) | 2592000s (30 days) |
| `query_{hash}` | Cached query results (if enabled) | 3600s (1 hour) |

### Repository Clones (in `repos/`)

Full or shallow (`--depth 1`) git clones. Used by the agency mode for file browsing and grep operations at query time.

## Configuration Sources

All paths are configured in `config/config.yaml`:

```yaml
vector_store:
  persist_directory: "./data/vector_store"

cache:
  cache_directory: "./data/cache"

repo_root: ./repos

logging:
  file: "./logs/codeoracle.log"
```

These are relative to the working directory (`/app` in Docker).

## Volume Sizing Guide

| Repo Size | Index Files | Cache | Total |
|-----------|-------------|-------|-------|
| Small (< 1K files) | ~4 MB | ~1 MB | ~5 MB |
| Medium (1K–10K files) | ~50 MB | ~5 MB | ~55 MB |
| Large (10K+ files) | ~200 MB | ~20 MB | ~220 MB |

For 10 medium repos: ~550 MB total in `data/`.
