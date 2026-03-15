# Data Model: SME Business Management

> **Feature Number:** 002
> **Date:** 2026-03-09
> **Status:** Complete

---

## Entity Relationship Diagram

```
┌──────────┐
│  users   │ (existing — unchanged)
│──────────│
│ id (PK)  │
│ email    │
│ ...      │
└────┬─────┘
     │ 1:N
     ▼
┌──────────────┐     1:N    ┌──────────────────┐
│   brands     │───────────►│     items         │
│──────────────│            │──────────────────│
│ id (PK)      │            │ id (PK)          │
│ user_id (FK) │            │ brand_id (FK)    │
│ name         │            │ name             │
│ description  │            │ category         │
│ type         │            │ unit_price       │
│ is_active    │            │ cost_price       │
│ created_at   │            │ unit             │
│ updated_at   │            │ is_active        │
└──────┬───────┘            │ created_at       │
       │                    │ updated_at       │
       │ 1:N               └────────┬─────────┘
       │                            │
       ├───────────────┐            │ (referenced in order_items)
       │               │            │
       ▼               ▼            ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│inventory_items │  │    orders         │  │  transactions    │
│────────────────│  │──────────────────│  │──────────────────│
│ id (PK)        │  │ id (PK)          │  │ id (PK)          │
│ brand_id (FK)  │  │ brand_id (FK)    │  │ brand_id (FK)    │
│ name           │  │ user_id (FK)     │  │ user_id (FK)     │
│ category       │  │ customer_name    │  │ order_id (FK)?   │
│ unit           │  │ customer_phone   │  │ type             │
│ current_stock  │  │ source           │  │ category         │
│ min_stock      │  │ status           │  │ amount           │
│ cost_per_unit  │  │ total_amount     │  │ payment_method   │
│ created_at     │  │ notes            │  │ description      │
│ updated_at     │  │ created_at       │  │ created_at       │
└───────┬────────┘  │ updated_at       │  └──────────────────┘
        │           └───────┬──────────┘
        │ 1:N               │ 1:N
        ▼                   ▼
┌─────────────────────┐  ┌──────────────────┐
│inventory_movements  │  │   order_items    │
│─────────────────────│  │──────────────────│
│ id (PK)             │  │ id (PK)          │
│ inventory_item_id   │  │ order_id (FK)    │
│ type                │  │ item_id (FK)     │
│ quantity            │  │ quantity         │
│ notes               │  │ unit_price       │
│ created_at          │  │ total_price      │
└─────────────────────┘  └──────────────────┘

┌──────────────────┐
│  investments     │
│──────────────────│
│ id (PK)          │
│ brand_id (FK)    │
│ user_id (FK)     │
│ category         │
│ amount           │
│ description      │
│ invested_at      │
│ created_at       │
└──────────────────┘
```

---

## Entity Definitions

### 1. Brand

Represents a business brand owned by the user (e.g., Platto, Bakeish).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `user_id` | Integer | FK → users.id, NOT NULL | Owner |
| `name` | String(100) | NOT NULL | Brand name |
| `description` | Text | nullable | Brand description |
| `type` | String(50) | NOT NULL | e.g., "food", "bakery" |
| `logo_url` | Text | nullable | Brand logo (base64 or URL) |
| `is_active` | Boolean | default True | Soft delete |
| `created_at` | DateTime(tz) | server_default=now() | |
| `updated_at` | DateTime(tz) | onupdate=now() | |

**Indexes:** `(user_id)`, `(user_id, is_active)`
**Unique:** `(user_id, name)`

---

### 2. Item

