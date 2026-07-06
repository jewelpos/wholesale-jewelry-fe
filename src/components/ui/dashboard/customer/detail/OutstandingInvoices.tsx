"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currencyFormat";

type Invoice = {
  invoicenumber: number;
  saledate: string | null;
  totalamount: number | null;
  amountreceived: number | null;
  balancedue: number | null;
};

type Props = {
  invoices: Invoice[];
  loading: boolean;
};

const num = (v: number | null | undefined) => Number(v ?? 0);

const ageInDays = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const ageBadge = (days: number | null) => {
  if (days === null) return { className: "bg-secondary-subtle text-secondary", label: "—" };
  if (days <= 30) return { className: "bg-success-subtle text-success", label: `${days}d` };
  if (days <= 60) return { className: "bg-info-subtle text-info", label: `${days}d` };
  if (days <= 90) return { className: "bg-warning-subtle text-warning", label: `${days}d` };
  return { className: "bg-danger-subtle text-danger", label: `${days}d` };
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const OutstandingInvoices = ({ invoices, loading }: Props) => {
  const { storeId, outletId } = useParams();
  const total = invoices.reduce((s, i) => s + num(i.balancedue), 0);

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">Outstanding Invoices</h6>
            <div className="text-muted small">
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
              {total > 0 && (
                <> · <span className="fw-semibold text-dark">{formatCurrency(total)}</span> owed</>
              )}
            </div>
          </div>
        </div>

        {loading && !invoices.length && (
          <div className="text-muted small py-4 text-center">Loading…</div>
        )}
        {!loading && !invoices.length && (
          <div className="text-muted small py-4 text-center">No outstanding invoices — all paid.</div>
        )}

        {!!invoices.length && (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
              <thead className="text-muted" style={{ fontSize: 11 }}>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Due</th>
                  <th className="text-end">Age</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const age = ageInDays(inv.saledate);
                  const badge = ageBadge(age);
                  return (
                    <tr key={inv.invoicenumber}>
                      <td className="fw-semibold">
                        <Link
                          href={`/jw/${storeId}/${outletId}/sales_invoices/${inv.invoicenumber}/view`}
                          className="text-decoration-none text-primary"
                        >
                          #{inv.invoicenumber}
                        </Link>
                      </td>
                      <td className="text-muted">{formatDate(inv.saledate)}</td>
                      <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(num(inv.totalamount))}
                      </td>
                      <td className="text-end text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(num(inv.amountreceived))}
                      </td>
                      <td className="text-end fw-semibold text-warning" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(num(inv.balancedue))}
                      </td>
                      <td className="text-end">
                        <span className={`badge ${badge.className}`} style={{ fontSize: 10 }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingInvoices;
