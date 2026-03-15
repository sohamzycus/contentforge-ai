# Quickstart: SME Business Management — Integration Scenarios

> **Feature Number:** 002
> **Date:** 2026-03-09

---

## Scenario 1: First-Time Setup — Creating Brands

After registering and logging in, the user sets up their two brands.

```bash
# 1. Register (existing flow)
curl -X POST http://localhost:8002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "soham@example.com", "password": "securepass123", "full_name": "Soham Niyogi"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "soham@example.com", "password": "securepass123"}' | jq -r '.access_token')

# 3. Create Platto brand
curl -X POST http://localhost:8002/api/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platto",
    "description": "Healthy food options — nutritious meals, snacks, and beverages",
    "type": "food"
  }'

# 4. Create Bakeish brand
curl -X POST http://localhost:8002/api/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bakeish",
    "description": "Homemade bakery — expert in custom cakes, healthy bakes, cookies, breads",
    "type": "bakery"
  }'
```

---

## Scenario 2: Setting Up Item Catalog for Bakeish

```bash
BRAND_ID=2  # Bakeish

# Add items
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Cake (1kg)",
    "description": "Freshly baked custom cake with your choice of flavor and design",
    "category": "Cakes",
    "unit_price": 80000,
    "cost_price": 35000,
    "unit": "piece"
  }'

curl -X POST http://localhost:8002/api/brands/$BRAND_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chocolate Cupcake",
    "description": "Rich chocolate cupcake with buttercream frosting",
    "category": "Cupcakes",
    "unit_price": 12000,
    "cost_price": 5000,
    "unit": "piece"
  }'

curl -X POST http://localhost:8002/api/brands/$BRAND_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sourdough Bread Loaf",
    "description": "Artisan sourdough bread, slow-fermented 24 hours",
    "category": "Breads",
    "unit_price": 25000,
    "cost_price": 8000,
    "unit": "piece"
  }'
```

---

## Scenario 3: Setting Up Inventory for Bakeish

```bash
BRAND_ID=2

# Add flour
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "All-purpose Flour",
    "category": "Flour",
    "unit": "kg",
    "current_stock": 10.0,
    "min_stock": 3.0,
    "cost_per_unit": 5500
  }'

# Add butter
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unsalted Butter",
    "category": "Dairy",
    "unit": "kg",
    "current_stock": 2.0,
    "min_stock": 1.0,
    "cost_per_unit": 55000
  }'

# Record a purchase (stock movement)
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/inventory/1/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PURCHASE",
    "quantity": 5.0,
    "notes": "Bought from Metro Cash & Carry"
  }'

# Record usage
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/inventory/1/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "USAGE",
    "quantity": -2.5,
    "notes": "Used for 3 custom cakes"
  }'

# Check low stock alerts
curl http://localhost:8002/api/brands/$BRAND_ID/inventory/alerts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Scenario 4: Taking a Daily Order (Bakeish)

A customer orders a custom cake and cupcakes via WhatsApp.

```bash
BRAND_ID=2

# Create order
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Priya Sharma",
    "customer_phone": "9876543210",
    "source": "WHATSAPP",
    "notes": "Birthday cake — chocolate flavor, write Happy Birthday Raj",
    "items": [
      { "item_id": 1, "quantity": 1, "notes": "Chocolate, no fondant" },
      { "item_id": 2, "quantity": 6, "notes": "Assorted flavors" }
    ],
    "discount_amount": 0
  }'

# Confirm the order
curl -X PATCH http://localhost:8002/api/brands/$BRAND_ID/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

# Start preparation
curl -X PATCH http://localhost:8002/api/brands/$BRAND_ID/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# Mark ready
curl -X PATCH http://localhost:8002/api/brands/$BRAND_ID/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "READY"}'

# Mark delivered
curl -X PATCH http://localhost:8002/api/brands/$BRAND_ID/orders/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "DELIVERED"}'
```

---

## Scenario 5: Recording Payments and Expenses

```bash
BRAND_ID=2

# Record payment for the order
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCOME",
    "category": "Order Payment",
    "amount": 152000,
    "payment_method": "UPI",
    "order_id": 1,
    "description": "Payment for order BKS-20260309-001",
    "transaction_date": "2026-03-09"
  }'

# Record an expense
curl -X POST http://localhost:8002/api/brands/$BRAND_ID/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "category": "Ingredient Purchase",
    "amount": 250000,
    "payment_method": "CASH",
    "description": "Weekly flour, butter, sugar from Metro",
    "transaction_date": "2026-03-09"
  }'
```

---

## Scenario 6: Recording an Investment

```bash
BRAND_ID=2

curl -X POST http://localhost:8002/api/brands/$BRAND_ID/investments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Equipment",
    "amount": 1500000,
    "description": "Commercial OTG Oven — Morphy Richards 52L",
    "invested_at": "2026-02-15"
  }'
```

---

## Scenario 7: Viewing Daily Summary

```bash
# Daily summary for Bakeish
curl "http://localhost:8002/api/brands/2/summary/daily?date=2026-03-09" \
  -H "Authorization: Bearer $TOKEN"

# Weekly range summary for Platto
curl "http://localhost:8002/api/brands/1/summary/range?from_date=2026-03-03&to_date=2026-03-09" \
  -H "Authorization: Bearer $TOKEN"

# Combined summary across all brands
curl "http://localhost:8002/api/summary/combined?from_date=2026-03-01&to_date=2026-03-09" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Frontend User Flows

### Flow 1: Daily Morning Routine
1. Login → Dashboard shows today's summary for both brands
2. Check low stock alerts → tap to restock (record purchase movement)
3. View pending orders → update statuses as work progresses

### Flow 2: New Order (WhatsApp)
1. Navigate to Bakeish → Orders → New Order
2. Select customer (or type name/phone)
3. Add items from catalog, set quantities, add notes
4. Save → order created as PENDING
5. Update status through the day: CONFIRMED → IN_PROGRESS → READY → DELIVERED
6. Record payment when customer pays

### Flow 3: End-of-Day Review
1. Navigate to Daily Summary
2. Select brand or "All Brands"
3. Review: orders completed, revenue, expenses, profit
4. Check top-selling items
5. Record any pending expenses (packaging, delivery)

### Flow 4: Monthly Investment Review
1. Navigate to Bakeish → Investments
2. View total invested by category
3. Compare against revenue from Daily Summary (range: this month)
4. Assess ROI
