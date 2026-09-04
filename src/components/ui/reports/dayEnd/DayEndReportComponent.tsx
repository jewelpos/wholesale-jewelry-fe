"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { GET_DAY_END_REPORT_QUERY, GET_DAY_END_PAYMENT_TRANSACTIONS_QUERY, GET_DAY_END_ITEMS_SOLD_QUERY } from "@/lib/graphql/query/sales";
import { formatCurrency } from "@/components/ui/dashboard/admin/utils";
import PageHeader from "@/components/ui/PageHeader";
import ActionFooter from "@/components/ui/ActionFooter";
import OutletsFilter from "@/components/ui/grid/OutletsFilter";
import useOutlets from "@/hooks/useOutlets";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const SummaryCard = ({ label, value, accent, loading }: { label: string; value: string; accent: string; loading: boolean }) => (
  <div className="col">
    <div className="p-3 h-100" style={{ border: "1px solid var(--border-subtle)", borderLeft: `4px solid ${accent}`, borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{loading ? "—" : value}</div>
    </div>
  </div>
);

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "payments", label: "Payment Transactions" },
  { key: "items", label: "Items Sold" },
] as const;
type TabKey = typeof TABS[number]["key"];

const DayEndReportComponent = () => {
  const router = useRouter();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const storeid = parseInt(storeIdParam as string, 10);
  const outletid = parseInt(outletIdParam as string, 10);
  const [date, setDate] = useState(today());
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data, loading } = useQuery(GET_DAY_END_REPORT_QUERY, {
    variables: { storeid, outletid, date },
    skip: !storeid || !outletid || !date,
    fetchPolicy: "network-only",
  });

  const report            = data?.getDayEndReport ?? null;
  const summary           = report?.summary ?? null;
  const paymentBreakdown: any[] = report?.paymentBreakdown ?? [];
  const cashierBreakdown: any[] = report?.cashierBreakdown ?? [];
  const invoices: any[]         = report?.invoices ?? [];
  const totalReceived = paymentBreakdown.reduce((s: number, p: any) => s + p.totalReceived, 0);

  // Payments tab — spans every outlet the user has access to by default (undefined
  // outletid = "All"), since the by-outlet/by-sales-rep cards are meaningless scoped to
  // just the current URL outlet like the rest of this page is.
  const [paymentsOutlet, setPaymentsOutlet] = useState<number | undefined>(undefined);
  const { fetchOutletsList, outlets, loading: outletsLoading } = useOutlets();
  const { data: paymentsData, loading: paymentsLoading } = useQuery(GET_DAY_END_PAYMENT_TRANSACTIONS_QUERY, {
    variables: { storeid, date, outletid: paymentsOutlet },
    skip: !storeid || !date || activeTab !== "payments",
    fetchPolicy: "network-only",
  });
  const paymentsReport = paymentsData?.getDayEndPaymentTransactions ?? null;
  const transactions: any[] = paymentsReport?.transactions ?? [];
  const byOutlet: any[]     = paymentsReport?.byOutlet ?? [];
  const byPaymentType: any[] = paymentsReport?.byPaymentType ?? [];
  const bySalesRep: any[]   = paymentsReport?.bySalesRep ?? [];

  // Items Sold tab — same all-outlets-by-default scoping, own outlet filter so it's
  // independent of whatever the Payments tab has selected.
  const [itemsOutlet, setItemsOutlet] = useState<number | undefined>(undefined);
  const { data: itemsData, loading: itemsLoading } = useQuery(GET_DAY_END_ITEMS_SOLD_QUERY, {
    variables: { storeid, date, outletid: itemsOutlet },
    skip: !storeid || !date || activeTab !== "items",
    fetchPolicy: "network-only",
  });
  const itemsReport = itemsData?.getDayEndItemsSold ?? null;
  const itemsSold: any[]     = itemsReport?.items ?? [];
  const itemsByCategory: any[] = itemsReport?.byCategory ?? [];
  const itemsByUnit: any[]   = itemsReport?.byUnit ?? [];
  const itemsByOutlet: any[] = itemsReport?.byOutlet ?? [];

  return (
    <>
        <PageHeader
          title="Day-End Report"
          subtitle="Daily sales, payments, and cashier breakdown"
          rightSection={
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted fw-semibold mb-0" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Report Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: 150 }}
              />
            </div>
          }
        />

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                type="button"
                className={`nav-link ${activeTab === t.key ? "active fw-semibold" : ""}`}
                style={{ fontSize: 13 }}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === "payments" ? (
          <>
            <div className="d-flex justify-content-end mb-3">
              <div style={{ width: 220 }}>
                <OutletsFilter
                  fetchOutletsList={fetchOutletsList}
                  outlets={outlets}
                  loading={outletsLoading}
                  setSelectedOutlet={setPaymentsOutlet}
                  selectedOutlet={paymentsOutlet}
                  autoSelectCurrentOutlet={false}
                  stacked
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
              <SummaryCard label="Total Received" value={formatCurrency(paymentsReport?.totalReceived ?? 0)} accent="#10b981" loading={paymentsLoading} />
              <SummaryCard label="Transactions" value={String(transactions.length)} accent="#6366f1" loading={paymentsLoading} />
              <SummaryCard label="Outlets" value={String(byOutlet.length)} accent="#8b5cf6" loading={paymentsLoading} />
              <SummaryCard label="Sales Reps" value={String(bySalesRep.length)} accent="#f59e0b" loading={paymentsLoading} />
            </div>

            <div className="row g-3 mb-4">
              {/* By Outlet */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Outlet</h6>
                  </div>
                  <div className="card-body p-0">
                    {paymentsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : byOutlet.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No payments for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {byOutlet.map((o: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{o.outletname}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(o.totalpayment)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* By Payment Type */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Payment Type</h6>
                  </div>
                  <div className="card-body p-0">
                    {paymentsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : byPaymentType.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No payments for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {byPaymentType.map((p: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{p.paymode ?? "—"}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(p.totalpayment)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* By Sales Rep */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Sales Rep</h6>
                  </div>
                  <div className="card-body p-0">
                    {paymentsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : bySalesRep.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No payments for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {bySalesRep.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{r.username}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(r.totalpayment)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
              <div className="card-header d-flex align-items-center gap-2 py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Payment Transactions for {date}</h6>
                {!paymentsLoading && <span className="badge bg-secondary" style={{ fontSize: 11 }}>{transactions.length}</span>}
              </div>
              <div className="card-body p-0">
                {paymentsLoading ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                ) : transactions.length === 0 ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No payment transactions for this date.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                      <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)" }}>
                        <tr>
                          <th className="px-3">Customer ID</th>
                          <th>Company Name</th>
                          <th>Invoice #</th>
                          <th className="text-end">Amount Received</th>
                          <th>Payment Mode</th>
                          <th>Outlet</th>
                          <th className="px-3">Sales Rep</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t: any, i: number) => (
                          <tr key={`${t.customerpaymentid}-${t.invoicenumber ?? i}`}>
                            <td className="px-3">{t.customerid ?? "—"}</td>
                            <td>{t.companyname ?? "—"}</td>
                            <td className="fw-semibold" style={{ color: "#6366f1" }}>{t.invoicenumber ? `#${t.invoicenumber}` : "—"}</td>
                            <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(t.amountreceived)}</td>
                            <td>{t.paymode ?? "—"}</td>
                            <td>{t.outletname ?? "—"}</td>
                            <td className="px-3">{t.salesrepname ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === "items" ? (
          <>
            <div className="d-flex justify-content-end mb-3">
              <div style={{ width: 220 }}>
                <OutletsFilter
                  fetchOutletsList={fetchOutletsList}
                  outlets={outlets}
                  loading={outletsLoading}
                  setSelectedOutlet={setItemsOutlet}
                  selectedOutlet={itemsOutlet}
                  autoSelectCurrentOutlet={false}
                  stacked
                />
              </div>
            </div>

            {/* Summary Cards — Pc and Wt are summed separately since pieces and weight
                aren't the same unit and adding them together is meaningless. */}
            <div className="row row-cols-2 row-cols-md-5 g-3 mb-4">
              <SummaryCard label="Total Sale Value" value={formatCurrency(itemsReport?.totalSaleValue ?? 0)} accent="#10b981" loading={itemsLoading} />
              <SummaryCard label="Total Pcs Sold" value={String(itemsByUnit.find((u: any) => u.itemunit === "Pc")?.totalqty ?? 0)} accent="#6366f1" loading={itemsLoading} />
              <SummaryCard label="Total Wt Sold" value={String(itemsByUnit.find((u: any) => u.itemunit === "Wt")?.totalqty ?? 0)} accent="#0ea5e9" loading={itemsLoading} />
              <SummaryCard label="Items" value={String(itemsSold.length)} accent="#8b5cf6" loading={itemsLoading} />
              <SummaryCard label="Categories" value={String(itemsByCategory.length)} accent="#f59e0b" loading={itemsLoading} />
            </div>

            <div className="row g-3 mb-4">
              {/* By Category */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Category</h6>
                  </div>
                  <div className="card-body p-0">
                    {itemsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : itemsByCategory.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No items sold for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {itemsByCategory.map((c: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{c.categoryname}</td>
                              <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{c.totalqty}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(c.salevalue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* By Item Unit */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Item Unit</h6>
                  </div>
                  <div className="card-body p-0">
                    {itemsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : itemsByUnit.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No items sold for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {itemsByUnit.map((u: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{u.itemunit}</td>
                              <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{u.totalqty}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(u.salevalue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* By Outlet */}
              <div className="col-md-4">
                <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
                  <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>By Outlet</h6>
                  </div>
                  <div className="card-body p-0">
                    {itemsLoading ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                    ) : itemsByOutlet.length === 0 ? (
                      <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No items sold for this date.</div>
                    ) : (
                      <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                        <tbody>
                          {itemsByOutlet.map((o: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 fw-semibold">{o.outletname}</td>
                              <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{o.totalqty}</td>
                              <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(o.salevalue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Item List */}
            <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
              <div className="card-header d-flex align-items-center gap-2 py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Items Sold on {date}</h6>
                {!itemsLoading && <span className="badge bg-secondary" style={{ fontSize: 11 }}>{itemsSold.length}</span>}
              </div>
              <div className="card-body p-0">
                {itemsLoading ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                ) : itemsSold.length === 0 ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No items sold for this date.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                      <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)" }}>
                        <tr>
                          <th className="px-3">Item Code</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Unit</th>
                          <th className="text-end">Total Qty</th>
                          <th className="text-end px-3">Sale Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsSold.map((it: any) => (
                          <tr key={it.itemcode}>
                            <td className="fw-semibold px-3" style={{ color: "#6366f1" }}>{it.itemcode}</td>
                            <td>{it.itemdescription ?? "—"}</td>
                            <td>{it.categoryname ?? "—"}</td>
                            <td>{it.itemunit ?? "—"}</td>
                            <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{it.totalqty}</td>
                            <td className="text-end fw-semibold px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(it.salevalue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
        <>
        {/* Summary Cards */}
        <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
          <SummaryCard label="Total Sales"    value={formatCurrency(summary?.totalSales ?? 0)}       accent="#6366f1" loading={loading} />
          <SummaryCard label="Total Received" value={formatCurrency(totalReceived)}                  accent="#10b981" loading={loading} />
          <SummaryCard label="Outstanding"    value={formatCurrency(summary?.totalOutstanding ?? 0)} accent="#f59e0b" loading={loading} />
          <SummaryCard label={`Invoices (${summary?.invoiceCount ?? 0})`} value={`${summary?.paidCount ?? 0} paid`} accent="#8b5cf6" loading={loading} />
        </div>

        <div className="row g-3 mb-4">
          {/* Payment Breakdown */}
          <div className="col-md-5">
            <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
              <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Payment Method Breakdown</h6>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                ) : paymentBreakdown.length === 0 ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No payments received for this date.</div>
                ) : (
                  <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                    <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)" }}>
                      <tr><th className="px-3">Payment Mode</th><th className="text-end">Payments</th><th className="text-end px-3">Received</th></tr>
                    </thead>
                    <tbody>
                      {paymentBreakdown.map((p: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 fw-semibold">{p.paymode}</td>
                          <td className="text-end">{p.paymentCount}</td>
                          <td className="text-end fw-semibold px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(p.totalReceived)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold" style={{ borderTop: "2px solid var(--border-subtle)", backgroundColor: "var(--surface-secondary)" }}>
                        <td className="px-3">Total Received</td>
                        <td className="text-end">{paymentBreakdown.reduce((s: number, p: any) => s + p.paymentCount, 0)}</td>
                        <td className="text-end px-3" style={{ fontVariantNumeric: "tabular-nums", color: "#059669" }}>{formatCurrency(totalReceived)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Cashier Breakdown */}
          <div className="col-md-7">
            <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
              <div className="card-header py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
                <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Cashier Breakdown</h6>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
                ) : cashierBreakdown.length === 0 ? (
                  <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No transactions for this date.</div>
                ) : (
                  <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                    <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)" }}>
                      <tr><th className="px-3">Cashier</th><th className="text-end">Invoices</th><th className="text-end">Total Sold</th><th className="text-end px-3">Outstanding</th></tr>
                    </thead>
                    <tbody>
                      {cashierBreakdown.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="fw-semibold px-3">{c.employeename}</td>
                          <td className="text-end">{c.invoiceCount}</td>
                          <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.totalSales)}</td>
                          <td className="text-end fw-semibold px-3" style={{ fontVariantNumeric: "tabular-nums", color: c.outstanding > 0 ? "#b45309" : "#059669" }}>
                            {formatCurrency(c.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-header d-flex align-items-center gap-2 py-2 px-3" style={{ backgroundColor: "transparent", borderBottom: "1px solid var(--border-subtle)" }}>
            <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>Invoices for {date}</h6>
            {!loading && <span className="badge bg-secondary" style={{ fontSize: 11 }}>{invoices.length}</span>}
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No invoices for this date.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                  <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)" }}>
                    <tr>
                      <th className="px-3">Invoice #</th>
                      <th>Customer</th>
                      <th>Time</th>
                      <th>Sale Mode</th>
                      <th className="text-end">Amount</th>
                      <th className="text-end">Balance Due</th>
                      <th className="px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.invoicenumber}>
                        <td className="fw-semibold px-3" style={{ color: "#6366f1" }}>#{inv.invoicenumber}</td>
                        <td>{inv.companyname ?? "—"}</td>
                        <td className="text-muted">{inv.saledate?.split(" ")[1] ?? "—"}</td>
                        <td>{inv.salemodename ?? "—"}</td>
                        <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(inv.netamount)}</td>
                        <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums", color: inv.balancedue > 0 ? "#b45309" : "#059669" }}>
                          {formatCurrency(inv.balancedue)}
                        </td>
                        <td className="px-3">
                          <span className="badge" style={{
                            fontSize: 10,
                            backgroundColor: inv.statusname?.toLowerCase().includes("paid") || inv.statusname?.toLowerCase().includes("complete") ? "#d1fae5"
                              : inv.statusname?.toLowerCase().includes("cancel") || inv.statusname?.toLowerCase().includes("void") ? "#fee2e2" : "#fef3c7",
                            color: inv.statusname?.toLowerCase().includes("paid") || inv.statusname?.toLowerCase().includes("complete") ? "#065f46"
                              : inv.statusname?.toLowerCase().includes("cancel") || inv.statusname?.toLowerCase().includes("void") ? "#991b1b" : "#92400e",
                          }}>
                            {inv.statusname}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      <ActionFooter handleCancel={() => router.back()} />
    </>
  );
};

export default DayEndReportComponent;
