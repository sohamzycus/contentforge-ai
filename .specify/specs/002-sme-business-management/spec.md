# Feature Specification: SME Business Management for Platto & Bakeish

> **Feature Number:** 002
> **Created:** 2026-03-09
> **Status:** Draft
> **Priority:** P0 — Core Feature

---

## 1. Problem Statement

The user operates two home-grown food brands — **Platto** (healthy food options) and **Bakeish** (homemade bakery, custom cakes, healthy bakes). As a startup SME, they need a unified platform to manage daily business operations: inventory tracking, item catalogs, order management, financial transactions, investment tracking, and daily business summaries — all from a single, easy-to-maintain interface.

The current ContentForge AI platform only handles marketing content generation. This feature expands it into a **full SME business management suite** while preserving the existing marketing capabilities.

---

## 2. User Personas

| Persona | Description |
|---------|-------------|
| **Brand Owner** | Soham — manages both Platto and Bakeish, needs a single dashboard to track everything |
| **Kitchen Manager** | Tracks inventory levels, flags low stock, manages ingredient procurement |
| **Order Handler** | Receives and fulfills daily orders, tracks order status |

---

## 3. Use Cases

### UC-1: Multi-Brand Management
- User can create and manage multiple brands (Platto, Bakeish) under one account
- Each brand has its own inventory, items, orders, and financials
- Dashboard provides a unified view across brands with brand-level filtering

### UC-2: Item Catalog Management
- User can create items (menu items / products) per brand
- Each item has: name, description, category, unit price, cost price, unit of measure
- Items can be marked active/inactive
- Categories: For Platto (Meals, Snacks, Beverages, Combos); For Bakeish (Cakes, Cupcakes, Cookies, Breads, Custom Orders)

### UC-3: Inventory Management
- Track raw materials / ingredients with current stock levels
- Set minimum stock thresholds — alert when stock is low
- Record stock additions (purchases) and deductions (usage/wastage)
- View inventory movement history

### UC-4: Daily Order Management
- Create orders linked to a brand and customer
- Order contains line items (item + quantity + price)
- Order statuses: Pending → Confirmed → In Progress → Ready → Delivered → Cancelled
- Track order source: Walk-in, Phone, WhatsApp, Instagram DM, Online
- View orders by date, status, brand

### UC-5: Transaction & Payment Tracking
- Record payments against orders (full/partial)
- Payment methods: Cash, UPI, Bank Transfer, Card
- Track expenses (ingredient purchases, utilities, packaging, delivery)
- Categorize transactions: Income, Expense, Investment

### UC-6: Investment Tracking
- Record business investments (equipment, marketing spend, initial capital)
- Track investment date, amount, category, description
- View total invested vs. total revenue

### UC-7: Daily Business Summary
- Auto-generated daily summary per brand and combined
- Metrics: total orders, revenue, expenses, profit/loss, top-selling items
- Date range filtering (today, this week, this month, custom)
- Exportable summary

---

## 4. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | < 500ms for all CRUD operations |
| Data integrity | All financial calculations server-side; no floating point currency |
| Multi-brand isolation | Brand data strictly scoped; no cross-brand data leakage |
| Mobile-friendly | Responsive UI — primary use on mobile/tablet |
| Offline resilience | Graceful degradation; queue operations when offline (future) |

---

## 5. Out of Scope (MVP)

- Multi-user roles / staff accounts
- Barcode / QR scanning
- Automated reorder from suppliers
- Customer CRM / loyalty programs
- Accounting / tax reports
- Offline mode
