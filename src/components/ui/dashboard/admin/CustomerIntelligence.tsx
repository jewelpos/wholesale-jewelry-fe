"use client";
import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { num, formatCurrency } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

type AgingRow = { customerid?: number; customername?: string; companyname?: string; total_sale?: number; total_due?: number; due_0_30?: number; due_31_60?: number; due_61_90?: number; due_91_120?: number; due_120_plus?: number };
type CustomerRow = { customerid?: number; custcompanyname?: string; fullname?: string; totalsale?: number; balancedue?: number; numberofsales?: number; lastsaledate?: string; days_since_last_sale?: number };

type Props = { agingRows: AgingRow[]; customerRows: CustomerRow[]; loading: boolean };

const AGING_COLORS = ["#10b981", "#f59e0b", "#f97316", "#f43f5e", "#7f1d1d"];

const CustomerIntelligence = ({ agingRows, customerRows, loading }: Props) => {
  const [custTab, setCustTab] = useState<"top" | "overdue">("top");

  const agingSummary = useMemo(() => {
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "91-120": 0, "120+": 0 };
    for (const r of agingRows) {
      buckets["0-30"] += num(r.due_0_30);
      buckets["31-60"] += num(r.due_31_60);
      buckets["61-90"] += num(r.due_61_90);
      buckets["91-120"] += num(r.due_91_120);
      buckets["120+"] += num(r.due_120_plus);
    }
    const total = Object.values(buckets).reduce((s, v) => s + v, 0);
    const overdueTotal = buckets["31-60"] + buckets["61-90"] + buckets["91-120"] + buckets["120+"];
    return { buckets, total, overdueTotal };
  }, [agingRows]);

  const topCustomers = useMemo(() =>
    [...customerRows]
      .sort((a, b) => num(b.totalsale) - num(a.totalsale))
      .slice(0, 10),
  [customerRows]);

  const overdueCustomers = useMemo(() =>
    [...agingRows]
      .map((r) => ({ ...r, overdue: num(r.due_31_60) + num(r.due_61_90) + num(r.due_91_120) + num(r.due_120_plus) }))
      .filter((r) => r.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 10),
  [agingRows]);

  const { storeId, outletId } = useParams();

  const agingData = {
    labels: ["0-30d", "31-60d", "61-90d", "91-120d", "120d+"],
    datasets: [{
      label: "AR Balance",
      data: Object.values(agingSummary.buckets),
      backgroundColor: AGING_COLORS.map((c) => c + "bb"),
      borderColor: AGING_COLORS,
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const agingOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => `  Balance: ${formatCurrency(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: (v: unknown) => formatCurrency(Number(v)) }, grid: { color: "rgba(0,0,0,0.04)" } },
    },
  };

  const overdruePct = agingSummary.total > 0 ? (agingSummary.overdueTotal / agingSummary.total) * 100 : 0;

  return (
    <div className="row g-3">
      {/* AR Aging Chart */}
      <div className="col-lg-5">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 className="mb-1">Receivables Aging</h6>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  Total AR: <strong>{formatCurrency(agingSummary.total)}</strong>
                </div>
              </div>
              {overdruePct > 30 && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, backgroundColor: "#fff1f2", color: "#f43f5e", fontWeight: 600 }}>
                  ⚠ {overdruePct.toFixed(0)}% overdue
                </span>
              )}
            </div>
            <div style={{ height: 170, position: "relative" }}>
              {loading
                ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
                : <Bar data={agingData} options={agingOptions as never} />
              }
            </div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {Object.entries(agingSummary.buckets).map(([bucket, val], i) => (
                <div key={bucket} className="text-center">
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: AGING_COLORS[i], display: "inline-block", marginRight: 3 }} />
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{bucket}: </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: AGING_COLORS[i] }}>{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="col-lg-7">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Customers</h6>
              <div className="d-flex gap-1">
                {(["top", "overdue"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setCustTab(t)}
                    style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20,
                      backgroundColor: custTab === t ? (t === "overdue" ? "#f43f5e" : "#6366f1") : "var(--surface-muted)",
                      color: custTab === t ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${custTab === t ? (t === "overdue" ? "#f43f5e" : "#6366f1") : "var(--border-subtle)"}`,
                    }}>
                    {t === "top" ? "Top by Revenue" : "Overdue AR"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm align-middle mb-0" style={{ fontSize: 11 }}>
                <thead style={{ fontSize: 10 }}>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th className="text-end">{custTab === "top" ? "Total Sales" : "Overdue"}</th>
                    <th className="text-end">{custTab === "top" ? "Balance Due" : "Total Due"}</th>
                    {custTab === "top" && <th className="text-end">Orders</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={5} className="text-center text-muted py-3">Loading…</td></tr>}
                  {custTab === "top" && !loading && topCustomers.map((c, i) => (
                    <tr key={c.customerid}>
                      <td style={{ color: i < 3 ? "#f59e0b" : "var(--text-tertiary)", fontWeight: 700, fontSize: 10 }}>{i + 1}</td>
                      <td>
                        <Link href={`/jw/${storeId}/${outletId}/customers/${c.customerid}/view`} style={{ fontSize: 11, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                          {c.custcompanyname || c.fullname || "—"}
                        </Link>
                      </td>
                      <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(num(c.totalsale))}</td>
                      <td className="text-end" style={{ fontVariantNumeric: "tabular-nums", color: num(c.balancedue) > 0 ? "#f43f5e" : "var(--text-secondary)" }}>
                        {formatCurrency(num(c.balancedue))}
                      </td>
                      <td className="text-end text-muted">{num(c.numberofsales)}</td>
                    </tr>
                  ))}
                  {custTab === "overdue" && !loading && overdueCustomers.map((c, i) => (
                    <tr key={`${c.customerid}-${i}`}>
                      <td style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{i + 1}</td>
                      <td>
                        <Link href={`/jw/${storeId}/${outletId}/customers/${c.customerid}/view`} style={{ fontSize: 11, color: "#f43f5e", textDecoration: "none", fontWeight: 600 }}>
                          {c.companyname || c.customername || "—"}
                        </Link>
                      </td>
                      <td className="text-end fw-bold" style={{ color: "#f43f5e", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.overdue)}</td>
                      <td className="text-end text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(num(c.total_due))}</td>
                    </tr>
                  ))}
                  {!loading && custTab === "overdue" && overdueCustomers.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-3" style={{ fontSize: 11 }}>No overdue accounts ✓</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerIntelligence;
