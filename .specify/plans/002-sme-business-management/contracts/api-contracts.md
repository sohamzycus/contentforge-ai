# API Contracts: SME Business Management

> **Feature Number:** 002
> **Date:** 2026-03-09
> **Base URL:** `http://localhost:8002`
> **Auth:** All endpoints require `Authorization: Bearer <token>` unless noted

---

## 1. Brands API — `/api/brands`

### POST `/api/brands` — Create Brand

**Request:**
```json
{
  "name": "Platto",
  "description": "Healthy food options — nutritious meals, snacks, and beverages",
  "type": "food"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Platto",
  "description": "Healthy food options — nutritious meals, snacks, and beverages",
  "type": "food",
  "logo_url": null,
  "is_active": true,
  "created_at": "2026-03-09T10:00:00Z",
  "updated_at": null
}
```

### GET `/api/brands` — List User's Brands

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Platto",
    "type": "food",
    "is_active": true,
    "created_at": "2026-03-09T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Bakeish",
    "type": "bakery",
    "is_active": true,
    "created_at": "2026-03-09T10:01:00Z"
  }
]
```

### GET `/api/brands/{brand_id}` — Get Brand Detail

**Response:** `200 OK` — Full brand object (same as create response)

### PUT `/api/brands/{brand_id}` — Update Brand

**Request:** Partial update (any fields)
```json
{
  "description": "Updated description"
}
```

**Response:** `200 OK` — Updated brand object

### DELETE `/api/brands/{brand_id}` — Soft Delete Brand

**Response:** `204 No Content`

---

## 2. Items API — `/api/brands/{brand_id}/items`

### POST `/api/brands/{brand_id}/items` — Create Item

**Request:**
```json
{
  "name": "Grilled Chicken Bowl",
  "description": "Brown rice, grilled chicken, veggies, peanut sauce",
  "category": "Meals",
  "unit_price": 25000,
  "cost_price": 12000,
  "unit": "plate"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "brand_id": 1,
  "name": "Grilled Chicken Bowl",
  "description": "Brown rice, grilled chicken, veggies, peanut sauce",
  "category": "Meals",
  "unit_price": 25000,
  "cost_price": 12000,
  "unit": "plate",
  "image_url": null,
  "is_active": true,
  "created_at": "2026-03-09T10:05:00Z",
  "updated_at": null
}
```

**Note:** `unit_price` and `cost_price` are in **paisa** (25000 = ₹250.00)

### GET `/api/brands/{brand_id}/items` — List Items

**Query params:** `?category=Meals&active_only=true`

**Response:** `200 OK` — Array of item objects

### GET `/api/brands/{brand_id}/items/{item_id}` — Get Item

**Response:** `200 OK` — Item object

### PUT `/api/brands/{brand_id}/items/{item_id}` — Update Item

**Response:** `200 OK` — Updated item object

### DELETE `/api/brands/{brand_id}/items/{item_id}` — Soft Delete Item

**Response:** `204 No Content`

---

## 3. Inventory API — `/api/brands/{brand_id}/inventory`

### POST `/api/brands/{brand_id}/inventory` — Create Inventory Item

**Request:**
```json
{
  "name": "All-purpose Flour",
  "category": "Flour",
  "unit": "kg",
  "current_stock": 10.0,
  "min_stock": 2.0,
  "cost_per_unit": 5500
}
```

**Response:** `201 Created` — Inventory item object

### GET `/api/brands/{brand_id}/inventory` — List Inventory

**Query params:** `?category=Flour&low_stock=true`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "brand_id": 2,
    "name": "All-purpose Flour",
    "category": "Flour",
    "unit": "kg",
    "current_stock": 10.0,
    "min_stock": 2.0,
    "cost_per_unit": 5500,
    "is_low_stock": false,
    "created_at": "2026-03-09T10:10:00Z"
  }
]
```

### PUT `/api/brands/{brand_id}/inventory/{inventory_id}` — Update Inventory Item

**Response:** `200 OK` — Updated inventory item

### POST `/api/brands/{brand_id}/inventory/{inventory_id}/movements` — Record Stock Movement

**Request:**
```json
{
  "type": "PURCHASE",
  "quantity": 5.0,
  "notes": "Weekly flour restock from Metro"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "inventory_item_id": 1,
  "type": "PURCHASE",
  "quantity": 5.0,
  "notes": "Weekly flour restock from Metro",
  "new_stock": 15.0,
  "created_at": "2026-03-09T11:00:00Z"
}
```

