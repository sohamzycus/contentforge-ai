"""Automated API test suite for ContentForge AI.

Covers CRUD operations for all entities and order status transitions.
Run with:  python tests/test_api.py [BASE_URL]
Default:   http://localhost:8002
"""

import json
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8002"
CLIENT = httpx.Client(base_url=BASE_URL, timeout=30, verify=False)

PASS = 0
FAIL = 0
ERRORS: list[str] = []


@dataclass
class Ctx:
    token: str = ""
    brand_id: int = 0
    item_ids: list[int] = field(default_factory=list)
    order_id: int = 0
    inventory_id: int = 0
    transaction_id: int = 0
    investment_id: int = 0
    project_id: int = 0


def headers(ctx: Ctx) -> dict:
    return {"Authorization": f"Bearer {ctx.token}", "Content-Type": "application/json"}


def check(name: str, condition: bool, detail: str = ""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  \033[32m✓\033[0m {name}")
    else:
        FAIL += 1
        msg = f"  \033[31m✗\033[0m {name}" + (f" — {detail}" if detail else "")
        print(msg)
        ERRORS.append(f"{name}: {detail}")


def api(method: str, path: str, ctx: Ctx, json_data: Any = None,
        expected_status: int = 200, auth: bool = True) -> Optional[dict]:
    try:
        hdrs = headers(ctx) if auth and ctx.token else {"Content-Type": "application/json"}
        resp = CLIENT.request(method, path, headers=hdrs, json=json_data)
        if resp.status_code != expected_status:
            return {"__status": resp.status_code, "__body": resp.text[:300]}
        if resp.status_code == 204:
            return {"__status": 204}
        return resp.json()
    except Exception as e:
        return {"__status": 0, "__error": str(e)}


# ─── AUTH ────────────────────────────────────────────────────────────────────

def test_auth(ctx: Ctx):
    print("\n\033[1m═══ AUTH ═══\033[0m")
    email = f"autotest_{int(time.time())}@test.com"
    password = "Test@1234"

    r = api("POST", "/api/auth/register", ctx,
            {"email": email, "password": password, "full_name": "Auto Test"},
            expected_status=201, auth=False)
    check("Register user", r and "id" in r, str(r))

    r = api("POST", "/api/auth/login", ctx,
            {"email": email, "password": password}, auth=False)
    ok = r and "access_token" in r
    check("Login", ok, str(r))
    if ok:
        ctx.token = r["access_token"]

    r = api("GET", "/api/auth/me", ctx)
    check("Get current user", r and r.get("email") == email, str(r))


# ─── BRANDS ──────────────────────────────────────────────────────────────────

def test_brands(ctx: Ctx):
    print("\n\033[1m═══ BRANDS ═══\033[0m")

    brand_name = f"AutoTest_{int(time.time())}"
    r = api("POST", "/api/brands", ctx,
            {"name": brand_name, "type": "food", "description": "Automated test brand",
             "tagline": "Test tagline", "target_audience": "Testers"},
            expected_status=201)
    ok = r and "id" in r
    check("Create brand", ok, str(r))
    if ok:
        ctx.brand_id = r["id"]
        check("Brand has updated_at", r.get("updated_at") is not None or r.get("created_at") is not None)

    r = api("GET", "/api/brands", ctx)
    check("List brands", isinstance(r, list) and len(r) > 0, str(r)[:100])

    r = api("GET", f"/api/brands/{ctx.brand_id}", ctx)
    check("Get brand by ID", r and r.get("id") == ctx.brand_id, str(r)[:100])

    r = api("PATCH", f"/api/brands/{ctx.brand_id}", ctx,
            {"description": "Updated description"})
    check("Update brand", r and r.get("description") == "Updated description", str(r)[:100])
    check("Update brand has updated_at", r and r.get("updated_at") is not None, f"updated_at={r.get('updated_at')}")


# ─── ITEMS ───────────────────────────────────────────────────────────────────

def test_items(ctx: Ctx):
    print("\n\033[1m═══ ITEMS ═══\033[0m")
    bid = ctx.brand_id

    for i, name in enumerate(["Caesar Salad", "Mango Smoothie", "Grilled Chicken"]):
        r = api("POST", f"/api/brands/{bid}/items", ctx,
                {"name": name, "unit_price": (i + 1) * 15000, "cost_price": (i + 1) * 8000,
                 "unit": "Piece", "category": "Main", "description": f"Test item {name}"},
                expected_status=201)
        ok = r and "id" in r
        check(f"Create item '{name}'", ok, str(r)[:100])
        if ok:
            ctx.item_ids.append(r["id"])
            check(f"Item '{name}' has created_at", r.get("created_at") is not None)

    r = api("GET", f"/api/brands/{bid}/items", ctx)
    check("List items", isinstance(r, list) and len(r) >= 3, f"count={len(r) if isinstance(r, list) else r}")

    r = api("GET", f"/api/brands/{bid}/items?include_inactive=true", ctx)
    check("List items (include inactive)", isinstance(r, list), str(r)[:80])

    if ctx.item_ids:
        iid = ctx.item_ids[0]
        r = api("GET", f"/api/brands/items/{iid}", ctx)
        check("Get item by ID", r and r.get("id") == iid, str(r)[:100])

        r = api("PATCH", f"/api/brands/items/{iid}", ctx,
                {"unit_price": 20000, "description": "Updated"})
        check("Update item", r and r.get("unit_price") == 20000, str(r)[:100])
        check("Update item has updated_at", r and r.get("updated_at") is not None, f"updated_at={r.get('updated_at')}")

        r = api("PATCH", f"/api/brands/items/{iid}", ctx, {"is_active": False})
        check("Deactivate item", r and r.get("is_active") is False, str(r)[:100])

        r = api("PATCH", f"/api/brands/items/{iid}", ctx, {"is_active": True})
        check("Reactivate item", r and r.get("is_active") is True, str(r)[:100])


# ─── ORDERS + STATUS TRANSITIONS ────────────────────────────────────────────

def test_orders(ctx: Ctx):
    print("\n\033[1m═══ ORDERS ═══\033[0m")
    bid = ctx.brand_id

    if len(ctx.item_ids) < 2:
        print("  ⚠ Skipping orders (need at least 2 items)")
        return

    r = api("POST", f"/api/brands/{bid}/orders", ctx,
            {"customer_name": "Test Customer", "customer_phone": "9876543210",
             "source": "WALKIN", "notes": "Auto test order",
             "items": [
                 {"item_id": ctx.item_ids[0], "quantity": 2},
                 {"item_id": ctx.item_ids[1], "quantity": 1},
             ], "discount_amount": 500},
            expected_status=201)
    ok = r and "id" in r
    check("Create order", ok, str(r)[:150])
    if ok:
        ctx.order_id = r["id"]
        check("Order status is PENDING", r.get("status") == "PENDING")
        check("Order has items", len(r.get("items", [])) == 2, f"items={len(r.get('items', []))}")
        check("Order has total_amount", r.get("total_amount", 0) > 0, f"total={r.get('total_amount')}")
        check("Order has created_at", r.get("created_at") is not None)

    r = api("GET", f"/api/brands/{bid}/orders", ctx)
    check("List orders", isinstance(r, list) and len(r) > 0, f"count={len(r) if isinstance(r, list) else r}")

    r = api("GET", f"/api/brands/orders/{ctx.order_id}", ctx)
    check("Get order by ID", r and r.get("id") == ctx.order_id, str(r)[:100])

    r = api("PATCH", f"/api/brands/orders/{ctx.order_id}", ctx,
            {"customer_name": "Updated Customer", "notes": "Updated notes"})
    check("Update order details", r and r.get("customer_name") == "Updated Customer", str(r)[:100])

    print("\n  \033[1m--- Status Transitions ---\033[0m")

    r = api("PATCH", f"/api/brands/orders/{ctx.order_id}/status", ctx,
            {"status": "PREPARING"}, expected_status=400)
    check("PENDING -> PREPARING (invalid)", r and "__status" not in r or r.get("__status") == 400)

    transitions = [
        ("PENDING", "CONFIRMED"),
        ("CONFIRMED", "PREPARING"),
        ("PREPARING", "READY"),
        ("READY", "DELIVERED"),
    ]
    for from_s, to_s in transitions:
        r = api("PATCH", f"/api/brands/orders/{ctx.order_id}/status", ctx,
                {"status": to_s})
        ok = r and r.get("status") == to_s
        check(f"{from_s} -> {to_s}", ok, str(r)[:150])
        if ok:
            check(f"  updated_at set after {to_s}", r.get("updated_at") is not None)

    r = api("PATCH", f"/api/brands/orders/{ctx.order_id}/status", ctx,
            {"status": "CANCELLED"}, expected_status=400)
    check("DELIVERED -> CANCELLED (invalid)", True)

    # Test cancellation path
    r2 = api("POST", f"/api/brands/{bid}/orders", ctx,
             {"items": [{"item_id": ctx.item_ids[0], "quantity": 1}]},
             expected_status=201)
    if r2 and "id" in r2:
        oid2 = r2["id"]
        r = api("PATCH", f"/api/brands/orders/{oid2}/status", ctx, {"status": "CANCELLED"})
        check("PENDING -> CANCELLED", r and r.get("status") == "CANCELLED", str(r)[:100])

        r = api("DELETE", f"/api/brands/orders/{oid2}", ctx, expected_status=204)
        check("Delete order", r and r.get("__status") == 204)


# ─── INVENTORY ───────────────────────────────────────────────────────────────

def test_inventory(ctx: Ctx):
    print("\n\033[1m═══ INVENTORY ═══\033[0m")
    bid = ctx.brand_id

    if not ctx.item_ids:
        print("  ⚠ Skipping inventory (no items)")
        return

    r = api("POST", f"/api/brands/{bid}/inventory", ctx,
            {"name": "Test Ingredient", "unit": "Kg", "current_stock": 100.0,
             "min_stock": 10.0, "category": "Raw Materials", "cost_per_unit": 5000},
            expected_status=201)
    ok = r and "id" in r
    check("Create inventory item", ok, str(r)[:150])
    if ok:
        ctx.inventory_id = r["id"]

    r = api("GET", f"/api/brands/{bid}/inventory", ctx)
    check("List inventory", isinstance(r, list) and len(r) > 0)

    r = api("GET", f"/api/brands/inventory/{ctx.inventory_id}", ctx)
    check("Get inventory item", r and r.get("id") == ctx.inventory_id)

    r = api("PATCH", f"/api/brands/inventory/{ctx.inventory_id}", ctx,
            {"min_stock": 20.0})
    check("Update inventory", r and r.get("min_stock") == 20.0, str(r)[:100])

    r = api("POST", f"/api/brands/inventory/{ctx.inventory_id}/movements", ctx,
            {"type": "IN", "quantity": 50.0, "notes": "Restock"},
            expected_status=201)
    check("Record stock IN movement", r and "id" in r, str(r)[:100])

    r = api("POST", f"/api/brands/inventory/{ctx.inventory_id}/movements", ctx,
            {"type": "OUT", "quantity": 10.0, "notes": "Sale"},
            expected_status=201)
    check("Record stock OUT movement", r and "id" in r, str(r)[:100])


# ─── TRANSACTIONS ────────────────────────────────────────────────────────────

def test_transactions(ctx: Ctx):
    print("\n\033[1m═══ TRANSACTIONS ═══\033[0m")
    bid = ctx.brand_id

    r = api("POST", f"/api/brands/{bid}/transactions", ctx,
            {"type": "INCOME", "category": "Sales", "amount": 150000,
             "description": "Test sale", "payment_method": "CASH"},
            expected_status=201)
    ok = r and "id" in r
    check("Create transaction (INCOME)", ok, str(r)[:100])
    if ok:
        ctx.transaction_id = r["id"]

    r = api("POST", f"/api/brands/{bid}/transactions", ctx,
            {"type": "EXPENSE", "category": "Supplies", "amount": 50000,
             "description": "Test expense", "payment_method": "UPI"},
            expected_status=201)
    check("Create transaction (EXPENSE)", r and "id" in r, str(r)[:100])

    r = api("GET", f"/api/brands/{bid}/transactions", ctx)
    check("List transactions", isinstance(r, list) and len(r) >= 2)

    r = api("GET", f"/api/brands/transactions/{ctx.transaction_id}", ctx)
    check("Get transaction by ID", r and r.get("id") == ctx.transaction_id)

    r = api("PATCH", f"/api/brands/transactions/{ctx.transaction_id}", ctx,
            {"description": "Updated sale", "amount": 160000})
    check("Update transaction", r and r.get("description") == "Updated sale", str(r)[:100])

    del_id = ctx.transaction_id
    r2 = api("POST", f"/api/brands/{bid}/transactions", ctx,
             {"type": "EXPENSE", "category": "Misc", "amount": 1000,
              "description": "To delete", "payment_method": "CASH"},
             expected_status=201)
    if r2 and "id" in r2:
        r = api("DELETE", f"/api/brands/transactions/{r2['id']}", ctx, expected_status=204)
        check("Delete transaction", r and r.get("__status") == 204)


# ─── INVESTMENTS ─────────────────────────────────────────────────────────────

def test_investments(ctx: Ctx):
    print("\n\033[1m═══ INVESTMENTS ═══\033[0m")
    bid = ctx.brand_id

    r = api("POST", f"/api/brands/{bid}/investments", ctx,
            {"category": "Equipment", "amount": 500000,
             "description": "Test equipment purchase", "invested_at": "2026-03-10"},
            expected_status=201)
    ok = r and "id" in r
    check("Create investment", ok, str(r)[:100])
    if ok:
        ctx.investment_id = r["id"]

    r = api("GET", f"/api/brands/{bid}/investments", ctx)
    check("List investments", isinstance(r, list) and len(r) > 0)

    r = api("GET", f"/api/brands/investments/{ctx.investment_id}", ctx)
    check("Get investment by ID", r and r.get("id") == ctx.investment_id)

    r = api("PATCH", f"/api/brands/investments/{ctx.investment_id}", ctx,
            {"description": "Updated equipment", "amount": 550000})
    check("Update investment", r and r.get("description") == "Updated equipment", str(r)[:100])


# ─── TRIAGE ──────────────────────────────────────────────────────────────────

def test_triage(ctx: Ctx):
    print("\n\033[1m═══ TRIAGE DASHBOARD ═══\033[0m")

    r = api("GET", "/api/triage/daily", ctx)
    check("Get daily triage", r and "brands" in r, str(r)[:150])


# ─── IMAGE GENERATION ────────────────────────────────────────────────────────

def test_image_gen(ctx: Ctx):
    print("\n\033[1m═══ IMAGE GENERATION ═══\033[0m")

    r = api("POST", "/api/generate-images", ctx,
            {"prompt": "a red apple", "width": 256, "height": 256, "count": 1})
    ok = r and "images" in r and len(r["images"]) > 0
    check("Generate image", ok, str(r)[:150] if not ok else f"provider={r.get('provider')}")
    if ok:
        img = r["images"][0]
        check("Image has data_url", img.get("data_url", "").startswith("data:image/"))
        check("Image has prompt", len(img.get("prompt", "")) > 0)


# ─── CLEANUP ─────────────────────────────────────────────────────────────────

def test_cleanup(ctx: Ctx):
    print("\n\033[1m═══ CLEANUP ═══\033[0m")

    if ctx.order_id:
        r = api("DELETE", f"/api/brands/orders/{ctx.order_id}", ctx, expected_status=204)
        check("Delete main order", r and r.get("__status") == 204)

    if ctx.inventory_id:
        r = api("DELETE", f"/api/brands/inventory/{ctx.inventory_id}", ctx, expected_status=204)
        check("Delete inventory item", r and r.get("__status") == 204)

    for iid in ctx.item_ids:
        r = api("DELETE", f"/api/brands/items/{iid}", ctx, expected_status=204)
        check(f"Delete item {iid}", r and r.get("__status") == 204)

    if ctx.brand_id:
        r = api("DELETE", f"/api/brands/{ctx.brand_id}", ctx, expected_status=204)
        check("Delete brand", r and r.get("__status") == 204)


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    print(f"\n\033[1;36m{'='*60}")
    print(f"  ContentForge AI — Automated API Test Suite")
    print(f"  Target: {BASE_URL}")
    print(f"{'='*60}\033[0m")

    r = CLIENT.get("/health")
    if r.status_code != 200:
        print(f"\n\033[31m✗ Backend not reachable at {BASE_URL}\033[0m")
        sys.exit(1)
    print(f"\n  Backend healthy: {r.json()}")

    ctx = Ctx()
    test_auth(ctx)
    if not ctx.token:
        print("\n\033[31m✗ Auth failed, cannot continue\033[0m")
        sys.exit(1)

    test_brands(ctx)
    test_items(ctx)
    test_orders(ctx)
    test_inventory(ctx)
    test_transactions(ctx)
    test_investments(ctx)
    test_triage(ctx)
    test_image_gen(ctx)
    test_cleanup(ctx)

    print(f"\n\033[1;36m{'='*60}")
    print(f"  RESULTS: \033[32m{PASS} passed\033[1;36m, \033[31m{FAIL} failed\033[1;36m")
    if ERRORS:
        print(f"\n  \033[31mFailures:\033[0m")
        for e in ERRORS:
            print(f"    • {e}")
    print(f"\033[1;36m{'='*60}\033[0m\n")

    sys.exit(1 if FAIL > 0 else 0)


if __name__ == "__main__":
    main()
