"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FileText, DollarSign } from "lucide-react";
import { useParams } from "next/navigation";

type Invoice = {
  invoicenumber: number;
  saledate: string | null;
  totalamount: number | null;
  balancedue: number | null;
};

type Payment = {
  paymentdate: string | null;
  invoiceno: number | null;
  paymode: string | null;
  amountpaid: number | null;
  paymentstatus: string | null;
};

type Props = {
  invoices: Invoice[];
  payments: Payment[];
  loading: boolean;
};

type TimelineEntry =
  | { type: "invoice"; date: Date; invoice: Invoice }
  | { type: "payment"; date: Date; payment: Payment };

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const num = (v: number | null | undefined) => Number(v ?? 0);

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ActivityTimeline = ({ invoices, payments, loading }: Props) => {
  const { storeId, outletId } = useParams();

  const entries = useMemo<TimelineEntry[]>(() => {
    const out: TimelineEntry[] = [];

    for (const inv of invoices) {
      if (!inv.saledate) continue;
      const d = new Date(inv.saledate);
      if (!isNaN(d.getTime())) out.push({ type: "invoice", date: d, invoice: inv });
    }

    for (const pay of payments) {
      if (!pay.paymentdate) continue;
      const d = new Date(pay.paymentdate);
      if (!isNaN(d.getTime())) out.push({ type: "payment", date: d, payment: pay });
    }

    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [invoices, payments]);

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="mb-3">
          <h6 className="mb-1">Activity Timeline</h6>
          <div className="text-muted small">{entries.length} events — invoices &amp; payments combined</div>
        </div>

        {loading && !entries.length && (
          <div className="text-muted small py-4 text-center">Loading…</div>
        )}
        {!loading && !entries.length && (
          <div className="text-muted small py-4 text-center">No activity recorded.</div>
        )}

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {entries.map((entry, idx) => {
            if (entry.type === "invoice") {
              const inv = entry.invoice;
              const isPaid = num(inv.balancedue) === 0;
              return (
                <div key={`inv-${inv.invoicenumber}-${idx}`} className="d-flex gap-3 pb-3" style={{ position: "relative" }}>
                  {/* Timeline line */}
                  {idx < entries.length - 1 && (
                    <div style={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, backgroundColor: "#e2e8f0" }} />
                  )}
                  {/* Icon */}
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-primary-subtle text-primary"
                    style={{ width: 24, height: 24, zIndex: 1 }}
                  >
                    <FileText size={12} />
                  </div>
                  {/* Content */}
                  <div className="flex-grow-1 min-w-0" style={{ paddingTop: 2 }}>
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          Invoice{" "}
                          <Link
                            href={`/jw/${storeId}/${outletId}/sales_invoices/${inv.invoicenumber}/view`}
                            className="text-decoration-none text-primary"
                          >
                            #{inv.invoicenumber}
                          </Link>
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{formatDate(entry.date)}</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(num(inv.totalamount))}
                        </div>
                        <span
                          className={`badge ${isPaid ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}
                          style={{ fontSize: 10 }}
                        >
                          {isPaid ? "Paid" : `Due ${formatCurrency(num(inv.balancedue))}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // payment
            const pay = entry.payment;
            return (
              <div key={`pay-${pay.paymentdate}-${idx}`} className="d-flex gap-3 pb-3" style={{ position: "relative" }}>
                {idx < entries.length - 1 && (
                  <div style={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, backgroundColor: "#e2e8f0" }} />
                )}
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-success-subtle text-success"
                  style={{ width: 24, height: 24, zIndex: 1 }}
                >
                  <DollarSign size={12} />
                </div>
                <div className="flex-grow-1 min-w-0" style={{ paddingTop: 2 }}>
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Payment received
                        {pay.invoiceno && (
                          <span className="text-muted fw-normal"> · Invoice #{pay.invoiceno}</span>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>
                        {formatDate(entry.date)} · {pay.paymode || "—"}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="text-success fw-bold" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        +{formatCurrency(num(pay.amountpaid))}
                      </div>
                      {pay.paymentstatus && (
                        <span className="badge bg-light text-dark border" style={{ fontSize: 10 }}>
                          {pay.paymentstatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
