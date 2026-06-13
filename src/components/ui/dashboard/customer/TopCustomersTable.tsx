"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Slider } from "antd";
import DashboardCustomer from "./types";
import { formatCurrency, num, isSystemAccount } from "./utils";
import {
  computeChurnScore,
  churnRiskLabel,
  churnRiskBadgeClass,
  computePaymentBehavior,
  paymentBehaviorLabel,
  paymentBehaviorBadgeClass,
} from "./forecast";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
  storeId: number;
  outletId: number;
};

const TopCustomersTable = ({ customers, loading, storeId, outletId }: Props) => {
  const [topN, setTopN] = useState<number>(10);

  const { top, totalRevenue, concentrationPct } = useMemo(() => {
    const named = customers
      .filter((c) => num(c.totalsale) > 0 && !isSystemAccount(c))
      .sort((a, b) => num(b.totalsale) - num(a.totalsale));

    const totalRevenue = named.reduce((s, c) => s + num(c.totalsale), 0);
    const sliced = named.slice(0, topN);
    const topRevenue = sliced.reduce((s, c) => s + num(c.totalsale), 0);
    const concentrationPct = totalRevenue > 0 ? (topRevenue / totalRevenue) * 100 : 0;

    return { top: sliced, totalRevenue, concentrationPct };
  }, [customers, topN]);

  const maxSale = top.length ? num(top[0].totalsale) : 1;

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body p-0">
        <div className="d-flex justify-content-between align-items-start p-3 pb-2">
          <div>
            <h6 className="mb-1">Top Customers</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              By lifetime sales ·{" "}
              <span className="fw-semibold" style={{ color: "#3b82f6" }}>
                Top {topN} = {concentrationPct.toFixed(0)}% of total revenue
              </span>
            </div>
          </div>
          <Link href={`/jw/${storeId}/${outletId}/customers/list`} className="small text-decoration-none">
            All customers →
          </Link>
        </div>

        {/* Revenue concentration risk indicator */}
        {concentrationPct > 60 && (
          <div className="mx-3 mb-2 rounded px-2 py-1 bg-warning-subtle" style={{ fontSize: 11 }}>
            <span className="text-warning fw-semibold">⚠ Concentration risk:</span>{" "}
            <span className="text-muted">Top {topN} customers hold {concentrationPct.toFixed(0)}% of revenue — high dependency</span>
          </div>
        )}

        {/* Top N slider */}
        <div className="px-3 pb-1">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            Show top {topN}
          </div>
          <Slider
            min={5}
            max={50}
            step={5}
            marks={{ 5: "5", 10: "10", 20: "20", 50: "50" }}
            value={topN}
            onChange={(v) => setTopN(v as number)}
            styles={{ track: { backgroundColor: "#6366f1" }, rail: { backgroundColor: "#e2e8f0" } }}
            style={{ marginBottom: 12 }}
          />
        </div>

        <div className="table-responsive" style={{ maxHeight: 420, overflowY: "auto" }}>
          <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
            <thead className="text-muted" style={{ fontSize: 11, position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>Customer</th>
                <th style={{ width: 110 }}>Revenue share</th>
                <th className="text-end">Lifetime</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !top.length && (
                <tr><td colSpan={6} className="text-center text-muted py-4">Loading…</td></tr>
              )}
              {!loading && !top.length && (
                <tr><td colSpan={6} className="text-center text-muted py-4">No sales recorded yet.</td></tr>
              )}
              {top.map((c, i) => {
                const pct = maxSale > 0 ? (num(c.totalsale) / maxSale) * 100 : 0;
                const risk = churnRiskLabel(computeChurnScore(c));
                const behavior = computePaymentBehavior(c);
                return (
                  <tr key={c.customerid}>
                    <td className="text-muted fw-semibold" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td>
                      <Link
                        href={`/jw/${storeId}/${outletId}/dashboard/customer/${c.customerid}`}
                        className="text-decoration-none fw-semibold d-block"
                        style={{ fontSize: 12 }}
                      >
                        {c.custcompanyname || c.fullname || `#${c.customerid}`}
                      </Link>
                      {c.custcompanyname && c.fullname && (
                        <div className="text-muted" style={{ fontSize: 10 }}>{c.fullname}</div>
                      )}
                    </td>
                    <td>
                      {/* Progress bar */}
                      <div style={{ height: 6, backgroundColor: "var(--border-subtle)", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: i === 0
                              ? "linear-gradient(90deg, var(--tile-indigo), var(--tile-violet))"
                              : i < 3
                              ? "linear-gradient(90deg, var(--tile-violet), var(--tile-cyan))"
                              : "linear-gradient(90deg, var(--tile-cyan), var(--tile-teal))",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                        {((num(c.totalsale) / totalRevenue) * 100).toFixed(1)}% of total
                      </div>
                    </td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(num(c.totalsale))}
                    </td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {num(c.balancedue) > 0 ? (
                        <span className="text-warning fw-semibold">{formatCurrency(num(c.balancedue))}</span>
                      ) : (
                        <span className="text-success">✓</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <span className={`badge ${churnRiskBadgeClass(risk)}`} style={{ fontSize: 9 }}>
                          {risk}
                        </span>
                        <span className={`badge ${paymentBehaviorBadgeClass(behavior)}`} style={{ fontSize: 9 }}>
                          {paymentBehaviorLabel(behavior)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopCustomersTable;
