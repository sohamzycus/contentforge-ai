# Technical Implementation Plan: SME Business Management for Platto & Bakeish

> **Constitution Version:** 1.0.0
> **Feature Number:** 002
> **Date:** 2026-03-09
> **Status:** Approved

---

## Feature Summary

**Goal:** Expand ContentForge AI from a marketing-only tool into a full SME business management platform — enabling the user to manage inventory, item catalogs, daily orders, financial transactions, investments, and daily summaries for two home-grown brands: **Platto** (healthy food) and **Bakeish** (homemade bakery).

**User Story:** As a startup SME owner running Platto and Bakeish, I want a single platform to track my inventory, orders, transactions, and investments so that I can manage both brands efficiently without spreadsheets.

**Constitution Alignment:**
- [x] Adheres to SOLID principles (Section 2.1) — each new module (brands, items, inventory, orders, transactions, investments, summary) has single responsibility; new services are independent; existing code untouched
- [x] Respects layered architecture (Section 2.2) — new models → schemas → services → endpoints follow the same pattern
- [x] No new unapproved dependencies (Section 3.2) — zero new Python or JS dependencies required
- [x] Security rules followed (Section 4) — all endpoints auth-protected; brand ownership enforced; no secrets in code

---

## Technical Context

### Current State

- Two SQLAlchemy models: `User`, `Project`
- Two API routers: `auth`, `projects`
- Marketing content generation via LangGraph + Claude
- React frontend with 6 pages (Landing, Login, Register, Dashboard, NewProject, ProjectDetail)
- Single Alembic migration (001)

### Proposed Change

Add 8 new database tables, 7 new API routers, 5 new service modules, and 10+ new frontend pages — all **purely additive** with zero modifications to existing code.

### Affected Layers

- [x] Presentation (Frontend) — 10+ new pages, updated navigation, new dashboard
- [x] API Layer (FastAPI routers) — 7 new routers (brands, items, inventory, orders, transactions, investments, summary)
- [x] Service Layer (Business logic) — order service, inventory service, summary service
- [x] Data Layer (Models, migrations) — 8 new tables, 1 new Alembic migration
- [ ] Infrastructure (Docker, config) — no changes needed

---

## Design Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| Multi-brand model | Tag field vs. separate entity | **Separate `Brand` entity** | FK integrity, clean isolation, future extensibility |
| Money storage | Float vs. Decimal vs. Integer | **Integer (paisa)** | Zero floating-point errors; simple math |
| Inventory tracking | Double-entry vs. simple ledger | **Simple ledger + denormalized stock** | Fast reads, audit trail, appropriate for SME scale |
| Order state machine | Library vs. service-layer validation | **Service-layer enum validation** | No extra deps; simple allowed-transitions map |
| Daily summary | Precomputed table vs. on-demand SQL | **On-demand SQL aggregation** | Instant at SME scale; no cron needed |
| Frontend navigation | Tabs vs. sidebar vs. sectioned top nav | **Sectioned top nav** | Consistent with existing Navbar; mobile-friendly |
| New dependencies | None needed | **Zero new deps** | All requirements met by existing stack |

---

## Implementation Steps

### Phase 1: Data Layer — Models & Migration

1. [ ] Create `backend/app/models/brand.py` — Brand model
2. [ ] Create `backend/app/models/item.py` — Item model
3. [ ] Create `backend/app/models/inventory.py` — InventoryItem + InventoryMovement models
4. [ ] Create `backend/app/models/order.py` — Order + OrderItem models
5. [ ] Create `backend/app/models/transaction.py` — Transaction model
6. [ ] Create `backend/app/models/investment.py` — Investment model
7. [ ] Update `backend/app/models/__init__.py` — register all new models
8. [ ] Create Alembic migration: `003_add_business_management_tables`
9. [ ] Test migration: `alembic upgrade head` on fresh DB

### Phase 2: Schemas

10. [ ] Create `backend/app/schemas/brand.py` — BrandCreate, Brand, BrandList
11. [ ] Create `backend/app/schemas/item.py` — ItemCreate, Item, ItemList
12. [ ] Create `backend/app/schemas/inventory.py` — InventoryItemCreate, InventoryItem, MovementCreate, Movement, LowStockAlert
13. [ ] Create `backend/app/schemas/order.py` — OrderCreate, OrderItemCreate, Order, OrderList, StatusUpdate
14. [ ] Create `backend/app/schemas/transaction.py` — TransactionCreate, Transaction, TransactionList
15. [ ] Create `backend/app/schemas/investment.py` — InvestmentCreate, Investment, InvestmentSummary
16. [ ] Create `backend/app/schemas/summary.py` — DailySummary, RangeSummary, CombinedSummary
17. [ ] Update `backend/app/schemas/__init__.py` — register all new schemas

