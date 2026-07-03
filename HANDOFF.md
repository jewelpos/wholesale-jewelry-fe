# Product List Performance — Session Handoff

**Date:** 2026-06-26  
**Branch:** `main` (both repos)

---

## What Was Done This Session

### Problem
Product list was slow for large jewelry store catalogs (20–30K items per outlet). First page load could take several seconds.

### Root Causes Fixed

| # | Cause | Fix |
|---|-------|-----|
| 1 | `vw_product_list` view filtered by `outletid` AFTER joining all outlets | Replaced with `fn_get_product_list(p_outletid INT)` — filter is in the JOIN condition, planner uses it before any other work |
| 2 | `SUM() OVER (PARTITION BY itemcode)` window function forced full catalog scan before LIMIT | Replaced with a per-item LATERAL on `inventoryitemstocks` — LIMIT can now push down, first page only loads 20 rows |
| 3 | Heavy sold/purchase aggregate LATERALs running per-item across all 20K items | Stripped from the list function; returned as NULLs. Moved to on-demand `getProductStats` query |
| 4 | `itemunit` was a correlated subquery (N+1, 20K individual queries) | Replaced with direct column from `inventoryitems` |
| 5 | `hasbulkdiscount` / `haspromotion` required 3 extra post-fetch round-trips | Inlined as LATERAL EXISTS subqueries in the function |
| 6 | No indexes on join columns | 13 indexes added in migration `CreateProductListFunction1750000000022` |

---

## Current Architecture

### Backend Function: `fn_get_product_list(p_outletid INT)`

**Execution path:**
```
inventoryitemstocks
  JOIN warehouses (outletid = p_outletid)   ← early outlet filter, uses idx_warehouses_outletid
  JOIN inventoryitems                        ← uses idx_iis_itemid
  LEFT JOIN itemcategory, itemsubcategory, supplier, users (cu, au)
  LEFT JOIN LATERAL overall_qty              ← SUM from iis for this itemid only
  LEFT JOIN LATERAL lastsaledate             ← MAX only, uses idx_invoiceitems_itemcode
  LEFT JOIN LATERAL memoqty                  ← active memo rows only
  LEFT JOIN LATERAL soquantity               ← active SO rows only
  LEFT JOIN LATERAL lastpurchasedate         ← MAX only, uses idx_poitems_itemcode
  LEFT JOIN LATERAL hastransactions          ← EXISTS check, stops at first match
  LEFT JOIN LATERAL hasbulkdiscount          ← EXISTS, uses idx_bulkdiscounts_itemid
  LEFT JOIN LATERAL haspromotion             ← EXISTS, uses idx_promositems_itemid
```

**Columns returning NULL (moved to on-demand):**
- `totalsoldqty`, `pcssold`, `totalsoldvalue`, `totalsoldcost`, `totalsoldprofit`
- `qtypurchased`, `avgpurchasecost`

### New: `getProductStats(itemcode, outletid)` Query

Single-item analytics fetched on demand. Runs two parallel queries:
1. Sold stats from `invoiceitems JOIN invoice` — full SUM aggregates for one item
2. Purchase stats from `purchaseorderitems JOIN purchaseorderitemreceived` — MAX + SUM + AVG for one item

### Frontend: ProductDrawer Analytics Section

- Existing **Eye icon → ProductDrawer** already shows pricing + inventory stats
- New **"Sales Analytics"** section at the bottom of the drawer
- Has a **Load** button — stats are NOT auto-fetched (lazy on click)
- Manager-only fields (cost, profit, avg cost) hidden for cashier role
- Uses `cache-first` Apollo policy — subsequent opens of same item are instant

---

## Files Changed This Session

### Backend (`wholesale-backend`)

| File | Change |
|------|--------|
| `src/entities/migrations/tenant-migrations.ts` | Added `OptimizeProductListFunction1750000000023` (new function + `hastransactions`) |
| `src/database/database.service.ts` | Registered new migration |
| `src/store/store.service.ts` | Added `getProductStats()` method |
| `src/store/store.graphql` | Added `ProductStats` type + `getProductStats` query + `hastransactions` field on `ProductListNew` |
| `src/graphql.ts` | Added `ProductStats` class + abstract method + `hastransactions` field |
| `src/store/store.queries.resolver.ts` | Added `getProductStats` resolver |