A product or menu item sold by a brand.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `brand_id` | Integer | FK → brands.id, NOT NULL | |
| `name` | String(200) | NOT NULL | Item name |
| `description` | Text | nullable | |
| `category` | String(50) | NOT NULL | e.g., "Cakes", "Meals", "Snacks" |
| `unit_price` | Integer | NOT NULL | Selling price in paisa |
| `cost_price` | Integer | nullable | Cost price in paisa |
| `unit` | String(20) | default "piece" | e.g., "piece", "kg", "plate", "slice" |
| `image_url` | Text | nullable | Item photo |
| `is_active` | Boolean | default True | |
| `created_at` | DateTime(tz) | server_default=now() | |
| `updated_at` | DateTime(tz) | onupdate=now() | |

**Indexes:** `(brand_id)`, `(brand_id, category)`, `(brand_id, is_active)`

---

### 3. InventoryItem

Raw materials / ingredients tracked for a brand.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `brand_id` | Integer | FK → brands.id, NOT NULL | |
| `name` | String(200) | NOT NULL | e.g., "All-purpose flour", "Chicken breast" |
| `category` | String(50) | nullable | e.g., "Flour", "Protein", "Dairy", "Packaging" |
| `unit` | String(20) | NOT NULL | e.g., "kg", "litre", "pieces", "packets" |
| `current_stock` | Float | NOT NULL, default 0 | Current quantity in stock |
| `min_stock` | Float | NOT NULL, default 0 | Alert threshold |
| `cost_per_unit` | Integer | nullable | Cost per unit in paisa |
| `created_at` | DateTime(tz) | server_default=now() | |
| `updated_at` | DateTime(tz) | onupdate=now() | |

**Indexes:** `(brand_id)`, `(brand_id, category)`

---

### 4. InventoryMovement

Audit trail for every stock change.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `inventory_item_id` | Integer | FK → inventory_items.id, NOT NULL | |
| `type` | String(20) | NOT NULL | Enum: PURCHASE, USAGE, WASTAGE, ADJUSTMENT |
| `quantity` | Float | NOT NULL | Positive = add, negative = deduct |
| `notes` | Text | nullable | e.g., "Weekly flour purchase" |
| `created_at` | DateTime(tz) | server_default=now() | |

**Indexes:** `(inventory_item_id)`, `(inventory_item_id, created_at)`

---

### 5. Order

A customer order for a brand.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `brand_id` | Integer | FK → brands.id, NOT NULL | |
| `user_id` | Integer | FK → users.id, NOT NULL | Created by |
| `order_number` | String(20) | UNIQUE, NOT NULL | Auto-generated: PLT-20260309-001 |
| `customer_name` | String(200) | nullable | |
| `customer_phone` | String(20) | nullable | |
| `source` | String(20) | NOT NULL, default "WALKIN" | WALKIN, PHONE, WHATSAPP, INSTAGRAM, ONLINE |
| `status` | String(20) | NOT NULL, default "PENDING" | PENDING, CONFIRMED, IN_PROGRESS, READY, DELIVERED, CANCELLED |
| `total_amount` | Integer | NOT NULL, default 0 | Total in paisa |
| `discount_amount` | Integer | NOT NULL, default 0 | Discount in paisa |
| `notes` | Text | nullable | Special instructions |
| `created_at` | DateTime(tz) | server_default=now() | |
| `updated_at` | DateTime(tz) | onupdate=now() | |

**Indexes:** `(brand_id)`, `(brand_id, status)`, `(brand_id, created_at)`, `(user_id)`

---

### 6. OrderItem

Line items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `order_id` | Integer | FK → orders.id, NOT NULL, ON DELETE CASCADE | |
| `item_id` | Integer | FK → items.id, NOT NULL | |
| `quantity` | Integer | NOT NULL | |
| `unit_price` | Integer | NOT NULL | Price at time of order (paisa) |
| `total_price` | Integer | NOT NULL | quantity × unit_price (paisa) |
| `notes` | Text | nullable | e.g., "No sugar", "Extra frosting" |

**Indexes:** `(order_id)`, `(item_id)`

---

### 7. Transaction

