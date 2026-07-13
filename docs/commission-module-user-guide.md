# Sales Rep Commission Module — Owner Guide

## What This Module Does

The Commission Module lets you track and pay sales commissions to your team members based on the **sales rep who brought the customer** — not whoever typed the invoice. You can:

- Set a commission rate (flat or stepped tiers) per employee
- Assign a default sales rep to each customer (auto-fills on invoice)
- Split commission between multiple reps on a single invoice
- Choose whether commission is earned on **invoice date** or **payment received**
- Run a report to see exactly how much commission is owed each period
- Mark commission as paid and keep a full payout history

---

## Step 1 — Set Up Commission Trigger (One-Time Setup)

**Where:** System Settings → HR / Payroll → Commission Rates

At the top of the page you will see:

> **Commission Trigger:** [Invoice Date] [Payment Received]

| Choice | When Commission Is Earned |
|---|---|
| **Invoice Date** (default) | The moment you save an invoice |
| **Payment Received** | Only when the customer actually pays — commission is proportional to the amount paid |

**Recommendation for most businesses:** Use **Invoice Date** for simplicity. Use **Payment Received** if you want reps to earn commission only after cash is collected.

---

## Step 2 — Set Commission Rates Per Employee

**Where:** System Settings → HR / Payroll → Commission Rates

You will see a table with all your employees. For each employee:

### Option A — Flat Rate
- Select **Basis**: Net Sales OR Gross Profit
  - **Net Sales**: commission is a % of the invoice net amount
  - **Gross Profit**: commission is a % of (sales price − item cost)
- Enter **Flat Rate %**
- Click **Save** for that row

### Option B — Stepped Tiers
- Click **Add Tier** to switch to a tier table
- Enter the thresholds:

| From | To | Rate |
|---|---|---|
| $0 | $25,000 | 2% |
| $25,000 | $75,000 | 3% |
| $75,000 | Unlimited | 4% |

- The system finds the **highest threshold the rep crossed** for the period and applies **that single rate to all their sales** (stepped commission, not blended)
- Click **Save** for that row

> **Example:** Rep sells $80,000 in July. Threshold crossed = $75,000 → Rate = 4%. Commission = $80,000 × 4% = $3,200.

### Changing a Rate Mid-Year
When you click Save with a new rate, the system:
1. Closes the old rate with today's date
2. Starts the new rate from today

**Historical reports are never affected** — the report for January will always use the rate that was active in January, even if you changed it in March.

---

## Step 3 — Assign Default Sales Rep to a Customer

**Where:** Customers → (open or create a customer) → Default Sales Rep field

Select the employee who is responsible for bringing this customer. This auto-fills on every new invoice for this customer. You can always change it per invoice.

---

## Step 4 — Select Sales Rep on an Invoice

**Where:** Sales → New Invoice → SALES REP section (below the Fulfillment section)

When you select the customer, the default sales rep auto-fills.

### Single Rep
- The rep is shown with 100% split automatically

### Split Between Two Reps
- Click **+ Add Rep**
- Select the second rep
- The system splits to 50% / 50% automatically
- You can adjust the percentages manually
- **The two percentages must add up to 100%** — the save button is blocked if they don't

### Remove a Rep
- Click the **×** next to the rep row

> **Note:** If no sales rep is selected, the invoice is saved with no commission. That is allowed — not every invoice needs a sales rep.

---

## Step 5 — Run the Commission Report

**Where:** Reports → Commission Report

### Filters
- **Date Range** — select the period (e.g., July 1 – July 31)
- **Employee** — leave blank to see all reps, or select one

### Summary Cards at the Top
| Card | What It Shows |
|---|---|
| Total Net Sales | Sum of all invoices in the period where a rep was assigned |
| Total Gross Profit | Sales minus item cost for those invoices |
| Total Commission | How much commission was earned this period |
| True Profit After Commission | Gross Profit minus Commission |
| Balance Due | Total commission earned minus what has already been paid out |

### Report Grid Columns
| Column | Explanation |
|---|---|
| Employee | The sales rep's name |
| Basis | Net or Profit (whichever was configured for that rep) |
| Applied Rate % | The tier rate that applied to their total sales this period |
| # Invoices | Number of invoices they were a sales rep on |
| Net Sales | Their share of total net sales (after split) |
| Cost | Their share of item cost |
| Gross Profit | Their share of profit |
| Commission | Commission amount owed for the period |
| True Profit After Commission | Gross Profit − Commission (your real profit after paying the rep) |
| Already Paid | Commission already paid out in previous payouts |
| Balance Due | Commission − Already Paid |