### Phase 3: Service Layer

18. [ ] Create `backend/app/services/order_service.py` — order number generation, status transitions, total calculation
19. [ ] Create `backend/app/services/inventory_service.py` — stock movement with atomic updates, low stock detection
20. [ ] Create `backend/app/services/summary_service.py` — SQL aggregation queries for daily/range/combined summaries

### Phase 4: API Layer — Shared Dependencies

21. [ ] Create `backend/app/api/deps.py` — add `get_brand_for_user(brand_id, current_user, db)` dependency

### Phase 5: API Layer — Endpoints

22. [ ] Create `backend/app/api/endpoints/brands.py` — CRUD for brands
23. [ ] Create `backend/app/api/endpoints/items.py` — CRUD for items (nested under brand)
24. [ ] Create `backend/app/api/endpoints/inventory.py` — CRUD + movements + alerts
25. [ ] Create `backend/app/api/endpoints/orders.py` — CRUD + status transitions
26. [ ] Create `backend/app/api/endpoints/transactions.py` — CRUD + filtering
27. [ ] Create `backend/app/api/endpoints/investments.py` — CRUD + summary
28. [ ] Create `backend/app/api/endpoints/summary.py` — daily, range, combined
29. [ ] Register all new routers in `backend/app/main.py`

### Phase 6: Frontend — Navigation & Layout

30. [ ] Update `Navbar.jsx` — add Business section (Brands, Orders, Inventory, Transactions)
31. [ ] Update `App.jsx` — add routes for all new pages
32. [ ] Update `services/api.js` — add API functions for all new endpoints

### Phase 7: Frontend — Brand Management

33. [ ] Create `frontend/src/pages/Brands.jsx` — list brands, create brand
34. [ ] Create `frontend/src/pages/BrandDetail.jsx` — brand overview with quick stats

### Phase 8: Frontend — Item Catalog

35. [ ] Create `frontend/src/pages/Items.jsx` — list items by brand, filter by category
36. [ ] Create `frontend/src/components/ItemForm.jsx` — create/edit item form

### Phase 9: Frontend — Inventory

37. [ ] Create `frontend/src/pages/Inventory.jsx` — inventory list, low stock highlights
38. [ ] Create `frontend/src/components/StockMovementForm.jsx` — record purchase/usage/wastage
39. [ ] Create `frontend/src/components/LowStockAlerts.jsx` — alert badges

### Phase 10: Frontend — Orders

40. [ ] Create `frontend/src/pages/Orders.jsx` — order list with status filters, date filters
41. [ ] Create `frontend/src/pages/NewOrder.jsx` — create order with item selection
42. [ ] Create `frontend/src/pages/OrderDetail.jsx` — order detail with status progression
43. [ ] Create `frontend/src/components/OrderStatusBadge.jsx` — colored status badges

### Phase 11: Frontend — Transactions & Investments

44. [ ] Create `frontend/src/pages/Transactions.jsx` — transaction list with type/category filters
45. [ ] Create `frontend/src/components/TransactionForm.jsx` — record income/expense
46. [ ] Create `frontend/src/pages/Investments.jsx` — investment list + summary chart

### Phase 12: Frontend — Daily Summary Dashboard

47. [ ] Create `frontend/src/pages/BusinessDashboard.jsx` — unified dashboard with:
    - Today's key metrics (orders, revenue, expenses, profit)
    - Brand selector / combined view
    - Top-selling items
    - Low stock alerts count
    - Quick action buttons (New Order, Record Expense, Check Inventory)
48. [ ] Create `frontend/src/components/MetricCard.jsx` — reusable stat card
49. [ ] Create `frontend/src/components/DateRangePicker.jsx` — date range selector

### Phase 13: Integration & Polish