Financial record — income, expense, or investment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `brand_id` | Integer | FK → brands.id, NOT NULL | |
| `user_id` | Integer | FK → users.id, NOT NULL | |
| `order_id` | Integer | FK → orders.id, nullable | Link to order (for payments) |
| `type` | String(20) | NOT NULL | INCOME, EXPENSE |
| `category` | String(50) | NOT NULL | e.g., "Order Payment", "Ingredient Purchase", "Packaging", "Delivery", "Utilities" |
| `amount` | Integer | NOT NULL | Amount in paisa (always positive) |
| `payment_method` | String(20) | nullable | CASH, UPI, BANK_TRANSFER, CARD |
| `description` | Text | nullable | |
| `transaction_date` | Date | NOT NULL, default today | |
| `created_at` | DateTime(tz) | server_default=now() | |

**Indexes:** `(brand_id)`, `(brand_id, type)`, `(brand_id, transaction_date)`, `(order_id)`

---

### 8. Investment

Capital and asset investments into the business.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, auto-increment | |
| `brand_id` | Integer | FK → brands.id, NOT NULL | |
| `user_id` | Integer | FK → users.id, NOT NULL | |
| `category` | String(50) | NOT NULL | e.g., "Equipment", "Marketing", "Initial Capital", "Renovation", "Packaging" |
| `amount` | Integer | NOT NULL | Amount in paisa |
| `description` | Text | nullable | |
| `invested_at` | Date | NOT NULL | Date of investment |
| `created_at` | DateTime(tz) | server_default=now() | |

**Indexes:** `(brand_id)`, `(brand_id, invested_at)`

---

## Enum Values Reference

| Enum | Values |
|------|--------|
| **Brand Type** | food, bakery, beverages, other |
| **Item Unit** | piece, kg, g, litre, ml, plate, slice, box, dozen |
| **Inventory Movement Type** | PURCHASE, USAGE, WASTAGE, ADJUSTMENT |
| **Order Source** | WALKIN, PHONE, WHATSAPP, INSTAGRAM, ONLINE |
| **Order Status** | PENDING, CONFIRMED, IN_PROGRESS, READY, DELIVERED, CANCELLED |
| **Transaction Type** | INCOME, EXPENSE |
| **Payment Method** | CASH, UPI, BANK_TRANSFER, CARD |
| **Investment Category** | EQUIPMENT, MARKETING, INITIAL_CAPITAL, RENOVATION, PACKAGING, OTHER |
| **Expense Category** | INGREDIENT_PURCHASE, PACKAGING, DELIVERY, UTILITIES, RENT, SALARY, OTHER |

---

## Order Status Transitions

```
PENDING ──► CONFIRMED ──► IN_PROGRESS ──► READY ──► DELIVERED
  │              │
  └──► CANCELLED ◄┘
```

Only these transitions are valid. The service layer enforces this.

---

## Seed Data (Initial Setup)

### Brands
| Name | Type | Description |
|------|------|-------------|
| Platto | food | Healthy food options — nutritious meals, snacks, and beverages |
| Bakeish | bakery | Homemade bakery — custom cakes, healthy bakes, cookies, breads |

### Default Item Categories
| Brand | Categories |
|-------|-----------|
| Platto | Meals, Snacks, Beverages, Combos, Salads |
| Bakeish | Cakes, Cupcakes, Cookies, Breads, Pastries, Custom Orders |

### Default Inventory Categories
| Category | Examples |
|----------|---------|
| Flour | All-purpose, whole wheat, almond flour |
| Dairy | Milk, butter, cream, cheese, paneer |
| Protein | Chicken, eggs, tofu, lentils |
| Sweetener | Sugar, honey, jaggery, stevia |
| Spices | Salt, pepper, turmeric, cumin |
| Oil & Fat | Olive oil, coconut oil, ghee |
| Vegetables | Seasonal vegetables |
| Fruits | Seasonal fruits |
| Packaging | Boxes, bags, containers, labels |
| Other | Miscellaneous ingredients |