### GET `/api/brands/{brand_id}/inventory/{inventory_id}/movements` — Movement History

**Query params:** `?type=PURCHASE&from_date=2026-03-01&to_date=2026-03-09`

**Response:** `200 OK` — Array of movement objects

### GET `/api/brands/{brand_id}/inventory/alerts` — Low Stock Alerts

**Response:** `200 OK`
```json
[
  {
    "id": 3,
    "name": "Butter",
    "unit": "kg",
    "current_stock": 0.5,
    "min_stock": 1.0,
    "deficit": 0.5
  }
]
```

---

## 4. Orders API — `/api/brands/{brand_id}/orders`

### POST `/api/brands/{brand_id}/orders` — Create Order

**Request:**
```json
{
  "customer_name": "Priya Sharma",
  "customer_phone": "9876543210",
  "source": "WHATSAPP",
  "notes": "Birthday cake — no fondant",
  "items": [
    { "item_id": 5, "quantity": 1, "notes": "Chocolate flavor, write 'Happy Birthday Raj'" },
    { "item_id": 8, "quantity": 12, "notes": null }
  ],
  "discount_amount": 5000
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "brand_id": 2,
  "order_number": "BKS-20260309-001",
  "customer_name": "Priya Sharma",
  "customer_phone": "9876543210",
  "source": "WHATSAPP",
  "status": "PENDING",
  "total_amount": 95000,
  "discount_amount": 5000,
  "net_amount": 90000,
  "notes": "Birthday cake — no fondant",
  "items": [
    {
      "id": 1,
      "item_id": 5,
      "item_name": "Custom Cake (1kg)",
      "quantity": 1,
      "unit_price": 80000,
      "total_price": 80000,
      "notes": "Chocolate flavor, write 'Happy Birthday Raj'"
    },
    {
      "id": 2,
      "item_id": 8,
      "item_name": "Chocolate Cupcake",
      "quantity": 12,
      "unit_price": 15000,
      "total_price": 15000,
      "notes": null
    }
  ],
  "created_at": "2026-03-09T14:00:00Z"
}
```

### GET `/api/brands/{brand_id}/orders` — List Orders

**Query params:** `?status=PENDING&date=2026-03-09&source=WHATSAPP&skip=0&limit=20`

**Response:** `200 OK` — Array of order summary objects

### GET `/api/brands/{brand_id}/orders/{order_id}` — Get Order Detail

**Response:** `200 OK` — Full order with items

### PATCH `/api/brands/{brand_id}/orders/{order_id}/status` — Update Order Status

**Request:**
```json
{
  "status": "CONFIRMED"
}
```

**Response:** `200 OK` — Updated order

**Error (invalid transition):** `400 Bad Request`
```json
{
  "detail": "Cannot transition from DELIVERED to PENDING"
}
```

### DELETE `/api/brands/{brand_id}/orders/{order_id}` — Cancel Order

Sets status to CANCELLED. Only allowed from PENDING or CONFIRMED.

**Response:** `200 OK` — Updated order with status CANCELLED

---

## 5. Transactions API — `/api/brands/{brand_id}/transactions`

### POST `/api/brands/{brand_id}/transactions` — Record Transaction

**Request (expense):**
```json
{
  "type": "EXPENSE",
  "category": "Ingredient Purchase",
  "amount": 250000,
  "payment_method": "UPI",
  "description": "Weekly flour and butter from Metro",
  "transaction_date": "2026-03-09"
}
```

**Request (income — order payment):**
```json
{
  "type": "INCOME",
  "category": "Order Payment",
  "amount": 90000,
  "payment_method": "CASH",
  "order_id": 1,
  "description": "Payment for order BKS-20260309-001",
  "transaction_date": "2026-03-09"
}
```

**Response:** `201 Created` — Transaction object

### GET `/api/brands/{brand_id}/transactions` — List Transactions

**Query params:** `?type=EXPENSE&category=Ingredient+Purchase&from_date=2026-03-01&to_date=2026-03-09&skip=0&limit=50`

**Response:** `200 OK` — Array of transaction objects

### GET `/api/brands/{brand_id}/transactions/{transaction_id}` — Get Transaction