50. [ ] End-to-end test: create brands → add items → add inventory → create order → record payment → view summary
51. [ ] Test brand ownership isolation (user A cannot see user B's brands)
52. [ ] Test order status transitions (valid and invalid)
53. [ ] Test low stock alerts
54. [ ] Mobile responsiveness check on all new pages
55. [ ] Update README with new features

---

## New File Inventory

### Backend — Models (6 files)

| File | Purpose |
|------|---------|
| `backend/app/models/brand.py` | Brand entity |
| `backend/app/models/item.py` | Item (product/menu item) entity |
| `backend/app/models/inventory.py` | InventoryItem + InventoryMovement entities |
| `backend/app/models/order.py` | Order + OrderItem entities |
| `backend/app/models/transaction.py` | Transaction entity |
| `backend/app/models/investment.py` | Investment entity |

### Backend — Schemas (7 files)

| File | Purpose |
|------|---------|
| `backend/app/schemas/brand.py` | Brand Pydantic schemas |
| `backend/app/schemas/item.py` | Item Pydantic schemas |
| `backend/app/schemas/inventory.py` | Inventory + Movement schemas |
| `backend/app/schemas/order.py` | Order + OrderItem schemas |
| `backend/app/schemas/transaction.py` | Transaction schemas |
| `backend/app/schemas/investment.py` | Investment schemas |
| `backend/app/schemas/summary.py` | Summary response schemas |

### Backend — Services (3 files)

| File | Purpose |
|------|---------|
| `backend/app/services/order_service.py` | Order number gen, status transitions, totals |
| `backend/app/services/inventory_service.py` | Atomic stock updates, low stock detection |
| `backend/app/services/summary_service.py` | SQL aggregation for summaries |

### Backend — Endpoints (7 files)

| File | Purpose |
|------|---------|
| `backend/app/api/endpoints/brands.py` | Brand CRUD |
| `backend/app/api/endpoints/items.py` | Item CRUD (nested under brand) |
| `backend/app/api/endpoints/inventory.py` | Inventory CRUD + movements + alerts |
| `backend/app/api/endpoints/orders.py` | Order CRUD + status management |
| `backend/app/api/endpoints/transactions.py` | Transaction CRUD |
| `backend/app/api/endpoints/investments.py` | Investment CRUD + summary |
| `backend/app/api/endpoints/summary.py` | Daily/range/combined summaries |

### Backend — Migration (1 file)

| File | Purpose |
|------|---------|
| `backend/alembic/versions/003_add_business_management_tables.py` | Creates all 8 new tables |

### Frontend — Pages (10 files)

| File | Purpose |
|------|---------|
| `frontend/src/pages/Brands.jsx` | Brand list + create |
| `frontend/src/pages/BrandDetail.jsx` | Brand overview |
| `frontend/src/pages/Items.jsx` | Item catalog |
| `frontend/src/pages/Inventory.jsx` | Inventory management |
| `frontend/src/pages/Orders.jsx` | Order list |
| `frontend/src/pages/NewOrder.jsx` | Create order |
| `frontend/src/pages/OrderDetail.jsx` | Order detail + status |
| `frontend/src/pages/Transactions.jsx` | Transaction management |
| `frontend/src/pages/Investments.jsx` | Investment tracking |
| `frontend/src/pages/BusinessDashboard.jsx` | Unified business dashboard |

### Frontend — Components (6 files)

| File | Purpose |
|------|---------|
| `frontend/src/components/ItemForm.jsx` | Create/edit item |
| `frontend/src/components/StockMovementForm.jsx` | Record stock movement |
| `frontend/src/components/LowStockAlerts.jsx` | Low stock alert display |
| `frontend/src/components/OrderStatusBadge.jsx` | Status badge |
| `frontend/src/components/MetricCard.jsx` | Dashboard stat card |
| `frontend/src/components/DateRangePicker.jsx` | Date range selector |
| `frontend/src/components/TransactionForm.jsx` | Record transaction |

**Total new files: ~40**

---

## Migration / Data Impact

**New tables (8):** `brands`, `items`, `inventory_items`, `inventory_movements`, `orders`, `order_items`, `transactions`, `investments`

**Existing tables modified:** None. Zero changes to `users` or `projects`.

**Migration is purely additive** — no risk to existing data. The `brands` table references `users.id` via FK, establishing the only link to existing schema.

**Migration command:**
```bash
docker compose exec contentforge_backend alembic upgrade head
```

**Rollback:** `alembic downgrade -1` drops all 8 new tables. Existing marketing data untouched.

---

## Testing Plan

| Test Type | What to Test | Status |
|-----------|-------------|--------|
| Unit | Order service — status transitions (valid + invalid) | TODO |
| Unit | Order service — order number generation | TODO |
| Unit | Inventory service — atomic stock updates | TODO |
| Unit | Summary service — aggregation queries | TODO |
| Integration | Brand CRUD — create, list, update, soft delete | TODO |
| Integration | Item CRUD — create, list by category, update, soft delete | TODO |
| Integration | Inventory — create, movements, stock calculation, alerts | TODO |
| Integration | Order — create with items, status progression, total calculation | TODO |
| Integration | Transaction — create income/expense, filter by type/date | TODO |
| Integration | Investment — create, summary by category | TODO |
| Integration | Summary — daily, range, combined across brands | TODO |
| Integration | Brand ownership — user cannot access another user's brands | TODO |
| Manual | Full flow: brands → items → inventory → order → payment → summary | TODO |
| Manual | Mobile responsiveness on all new pages | TODO |

---

## Rollback Plan

1. **Revert code** to pre-feature commit
2. **Downgrade migration:** `alembic downgrade -1` (drops all 8 new tables)
3. **Existing data untouched** — `users` and `projects` tables are never modified
4. **Frontend** reverts to original navigation and pages
5. **Zero risk** — this is a purely additive feature

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Navigation Bar                            │   │
│  │  [Dashboard] [Marketing ▼] [Business ▼] [Profile]           │   │
│  │                  │              │                             │   │
│  │           ┌──────┘        ┌─────┘                            │   │
│  │           │               │                                  │   │
│  │     ┌─────────┐    ┌──────────────┐                         │   │
│  │     │Marketing│    │  Business    │                         │   │
│  │     │Dashboard│    │  Dashboard   │                         │   │
│  │     │New Proj │    │  Brands      │                         │   │
│  │     │Projects │    │  Items       │                         │   │
│  │     └─────────┘    │  Inventory   │                         │   │
│  │                    │  Orders      │                         │   │
│  │                    │  Transactions│                         │   │
│  │                    │  Investments │                         │   │
│  │                    └──────────────┘                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │ HTTP (Axios)                         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                      BACKEND (FastAPI)                               │
│                              │                                      │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                    API Routers                                 │  │
│  │                                                               │  │
│  │  EXISTING:              NEW:                                  │  │
│  │  /api/auth/*            /api/brands/*                         │  │
│  │  /api/projects/*        /api/brands/{id}/items/*              │  │
│  │                         /api/brands/{id}/inventory/*          │  │
│  │                         /api/brands/{id}/orders/*             │  │
│  │                         /api/brands/{id}/transactions/*       │  │
│  │                         /api/brands/{id}/investments/*        │  │
│  │                         /api/brands/{id}/summary/*            │  │
│  │                         /api/summary/combined                 │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                    Services                                   │  │
│  │                                                               │  │
│  │  EXISTING:                    NEW:                            │  │
│  │  MarketingAgentService        OrderService                    │  │
│  │  (LangGraph + Claude)         InventoryService                │  │
│  │                               SummaryService                  │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                    Data Layer (SQLAlchemy)                     │  │
│  │                                                               │  │
│  │  EXISTING:          NEW:                                      │  │
│  │  users              brands         orders                     │  │
│  │  projects           items          order_items                │  │
│  │                     inventory_items transactions              │  │
│  │                     inventory_movements investments           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │    PostgreSQL 15     │
                    │  contentforge DB     │
                    └─────────────────────┘
```

---

## Estimated Effort

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1: Models + Migration | 2-3 hours | 6 model files + 1 migration |
| Phase 2: Schemas | 1-2 hours | 7 schema files |
| Phase 3: Services | 2-3 hours | 3 service files with business logic |
| Phase 4-5: API Endpoints | 3-4 hours | 7 router files + deps |
| Phase 6-12: Frontend | 8-12 hours | 10 pages + 7 components + nav updates |
| Phase 13: Integration | 2-3 hours | Testing + polish |
| **Total** | **~18-27 hours** | **~3-4 days of focused work** |

---

## Priority Order (If Time-Constrained)

If you need to ship incrementally, build in this order:

1. **Brands + Items** (foundation — everything depends on this)
2. **Orders** (core daily workflow)
3. **Transactions** (track money)
4. **Daily Summary** (see the big picture)
5. **Inventory** (stock management)
6. **Investments** (long-term tracking)
