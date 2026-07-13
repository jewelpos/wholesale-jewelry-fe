# Enforce Stock Check on Invoice — Owner Guide

## What This Setting Does

When **Enforce Stock Check on Invoice** is turned ON, the system will **block** saving a new invoice if any item does not have enough stock on hand to fulfill the requested quantity.

By default this setting is **OFF** — invoices save freely and stock can go negative (useful when you allow backorders or don't track inventory tightly).

---

## How to Turn It On

1. Go to **System Settings → Store Settings** (Warehouse Settings section)
2. Select your warehouse from the left list
3. Under **General Settings**, check **"Enforce Stock Check on Invoice"**
4. Click **Save Settings**

The setting is per-warehouse. If you have multiple warehouses, configure each one separately.

---

## What Happens When Stock Is Insufficient

When the setting is ON and a user tries to save an invoice:

- The system checks every line item that has **Track Inventory** enabled
- If any item has less stock on hand than the requested quantity, the invoice is **rejected**
- The error message lists **every failing item** at once so the user can fix them all in one go:

  > Insufficient stock for: RING-001 (available: 3, requested: 5); BRAC-042 (available: 0, requested: 2)

The invoice is not saved until all stock issues are resolved.

---

## Two-Level Control Matrix

| Store Setting | Item Track Inventory | Result |
|---|---|---|
| OFF | any | Invoice always saves (no stock check) |
| ON | OFF (0) | Item is skipped — never blocked |
| ON | ON (1, default) | Item is checked — blocked if insufficient |

To opt a specific SKU out of stock enforcement (e.g., a service item or special order), set **Track Inventory = No** on that product's record.

---

## Concurrency Safety

The check uses a **SELECT FOR UPDATE** database lock, meaning if two users try to sell the same item simultaneously, they cannot both pass the check on the same units. The second save will see the updated (post-first-sale) quantity.

---

## When to Use This

| Use Case | Recommendation |
|---|---|
| Jewelry store with physical inventory you count | Turn ON |
| Store that allows backorders / special orders | Leave OFF |
| Mixed — most items tracked, a few are services | Turn ON + set Track Inventory = No on service items |

---

## Invoice Number Race Condition (Planned)

A PostgreSQL **SEQUENCE** for invoice numbers is planned (deferred). Until then, invoice numbers use MAX+1 — two simultaneous invoices could theoretically get the same number under high concurrency. In practice this is extremely rare for most stores.
