"use client";
import React, { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement,
  DoughnutController, ArcElement, Tooltip, Legend,
} from "chart.js";
import { num, formatCurrency } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, DoughnutController, ArcElement, Tooltip, Legend);

type CategoryRow = { categoryname?: string; total_sales?: number; total_profit?: number; profit_margin_percent?: number };
type PaymentRow = { payment_mode_totals?: unknown };

const DONUT_COLORS = ["#6366f1","#10b981","#f59e0b","#f43f5e","#8b5cf6","#06b6d4","#f97316","#14b8a6"];

type Props = { categoryRows: CategoryRow[]; paymentRows: PaymentRow[]; loading: boolean };

type SortKey = "revenue" | "profit" | "margin";

const SalesBreakdown = ({ categoryRows, paymentRows, loading }: Props) => {
  const [sortBy, setSortBy] = useState<SortKey>("revenue");

  const categories = useMemo(() => {
    const map: Record<string, { sales: number; profit: number }> = {};
    for (const r of categoryRows) {
      const k = r.categoryname || "Other";
      if (!map[k]) map[k] = { sales: 0, profit: 0 };
      map[k].sales += num(r.total_sales);
      map[k].profit += num(r.total_profit);
    }
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d, margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0 }))
      .filter((c) => c.sales > 0)
      .sort((a, b) => sortBy === "revenue" ? b.sales - a.sales : sortBy === "profit" ? b.profit - a.profit : b.margin - a.margin)
      .slice(0, 12);
  }, [categoryRows, sortBy]);

  const paymentModes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of paymentRows) {
      let modes: Record<string, number> = {};
      const raw = r.payment_mode_totals;
      try {
        if (typeof raw === "string") modes = JSON.parse(raw);
        else if (raw && typeof raw === "object") modes = raw as Record<string, number>;
      } catch { /* ignore */ }
      for (const [k, v] of Object.entries(modes)) map[k] = (map[k] ?? 0) + Number(v);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [paymentRows]);

  const totalPayments = paymentModes.reduce((s, [, v]) => s + v, 0);

  const barData = {
    labels: categories.map((c) => c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name),
    datasets: [
      { label: "Revenue", data: categories.map((c) => c.sales), backgroundColor: "rgba(99,102,241,0.7)", borderColor: "#6366f1", borderWidth: 1, borderRadius: 4 },
      { label: "Profit", data: categories.map((c) => c.profit), backgroundColor: "rgba(16,185,129,0.7)", borderColor: "#10b981", borderWidth: 1, borderRadius: 4 },
    ],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: "y" as const,
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 }, padding: 10 } },
      tooltip: { callbacks: { label: (ctx: { dataset: { label?: string }; parsed: { x: number } }) => `  ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.x)}` } },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, callback: (v: unknown) => formatCurrency(Number(v)) }, grid: { color: "rgba(0,0,0,0.04)" } },
      y: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  const donutData = {
    labels: paymentModes.map(([k]) => k),
    datasets: [{ data: paymentModes.map(([, v]) => v), backgroundColor: DONUT_COLORS, borderWidth: 2, borderColor: "var(--surface-card)" }],
  };

  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } }, tooltip: { callbacks: { label: (ctx: { label: string; parsed: number }) => `  ${ctx.label}: ${formatCurrency(ctx.parsed)} (${totalPayments > 0 ? ((ctx.parsed / totalPayments) * 100).toFixed(1) : 0}%)` } } },
  };

  const catHeight = Math.max(160, categories.length * 36);

  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
              <h6 className="mb-0">Revenue by Category</h6>
              <div className="d-flex gap-1">
                {(["revenue","profit","margin"] as SortKey[]).map((k) => (
                  <button key={k} type="button" onClick={() => setSortBy(k)}
                    style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20,
                      backgroundColor: sortBy === k ? "#6366f1" : "var(--surface-muted)",
                      color: sortBy === k ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${sortBy === k ? "#6366f1" : "var(--border-subtle)"}`,
                    }}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: catHeight, position: "relative" }}>
              {loading
                ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
                : <Bar data={barData} options={barOptions as never} />
              }
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <h6 className="mb-2">Payment Mode Mix</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>Total collected: <strong>{formatCurrency(totalPayments)}</strong></div>
            <div style={{ height: 200, position: "relative" }}>
              {loading
                ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
                : paymentModes.length === 0
                  ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No payment data</div>
                  : <Doughnut data={donutData} options={donutOptions as never} />
              }
            </div>
            {!loading && paymentModes.slice(0, 5).map(([mode, val], i) => (
              <div key={mode} className="d-flex justify-content-between align-items-center mt-1">
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span style={{ fontSize: 11 }}>{mode}</span>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(val)}</span>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{totalPayments > 0 ? ((val / totalPayments) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesBreakdown;
