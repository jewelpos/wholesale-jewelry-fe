"use client";
import React, { useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarController, BarElement, LineController, LineElement,
  PointElement, Tooltip, Legend,
} from "chart.js";
import { num, formatCurrency, MONTH_LABELS, MONTH_KEYS, MonthTotals, marginColor } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Tooltip, Legend);

type Props = {
  currentTotals: MonthTotals | null;
  priorTotals: MonthTotals | null;
  currentRows: Record<string, number | string>[];
  selectedYear: number;
  loading: boolean;
};

type ViewMode = "revenue" | "profit" | "margin";

const RevenueTrend = ({ currentTotals, priorTotals, currentRows, selectedYear, loading }: Props) => {
  const [mode, setMode] = useState<ViewMode>("revenue");

  const curMonths = MONTH_KEYS.map((k) => num(currentTotals?.[k]));
  const priMonths = MONTH_KEYS.map((k) => num(priorTotals?.[k]));

  // Month-level margin%: need per-month profit and sales
  // We aggregate rows by month to get cost
  const monthlyProfit = MONTH_KEYS.map((k, i) => {
    const sales = curMonths[i];
    // estimate profit from margin: profit_margin_percent on totals is an avg — use per-row approach
    const totalSales = num(currentTotals?.total_sales);
    const totalProfit = num(currentTotals?.total_profit);
    return totalSales > 0 ? (sales * totalProfit) / totalSales : 0;
  });
  const monthlyMarginPct = curMonths.map((s, i) => s > 0 ? (monthlyProfit[i] / s) * 100 : 0);

  const priorProfit = MONTH_KEYS.map((k, i) => {
    const sales = priMonths[i];
    const totalSales = num(priorTotals?.total_sales);
    const totalProfit = num(priorTotals?.total_profit);
    return totalSales > 0 ? (sales * totalProfit) / totalSales : 0;
  });

  const getDatasets = () => {
    if (mode === "revenue") return [
      { type: "bar" as const, label: `${selectedYear} Revenue`, data: curMonths, backgroundColor: "rgba(99,102,241,0.7)", borderColor: "#6366f1", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "bar" as const, label: `${selectedYear - 1} Revenue`, data: priMonths, backgroundColor: "rgba(148,163,184,0.35)", borderColor: "#94a3b8", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "line" as const, label: "Margin %", data: monthlyMarginPct, borderColor: "#10b981", backgroundColor: "transparent", borderWidth: 2, pointRadius: 3, tension: 0.4, yAxisID: "y2" },
    ];
    if (mode === "profit") return [
      { type: "bar" as const, label: `${selectedYear} Profit`, data: monthlyProfit, backgroundColor: "rgba(16,185,129,0.7)", borderColor: "#10b981", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "bar" as const, label: `${selectedYear - 1} Profit`, data: priorProfit, backgroundColor: "rgba(148,163,184,0.35)", borderColor: "#94a3b8", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "line" as const, label: "Margin %", data: monthlyMarginPct, borderColor: "#6366f1", backgroundColor: "transparent", borderWidth: 2, pointRadius: 3, tension: 0.4, yAxisID: "y2" },
    ];
    // margin mode
    return [
      { type: "line" as const, label: `${selectedYear} Margin %`, data: monthlyMarginPct, borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 2, pointRadius: 4, tension: 0.4, fill: true, yAxisID: "y2" },
      { type: "line" as const, label: `${selectedYear - 1} Margin %`, data: MONTH_KEYS.map((_, i) => priorProfit[i] > 0 && priMonths[i] > 0 ? (priorProfit[i] / priMonths[i]) * 100 : 0), borderColor: "#94a3b8", backgroundColor: "transparent", borderWidth: 2, borderDash: [4, 4], pointRadius: 3, tension: 0.4, yAxisID: "y2" },
    ];
  };

  const data = { labels: MONTH_LABELS, datasets: getDatasets() };

  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 }, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string; yAxisID?: string }; parsed: { y: number | null } }) => {
            const v = ctx.parsed.y ?? 0;
            return ctx.dataset.yAxisID === "y2"
              ? `  ${ctx.dataset.label}: ${v.toFixed(1)}%`
              : `  ${ctx.dataset.label}: ${formatCurrency(v)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        position: "left" as const, beginAtZero: true,
        ticks: { font: { size: 10 }, callback: (v: unknown) => formatCurrency(Number(v)) },
        grid: { color: "rgba(0,0,0,0.04)" },
        display: mode !== "margin",
      },
      y2: {
        position: "right" as const, beginAtZero: true,
        ticks: { font: { size: 10 }, callback: (v: unknown) => `${Number(v).toFixed(0)}%` },
        grid: { display: false },
      },
    },
  };

  const totRevenue = num(currentTotals?.total_sales);
  const totProfit = num(currentTotals?.total_profit);
  const totMargin = num(currentTotals?.profit_margin_percent);

  return (
    <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Revenue & Profit Trend</h6>
            <div className="d-flex gap-3 flex-wrap">
              {[
                { label: "Revenue", value: formatCurrency(totRevenue), color: "#6366f1" },
                { label: "Gross Profit", value: formatCurrency(totProfit), color: "#10b981" },
                { label: "Margin", value: formatPct(totMargin), color: marginColor(totMargin) },
              ].map((s) => (
                <span key={s.label} style={{ fontSize: 11 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{s.label}: </span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="d-flex gap-1">
            {(["revenue", "profit", "margin"] as ViewMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  backgroundColor: mode === m ? "#6366f1" : "var(--surface-muted)",
                  color: mode === m ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${mode === m ? "#6366f1" : "var(--border-subtle)"}`,
                }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 260, position: "relative" }}>
          {loading
            ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
            : <Chart type="bar" data={data as never} options={options as never} />
          }
        </div>
      </div>
    </div>
  );
};

const formatPct = (n: number) => `${n.toFixed(1)}%`;

export default RevenueTrend;