> **Commission is calculated as a period operating expense.** It is NOT stored per invoice. This is the standard accounting approach — the same way payroll works. The report always shows the full picture for the period you selected.

---

## Step 6 — Pay Out Commission

**Where:** Reports → Commission Report → click **Pay Out** button on a rep's row

1. A modal opens with the **Balance Due** pre-filled
2. Adjust the amount if you are making a partial payment
3. Add a **note** (optional, e.g., "July 2026 commission")
4. Click **Confirm Payout**

The system records the payout and deducts it from the Balance Due. The rep's row will update immediately.

---

## Step 7 — View Payout History

**Where:** Reports → Commission Report → click **Payout History** tab

Shows every payout you have recorded, with:
- Employee name
- Period covered
- Amount paid
- Date paid
- Who processed the payout
- Notes

---

## Frequently Asked Questions

**Q: What if a rep has no commission rate configured?**
A: Their commission column will show $0. They still appear in the report if they were assigned as a rep on any invoices.

**Q: Can I change commission rates at any time?**
A: Yes. When you save a new rate, the old rate is closed at today's date. Reports always use the rate that was active at the end of the report period, so past reports are unaffected.

**Q: Do voided invoices count toward commission?**
A: No. Voided invoices are excluded from the commission report.

**Q: What is "True Profit After Commission"?**
A: It is your gross profit on those invoices minus the commission amount. This is the most accurate picture of how much you actually keep after paying your reps. This is why commission is tracked as a separate expense — it gives you a real operating profit number without mixing it into individual invoice margins.

**Q: What if the customer pays in multiple payments?**
A: If your trigger is set to "Payment Received," the system tracks how much has been paid on each invoice and calculates commission proportionally. If 60% of invoice #1001 is paid, the rep earns 60% of their commission on that invoice.

**Q: Can the same rep be the default rep for multiple customers?**
A: Yes. One rep can be the default on as many customers as you want.

**Q: Can I remove the sales rep from an invoice after it is saved?**
A: Yes. Open the invoice in Edit mode, clear the sales rep field, and save. The commission for that invoice will be removed from future reports.

---

## Quick Reference

| Task | Where |
|---|---|
| Set commission trigger (invoice vs payment) | System Settings → HR / Payroll → Commission Rates |
| Set/change commission rate for an employee | System Settings → HR / Payroll → Commission Rates |
| Set default sales rep for a customer | Customers → open customer → Default Sales Rep |
| Assign sales rep on an invoice | Invoice form → SALES REP section |
| View commission report | Reports → Commission Report |
| Pay out commission | Reports → Commission Report → Pay Out button |
| View payout history | Reports → Commission Report → Payout History tab |

---

## Appendix — System Administrator Deployment Notes

> These steps are for the technical team only. Run on **UAT first**, verify, then repeat on PRD.

### A. Backend — Run Tenant DB Migrations

After deploying the backend code, trigger migrations via the API endpoint for each store:

```
POST /database/migrate
Body: { "storeid": <store id> }
```

This runs the following 3 new migrations in order:
1. **`AddEmployeeCommissionTables1750000000035`** — creates `employee_commission_rates`, `employee_commission_tiers`, `invoice_salesreps`, `commission_payouts` tables
2. **`AddCustomerDefaultSalesRep1750000000036`** — adds `default_salesrep_userid` column to `customers` table
3. **`AddCommissionTriggerToSettings1750000000037`** — adds `commission_trigger` column to `settings` table (defaults to `'invoice'`)

### B. Core DB — Add Commission Report to Sidebar Menu

SSH into the server and connect to the **core database** via psql.

**Step 1 — Find the Reports parent menu ID and existing entries:**
```sql
SELECT menuid, menuname, slugname, menuurl, parentid, menuorder, packageid
FROM storemenu
WHERE menuurl ILIKE '%report%' OR menuname ILIKE '%report%'
   OR parentid IN (SELECT menuid FROM storemenu WHERE menuname ILIKE '%report%')
ORDER BY parentid, menuorder;
```

**Step 2 — Find the next available menuid:**
```sql
SELECT MAX(menuid) FROM storemenu;
```

