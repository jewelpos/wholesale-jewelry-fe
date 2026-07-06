"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currencyFormat";

type Payment = {
  paymentdate: string | null;
  invoiceno: number | null;
  paymode: string | null;
  amountpaid: number | null;
  paymentstatus: string | null;
};

type Props = {
  payments: Payment[];
  loading: boolean;
  customerId: number;
  storeId: number;
  outletId: number;
};

const num = (v: number | null | undefined) => Number(v ?? 0);

const formatDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const RecentPayments = ({
  payments,
  loading,
  customerId,
  storeId,
  outletId,
}: Props) => {
  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">Recent Payments</h6>
            <div className="text-muted small">
              Last {payments.length} payment{payments.length === 1 ? "" : "s"}
            </div>
          </div>
          <Link
            href={`/jw/${storeId}/${outletId}/customers/applied_payments?customerid=${customerId}`}
            className="small text-decoration-none"
          >
            View all →
          </Link>
        </div>

        {loading && !payments.length && (
          <div className="text-muted small py-4 text-center">Loading…</div>
        )}
        {!loading && !payments.length && (
          <div className="text-muted small py-4 text-center">
            No payments recorded.
          </div>
        )}

        {!!payments.length && (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="text-muted small">
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Invoice</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={`${p.paymentdate}-${idx}`}>
                    <td className="text-muted small">
                      {formatDate(p.paymentdate)}
                    </td>
                    <td>{p.paymode || "—"}</td>
                    <td className="text-muted">
                      {p.invoiceno ? `#${p.invoiceno}` : "—"}
                    </td>
                    <td className="text-end fw-semibold text-success">
                      {formatCurrency(num(p.amountpaid))}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {p.paymentstatus || "—"}
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
  );
};

export default RecentPayments;
