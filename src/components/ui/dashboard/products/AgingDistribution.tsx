"use client";

import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend, ChartOptions } from "chart.js";
import { ItemAgingSummary } from "@/types/product";
import { num, formatCurrency, agingColor, AGING_BUCKET_COLORS } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

type Props = { agingData: ItemAgingSummary[]; loading: boolean };
type ViewMode = "count" | "value";

const BUCKET_ORDER = ["0-30", "31-90", "91-180", "181+"];
const BUCKET_LABELS: Record<string, string> = { "0-30": "0-30d", "31-90": "31-90d", "91-180": "91-180d", "181+": "181d+" };

const AgingDistribution = ({ agingData, loading }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>("value");

  const { buckets, totalValue, totalItems, capitalAtRisk } = useMemo(() => {
    const map: Record<string, { count: number; value: number; qty: number }> = {};
    for (const r of agingData) {
      const b = r.inbound_aging_bucket || "Unknown";
      if (!map[b]) map[b] = { count: 0, value: 0, qty: 0 };
      map[b].count += 1;
      map[b].value += num(r.total_cost);
      map[b].qty += num(r.itemquantityinhand);
    }
    const buckets = BUCKET_ORDER.map((b) => ({ label: BUCKET_LABELS[b] ?? b, bucket: b, ...map[b] ?? { count: 0, value: 0, qty: 0 } }));
    const totalValue = agingData.reduce((s, r) => s + num(r.total_cost), 0);
    const totalItems = agingData.length;
    const capitalAtRisk = (map["181+"]?.value ?? 0) + (map["91-180"]?.value ?? 0);
    return { buckets, totalValue, totalItems, capitalAtRisk };
  }, [agingData]);

  const data = {
    labels: buckets.map((b) => b.label),
    datasets: [{
      label: viewMode === "value" ? "Stock Cost ($)" : "Item Count",
      data: buckets.map((b) => viewMode === "value" ? b.value : b.count),
      backgroundColor: BUCKET_ORDER.map((b) => agingColor(b) + "bb"),
      borderColor: BUCKET_ORDER.map((b) => agingColor(b)),
      borderWidth: 2,
      borderRadius: 5,
    }],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => viewMode === "value"
            ? `  Stock value: ${formatCurrency(num(ctx.parsed.y))}`
            : `  Items: ${ctx.parsed.y}`,
          afterLabel: (ctx) => {
            const b = buckets[ctx.dataIndex];
            return viewMode === "value"
              ? `  Items: ${b.count} · Qty: ${b.qty}`
              : `  Value: ${formatCurrency(b.value)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ticks: { font: { size: 10 }, callback: (v: any) => viewMode === "value" ? formatCurrency(Number(v)) : String(v) },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
    },
  };

  const riskPct = totalValue > 0 ? ((capitalAtRisk / totalValue) * 100).toFixed(0) : "0";

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">Inventory Aging Distribution</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {totalItems} SKUs · {formatCurrency(totalValue)} total stock value
            </div>
          </div>
          <div className="d-flex gap-1">
            {(["value", "count"] as ViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className="btn btn-sm"
                style={{
                  fontSize: 11, padding: "2px 10px",
                  backgroundColor: viewMode === m ? "#6366f1" : "var(--surface-muted)",
                  color: viewMode === m ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${viewMode === m ? "#6366f1" : "var(--border-subtle)"}`,
                  borderRadius: 20,
                }}
              >
                {m === "value" ? "By Value" : "By Count"}
              </button>
            ))}
          </div>
        </div>

        {Number(riskPct) > 30 && (
          <div className="rounded px-2 py-1 mb-2" style={{ backgroundColor: "#fff1f2", fontSize: 11 }}>
            <span className="fw-semibold text-danger">⚠ {riskPct}% of stock value</span>
            <span className="text-muted"> ({formatCurrency(capitalAtRisk)}) is in aging 91d+ buckets</span>
          </div>
        )}

        <div style={{ height: 200, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : (
            <Bar data={data} options={options} />
          )}
        </div>

        {!loading && (
          <div className="d-flex gap-3 mt-2 flex-wrap">
            {buckets.map((b) => (
              <div key={b.bucket} className="text-center">
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: agingColor(b.bucket), display: "inline-block", marginRight: 4 }} />
                <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{b.label}: </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: agingColor(b.bucket) }}>{b.count} items</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgingDistribution;
