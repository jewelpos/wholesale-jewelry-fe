"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import DashboardCustomer from "./types";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
  storeId: number;
  outletId: number;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: number | null | undefined) => Number(v ?? 0);

const SYSTEM_ACCOUNT_PATTERN = /^(counter\s*sale|cash\s*sale|walk[\s-]*in)/i;
const isSystemAccount = (c: DashboardCustomer) =>
  SYSTEM_ACCOUNT_PATTERN.test(c.custcompanyname ?? "") ||
  SYSTEM_ACCOUNT_PATTERN.test(c.fullname ?? "");

const TopCustomersTable = ({ customers, loading, storeId, outletId }: Props) => {
  const top = useMemo(() => {
    return [...customers]
      .filter((c) => num(c.totalsale) > 0 && !isSystemAccount(c))
      .sort((a, b) => num(b.totalsale) - num(a.totalsale))
      .slice(0, 10);
  }, [customers]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">Top 10 Customers</h6>
            <div className="text-muted small">By lifetime sales</div>
          </div>
          <Link
            href={`/jw/${storeId}/${outletId}/customers/list`}
            className="small text-decoration-none"
          >
            All customers →
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead className="text-muted small">
              <tr>
                <th scope="col" style={{ width: 32 }}>#</th>
                <th scope="col">Customer</th>
                <th scope="col" className="text-end">Sales</th>
                <th scope="col" className="text-end">Lifetime</th>
                <th scope="col" className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading && !top.length && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && !top.length && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
              {top.map((c, i) => (
                <tr key={c.customerid}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <Link
                      href={`/jw/${storeId}/${outletId}/dashboard/customer/${c.customerid}`}
                      className="text-decoration-none"
                    >
                      <div className="fw-semibold">
                        {c.custcompanyname || c.fullname || "—"}
                      </div>
                      {c.custcompanyname && c.fullname && (
                        <div className="text-muted small">{c.fullname}</div>
                      )}
                    </Link>
                  </td>
                  <td className="text-end">{num(c.numberofsales)}</td>
                  <td className="text-end fw-semibold">
                    {formatCurrency(num(c.totalsale))}
                  </td>
                  <td className="text-end">
                    {num(c.balancedue) > 0 ? (
                      <span className="text-warning">
                        {formatCurrency(num(c.balancedue))}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopCustomersTable;
