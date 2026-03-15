# Research: SME Business Management for Platto & Bakeish

> **Feature Number:** 002
> **Date:** 2026-03-09
> **Status:** Complete

---

## R-1: How to model multi-brand under one user?

**Question:** Should brands be a separate entity or a field on existing models?

**Decision:** Separate `Brand` entity with `user_id` FK. All business entities (items, inventory, orders, transactions) reference `brand_id`. This provides clean data isolation, easy brand-level filtering, and future extensibility (e.g., brand-level settings, logos, themes).

**Alternatives considered:**
- Tag-based approach (brand as a string field) — rejected: no referential integrity, hard to enforce constraints
- Separate databases per brand — rejected: over-engineered for 2 brands, complex migrations

---

## R-2: Currency and financial precision

**Question:** How to handle money without floating-point errors?

**Decision:** Store all monetary values as `Integer` (paisa/cents). 1 INR = 100 paisa. All calculations server-side in integers. Frontend formats for display (`amount / 100`). This avoids floating-point precision issues entirely.

**Schema convention:** All `_amount` columns are `Integer` representing paisa.

---

## R-3: Inventory model — simple vs. double-entry

**Question:** How complex should inventory tracking be?

**Decision:** Simple ledger model. Each `InventoryItem` has a `current_stock` (denormalized for fast reads). Every stock change creates an `InventoryMovement` record (type: PURCHASE, USAGE, WASTAGE, ADJUSTMENT). `current_stock` is updated atomically via SQL `UPDATE ... SET current_stock = current_stock + delta`.

**Alternatives considered:**
- Double-entry bookkeeping — rejected: overkill for ingredient tracking at SME scale
- Event-sourced (compute stock from movements) — rejected: slow reads, unnecessary complexity

---

## R-4: Order lifecycle and status management

**Question:** How to handle order state transitions?

**Decision:** Simple status enum with allowed transitions enforced at the service layer:

```
PENDING → CONFIRMED → IN_PROGRESS → READY → DELIVERED
PENDING → CANCELLED
CONFIRMED → CANCELLED
```

No state machine library needed. Service method validates `(current_status, new_status)` against allowed transitions.

---

## R-5: Daily summary — precomputed vs. on-demand?

**Question:** Should daily summaries be stored or computed on the fly?

**Decision:** Computed on-demand via SQL aggregation queries. At SME scale (tens of orders/day), this is instant. A `DailySummary` endpoint aggregates orders, transactions, and top items for a given date range.

**Future:** If performance degrades, materialize daily summaries into a `daily_summaries` table via a nightly cron.

---

## R-6: How does this coexist with existing marketing features?

**Question:** Does the business management module conflict with existing Project/marketing functionality?

**Decision:** No conflict. The existing `projects` table and marketing agent remain untouched. New entities (`brands`, `items`, `inventory_items`, `orders`, `transactions`, `investments`) are entirely separate. The frontend adds new navigation sections. The backend adds new routers. Zero modification to existing code.

**Architecture:** New modules follow the same layered pattern:
- `models/brand.py`, `models/item.py`, etc.
- `schemas/brand.py`, `schemas/item.py`, etc.
- `api/endpoints/brands.py`, `api/endpoints/items.py`, etc.
- `services/inventory_service.py`, `services/order_service.py`, etc.

---

## R-7: Frontend navigation restructure

**Question:** How to organize the UI for both marketing and business management?

**Decision:** Add a sidebar/top-level navigation with two sections:
1. **Marketing** — existing Dashboard, New Project, Project Detail
2. **Business** — Brands, Items, Inventory, Orders, Transactions, Investments, Daily Summary

The landing page and auth flow remain unchanged. After login, the dashboard becomes a unified home showing key metrics from both domains.

---

## R-8: Database migration strategy

**Question:** How to add 7+ new tables without disrupting existing data?

**Decision:** Single Alembic migration (`003_add_business_management_tables`) that creates all new tables. No modifications to existing `users` or `projects` tables. The migration is purely additive — zero risk to existing data.

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-brand model | Separate `Brand` entity | Clean isolation, FK integrity |
| Money storage | Integer (paisa) | No floating-point errors |
| Inventory tracking | Simple ledger + denormalized stock | Fast reads, audit trail |
| Order state | Enum + service-layer transitions | Simple, no extra deps |
| Daily summary | On-demand SQL aggregation | Sufficient at SME scale |
| Coexistence | Additive modules, no existing code changes | Zero regression risk |
| Navigation | Sectioned nav (Marketing / Business) | Clean separation of concerns |
| Migration | Single additive migration | Safe, reversible |