**Response:** `200 OK` — Transaction object

### DELETE `/api/brands/{brand_id}/transactions/{transaction_id}` — Delete Transaction

**Response:** `204 No Content`

---

## 6. Investments API — `/api/brands/{brand_id}/investments`

### POST `/api/brands/{brand_id}/investments` — Record Investment

**Request:**
```json
{
  "category": "Equipment",
  "amount": 1500000,
  "description": "Commercial oven — Morphy Richards OTG 52L",
  "invested_at": "2026-02-15"
}
```

**Response:** `201 Created` — Investment object

### GET `/api/brands/{brand_id}/investments` — List Investments

**Query params:** `?category=Equipment&from_date=2026-01-01`

**Response:** `200 OK` — Array of investment objects

### GET `/api/brands/{brand_id}/investments/summary` — Investment Summary

**Response:** `200 OK`
```json
{
  "total_invested": 5500000,
  "by_category": {
    "Equipment": 3000000,
    "Marketing": 1000000,
    "Initial Capital": 1500000
  }
}
```

### DELETE `/api/brands/{brand_id}/investments/{investment_id}` — Delete Investment

**Response:** `204 No Content`

---

## 7. Daily Summary API — `/api/brands/{brand_id}/summary`

### GET `/api/brands/{brand_id}/summary/daily` — Daily Summary

**Query params:** `?date=2026-03-09` (defaults to today)

**Response:** `200 OK`
```json
{
  "date": "2026-03-09",
  "brand_id": 2,
  "brand_name": "Bakeish",
  "orders": {
    "total": 8,
    "by_status": {
      "DELIVERED": 5,
      "IN_PROGRESS": 2,
      "PENDING": 1
    },
    "by_source": {
      "WHATSAPP": 4,
      "INSTAGRAM": 2,
      "WALKIN": 2
    }
  },
  "revenue": {
    "total_income": 450000,
    "total_expenses": 120000,
    "net_profit": 330000
  },
  "top_items": [
    { "item_name": "Chocolate Cake (1kg)", "quantity_sold": 3, "revenue": 240000 },
    { "item_name": "Cupcake Box (6)", "quantity_sold": 5, "revenue": 150000 }
  ],
  "low_stock_alerts": 2
}
```

### GET `/api/brands/{brand_id}/summary/range` — Date Range Summary

**Query params:** `?from_date=2026-03-01&to_date=2026-03-09`

**Response:** `200 OK`
```json
{
  "from_date": "2026-03-01",
  "to_date": "2026-03-09",
  "brand_id": 2,
  "brand_name": "Bakeish",
  "total_orders": 52,
  "total_income": 3200000,
  "total_expenses": 980000,
  "total_investments": 0,
  "net_profit": 2220000,
  "average_order_value": 61538,
  "top_items": [...],
  "daily_breakdown": [
    { "date": "2026-03-01", "orders": 6, "income": 380000, "expenses": 120000 },
    ...
  ]
}
```

### GET `/api/summary/combined` — Combined Summary (All Brands)

**Query params:** `?from_date=2026-03-01&to_date=2026-03-09`

**Response:** `200 OK`
```json
{
  "from_date": "2026-03-01",
  "to_date": "2026-03-09",
  "brands": [
    {
      "brand_id": 1,
      "brand_name": "Platto",
      "total_orders": 35,
      "total_income": 2100000,
      "total_expenses": 650000,
      "net_profit": 1450000
    },
    {
      "brand_id": 2,
      "brand_name": "Bakeish",
      "total_orders": 52,
      "total_income": 3200000,
      "total_expenses": 980000,
      "net_profit": 2220000
    }
  ],
  "combined": {
    "total_orders": 87,
    "total_income": 5300000,
    "total_expenses": 1630000,
    "total_investments": 5500000,
    "net_profit": 3670000
  }
}
```

---

## Error Responses (Consistent)

All errors follow:
```json
{
  "detail": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / invalid state transition |
| 401 | Missing or invalid token |
| 403 | Brand does not belong to user |
| 404 | Resource not found |
| 422 | Validation error (Pydantic) |
| 500 | Internal server error |

---

## Brand Ownership Guard

Every brand-scoped endpoint validates that `brand.user_id == current_user.id`. Returns `403 Forbidden` if the brand belongs to another user. This is implemented as a shared dependency (`get_brand_for_user`).