### Frontend (`wholesale-frontend`)

| File | Change |
|------|--------|
| `src/types/product.ts` | Added `hastransactions?: boolean` to `ProductListType` |
| `src/lib/graphql/query/products.ts` | Added `GET_PRODUCT_STATS_QUERY`; added `hastransactions` to `GET_PRODUCT_LIST_QUERY` |
| `src/components/ui/products/productView/ProductDrawer.tsx` | Added lazy Sales Analytics section |
| `src/components/ui/products/list/ProductActions.tsx` | Updated `hasTransactions` guard to use `data.hastransactions` flag |

Also fixed earlier this session (committed separately):

| File | Change |
|------|--------|
| `src/components/ui/grid/POSGrid.tsx` | Memoized `effectiveDefaultColDef` to fix AG Grid `getColDef() null` crash |
| `src/components/ui/products/list/columnDef.tsx` | Wrapped `params.success()` in try-catch to fix "Virtual list has not been created" crash |

---

## Migrations Status

| Migration | Status |
|-----------|--------|
| `CreateProductListFunction1750000000022` | ✅ Deployed on `jewelpos_w478` |
| `OptimizeProductListFunction1750000000023` | ⏳ **Committed but NOT deployed** — needs backend push + server restart |

---

## Pending Actions

### 1. Deploy Backend (requires manual step)

Backend commit `3979a74` is local only — push was blocked pending explicit consent.

```bash
# On local machine
git push origin main

# On DigitalOcean droplet
cd /path/to/wholesale-backend
git pull
kill <PID>
nohup node dist/main.js > backend.log 2>&1 &
```

The migration `OptimizeProductListFunction1750000000023` will run automatically on first request that connects to `jewelpos_w478`.

### 2. Verify Performance After Deploy

- Open product list for an outlet with 20K+ items
- First page should load in under 1 second
- Quick filters (Sold Today/Week/Month) should still work — `lastsaledate` is still in the function
- Check that delete guard still works — items with transactions should show greyed-out trash icon

### 3. Test the Analytics Drawer

- Open any product → click Eye icon → ProductDrawer opens
- Scroll to "Sales Analytics" section at the bottom
- Click "Load" → spinner → sold totals and purchase stats appear
- Re-open same product → stats appear instantly (cache-first)
- Verify cost/profit fields only show for Manager/Admin, not Cashier

---

## Known Limitations / Deferred

- **`lastsaledate` / `lastpurchasedate` in the list grid** — these columns still exist but reflect the product-level MAX date. They are hidden by default (`hide: true`). If a user reveals them from column settings, they will see correct dates (lightweight MAX LATERAL still runs).
- **Sold-today / sold-week / sold-month quick filter pills** — still work because `lastsaledate` is in the function. However, `lastsaledate` now only accounts for the item globally (not per-outlet), same as the prior implementation.
- **Transfer stats** — `lasttransferdate` / `transferby` columns return NULL (production `inventoryitemtransfers` table lacks `itemid` column). These are `hide: true` in the grid. If the column is added to that table in future, update the transfer LATERAL in the function.
- **`itemmetal`** field in the column def — not currently visible in the default grid layout but is returned by the function.

---

## Key Indexes (All Deployed)

```sql
idx_warehouses_outletid          ON warehouses(outletid)
idx_iis_itemwarehouseid          ON inventoryitemstocks(itemwarehouseid)
idx_iis_itemid                   ON inventoryitemstocks(itemid)
idx_inventoryitems_categoryid    ON inventoryitems(itemcategoryid)
idx_inventoryitems_subcategoryid ON inventoryitems(subcategoryid)
idx_inventoryitems_supplierid    ON inventoryitems(supplierid)
idx_invoiceitems_itemcode        ON invoiceitems(itemcode)
idx_bulkdiscounts_itemid         ON inventorybulkdiscounts(itemid)
idx_promositems_itemid           ON inventorypromotionitems(itemid)
idx_promositems_categoryid       ON inventorypromotionitems(categoryid)
idx_soitems_itemcode             ON invoicesalesorderitems(itemcode)
idx_poitems_itemcode             ON purchaseorderitems(itemcode)
```