**Step 3 — Insert the Commission Report menu entry**
Replace the placeholder values with the results from Steps 1–2:
- `:NEXT_MENUID` → `MAX(menuid) + 1`
- `:PARENT_REPORTS_MENUID` → the `menuid` of the Reports parent menu
- `:MENUORDER` → last report entry's `menuorder + 1`
- `:PACKAGEID` → same `packageid` as the other report entries

```sql
INSERT INTO storemenu (menuid, menuname, slugname, menuurl, iconurl, parentid, menuorder, storetypeid, packageid, isenabled)
VALUES (:NEXT_MENUID, 'Commission Report', 'commission_report', '/commission_report',
        'fa fa-percent', :PARENT_REPORTS_MENUID, :MENUORDER, 1, :PACKAGEID, 1);
```

**Step 4 — Grant access to Admin and Manager roles:**
```sql
INSERT INTO rolestoremenu (roleid, storemenuid, packageid)
VALUES (1, :NEXT_MENUID, :PACKAGEID),
       (2, :NEXT_MENUID, :PACKAGEID);
```

**Step 5 — Verify:**
```sql
SELECT rsm.roleid, sm.menuname, sm.menuurl
FROM rolestoremenu rsm
JOIN storemenu sm ON sm.menuid = rsm.storemenuid
WHERE sm.slugname = 'commission_report';
```
Should return 2 rows — one for roleid=1 (Admin) and one for roleid=2 (Manager).

### C. Deployment Checklist

| Step | Description | Environment |
|---|---|---|
| Deploy backend code | Push to server + restart backend | UAT → PRD |
| Run `/database/migrate` | Trigger tenant migrations for each active store | UAT → PRD |
| Run storemenu SQL (Steps 1–4 above) | Add Commission Report to sidebar | UAT → PRD |
| Restart backend | So `graphql.ts` regenerates with new commission types | UAT → PRD |
| Test end-to-end | Set rate → assign on invoice → run report → pay out | UAT only |
| Sign off | Owner approves UAT | UAT |
| Repeat all steps | Deploy to PRD | PRD |

### D. Files Changed — Full Reference

**Backend:**
- `src/entities/migrations/tenant-migrations.ts` — 3 new migration classes (lines ~3650–3740)
- `src/database/database.service.ts` — 3 new migrations registered in import + `migrations[]` array
- `src/entities/tenant/employee-commission-rate.entity.ts` — new entity
- `src/entities/tenant/employee-commission-tier.entity.ts` — new entity
- `src/entities/tenant/invoice-salesrep.entity.ts` — new entity (uses `invoicenumber BIGINT`)
- `src/entities/tenant/commission-payout.entity.ts` — new entity
- `src/entities/tenant/settings.entity.ts` — added `commission_trigger` column
- `src/entities/tenant/customers.entity.ts` — added `default_salesrep_userid` column
- `src/store/store.graphql` — new commission types, queries, mutations; extended invoice + customer inputs
- `src/store/store.mutations.resolver.ts` — 3 new mutations
- `src/store/store.queries.resolver.ts` — 4 new queries
- `src/store/store.service.ts` — extended `createInvoice`, `editInvoice`, `getMemoDetail`; 6 new service methods

**Frontend:**
- `src/lib/graphql/mutations/commission.ts` — new mutations file
- `src/lib/graphql/query/reports.ts` — 3 new commission queries added
- `src/lib/graphql/query/customer.ts` — added `default_salesrep_userid` to `GET_CUSTOMER_QUERY`
- `src/lib/graphql/query/sales.ts` — added `salesreps` to `GET_INVOICE_BY_NUMBER_QUERY`
- `src/components/forms/SelectEmployee.tsx` — new lazy-load employee dropdown component
- `src/types/customer.ts` — added `default_salesrep_userid` to `CustomerFormType`
- `src/components/ui/customers/customerForm/CustomerInputsB.tsx` — Default Sales Rep field
- `src/components/ui/customers/customerForm/CustomerForm.tsx` — `default_salesrep_userid` default value
- `src/components/ui/sales/invoiceForm/SalesInvoiceForm.tsx` — SALES REP section, auto-fill, split validation
- `src/app/.../system_settings/commission_rates/page.tsx` — new page
- `src/components/ui/systemSettings/commissionRates/CommissionRatesComponent.tsx` — new component
- `src/components/ui/systemSettings/SystemSettingsHub.tsx` — HR/Payroll section added
- `src/app/.../reports/commission_report/page.tsx` — new page
- `src/components/ui/reports/commissionReport/CommissionReportComponent.tsx` — new component
