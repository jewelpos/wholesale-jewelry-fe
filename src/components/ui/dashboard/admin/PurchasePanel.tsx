"use client";
import React, { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarController, BarElement, LineController, LineElement,
  PointElement, Tooltip, Legend,
} from "chart.js";
import { num, formatCurrency, MONTH_KEYS, MONTH_LABELS, MonthTotals } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Tooltip, Legend);

type PurchaseRow = {
  supplier?: string; supplierid?: number; year?: number;
  total_purchase_amount?: number; total_purchases?: number; total_amount_paid?: number; total_balance_due?: number;
  jan?: number; feb?: number; mar?: number; apr?: number; may?: number; jun?: number;
  jul?: number; aug?: number; sep?: number; oct?: number; nov?: number; dec?: number;
};

type Props = { purchaseRows: PurchaseRow[]; salesTotals: MonthTotals | null; selectedYear: number; loading: boolean };

const PurchasePanel = ({ purchaseRows, salesTotals, selectedYear, loading }: Props) => {
  const { monthlyPurchases, topSuppliers, totalPurchase, totalPaid, totalBalanceDue } = useMemo(() => {
    const monthlyPurchases = Array(12).fill(0) as number[];
    const supplierMap: Record<string, { amount: number; count: number; paid: number; balance: number }> = {};
    let totalPurchase = 0, totalPaid = 0, totalBalanceDue = 0;

    for (const r of purchaseRows) {
      if (num(r.year) !== selectedYear) continue;
      totalPurchase += num(r.total_purchase_amount);
      totalPaid += num(r.total_amount_paid);
      totalBalanceDue += num(r.total_balance_due);
      MONTH_KEYS.forEach((k, i) => { monthlyPurchases[i] += num(r[k]); });
      const s = r.supplier || "Unknown";
      if (!supplierMap[s]) supplierMap[s] = { amount: 0, count: 0, paid: 0, balance: 0 };
      supplierMap[s].amount += num(r.total_purchase_amount);
      supplierMap[s].count  += num(r.total_purchases);
      supplierMap[s].paid   += num(r.total_amount_paid);
      supplierMap[s].balance += num(r.total_balance_due);
    }

    const topSuppliers = Object.entries(supplierMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 8);

    return { monthlyPurchases, topSuppliers, totalPurchase, totalPaid, totalBalanceDue };
  }, [purchaseRows, selectedYear]);

  const monthlySales = MONTH_KEYS.map((k) => num(salesTotals?.[k]));
  const buyingRatio = monthlySales.map((s, i) => s > 0 ? (monthlyPurchases[i] / s) * 100 : 0);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      { type: "bar" as const, label: "Purchases", data: monthlyPurchases, backgroundColor: "rgba(6,182,212,0.65)", borderColor: "#06b6d4", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "bar" as const, label: "Sales", data: monthlySales, backgroundColor: "rgba(99,102,241,0.35)", borderColor: "#6366f1", borderWidth: 1, borderRadius: 4, yAxisID: "y" },
      { type: "line" as const, label: "Buy Ratio %", data: buyingRatio, borderColor: "#f59e0b", backgroundColor: "transparent", borderWidth: 2, pointRadius: 3, tension: 0.4, yAxisID: "y2" },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 }, padding: 10 } },
      tooltip: { callbacks: { label: (ctx: { dataset: { label?: string; yAxisID?: string }; parsed: { y: number } }) =>
        ctx.dataset.yAxisID === "y2" ? `  ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%` : `  ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { position: "left" as const, beginAtZero: true, ticks: { font: { size: 10 }, callback: (v: unknown) => formatCurrency(Number(v)) }, grid: { color: "rgba(0,0,0,0.04)" } },
      y2: { position: "right" as const, beginAtZero: true, ticks: { font: { size: 10 }, callback: (v: unknown) => `${Number(v).toFixed(0)}%` }, grid: { display: false } },
    },
  };

  const maxSupplier = Math.max(...topSuppliers.map(([, d]) => d.amount), 1);

  return (
    <div className="row g-3">
      <div className="col-lg-7">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 className="mb-1">Purchase vs Sales Trend</h6>
                <div className="d-flex gap-3 flex-wrap">
                  {[
                    { label: "Total Purchases", value: formatCurrency(totalPurchase), color: "#06b6d4" },
                    { label: "Paid", value: formatCurrency(totalPaid), color: "#10b981" },
                    { label: "Balance Due", value: formatCurrency(totalBalanceDue), color: "#f43f5e" },
                  ].map((s) => (
                    <span key={s.label} style={{ fontSize: 11 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{s.label}: </span>
                      <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: 230, position: "relative" }}>
              {loading
                ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
                : <Chart type="bar" data={chartData as never} options={chartOptions as never} />
              }
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
          <div className="card-body">
            <h6 className="mb-2">Top Suppliers by Spend</h6>
            {loading && <div className="text-muted text-center py-3" style={{ fontSize: 12 }}>Loading…</div>}
            {topSuppliers.map(([name, d], i) => (
              <div key={name} className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 700, width: 16, color: i < 3 ? "#f59e0b" : "var(--text-tertiary)" }}>{i + 1}</span>
                    <span className="text-truncate" style={{ fontSize: 11, fontWeight: 600, maxWidth: 130 }}>{name}</span>
                  </div>
                  <div className="text-end">
                    <div style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(d.amount)}</div>
                    {d.balance > 0 && <div style={{ fontSize: 9, color: "#f43f5e" }}>Owed: {formatCurrency(d.balance)}</div>}
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, backgroundColor: "var(--border-subtle)", overflow: "hidden" }}>
                  <div style={{ width: `${(d.amount / maxSupplier) * 100}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #06b6d4, #6366f1)" }} />
                </div>
              </div>
            ))}
            {!loading && topSuppliers.length === 0 && <div className="text-muted text-center py-3" style={{ fontSize: 12 }}>No purchase data for {selectedYear}.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePanel;
