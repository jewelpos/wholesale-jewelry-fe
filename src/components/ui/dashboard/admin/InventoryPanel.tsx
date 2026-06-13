"use client";
import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend } from "chart.js";
import { Package, AlertTriangle, XCircle, Clock } from "lucide-react";
import { num, formatCurrency } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

type ProductSummary = { total_products?: number; out_of_stock?: number; low_stock?: number; total_inventory_value?: number } | null;
type AgingRow = { inbound_aging_bucket?: string; total_cost?: number; itemquantityinhand?: number };

type Props = { productSummary: ProductSummary; agingRows: AgingRow[]; loading: boolean };

const BUCKET_ORDER = ["0-30", "31-90", "91-180", "181+"];
const BUCKET_COLORS: Record<string, string> = { "0-30": "#10b981", "31-90": "#f59e0b", "91-180": "#f97316", "181+": "#f43f5e" };

const InventoryPanel = ({ productSummary, agingRows, loading }: Props) => {
  const [agingView, setAgingView] = useState<"value" | "count">("value");

  const agingBuckets = useMemo(() => {
    const map: Record<string, { value: number; count: number }> = {};
    for (const r of agingRows) {
      const b = r.inbound_aging_bucket || "Unknown";
      if (!map[b]) map[b] = { value: 0, count: 0 };
      map[b].value += num(r.total_cost);
      map[b].count += 1;
    }
    const ordered = BUCKET_ORDER.map((b) => ({ bucket: b, ...(map[b] ?? { value: 0, count: 0 }) }));
    const totalValue = ordered.reduce((s, b) => s + b.value, 0);
    const riskValue = (map["91-180"]?.value ?? 0) + (map["181+"]?.value ?? 0);
    return { ordered, totalValue, riskValue };
  }, [agingRows]);

  const barData = {
    labels: BUCKET_ORDER.map((b) => b === "181+" ? "181d+" : `${b}d`),
    datasets: [{
      label: agingView === "value" ? "Stock Cost" : "Items",
      data: agingBuckets.ordered.map((b) => agingView === "value" ? b.value : b.count),
      backgroundColor: BUCKET_ORDER.map((b) => (BUCKET_COLORS[b] ?? "#94a3b8") + "bb"),
      borderColor: BUCKET_ORDER.map((b) => BUCKET_COLORS[b] ?? "#94a3b8"),
      borderWidth: 2, borderRadius: 5,
    }],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => agingView === "value" ? `  Value: ${formatCurrency(ctx.parsed.y)}` : `  Items: ${ctx.parsed.y}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: (v: unknown) => agingView === "value" ? formatCurrency(Number(v)) : String(v) }, grid: { color: "rgba(0,0,0,0.04)" } },
    },
  };

  const riskPct = agingBuckets.totalValue > 0 ? (agingBuckets.riskValue / agingBuckets.totalValue) * 100 : 0;

  const healthTiles = [
    { label: "Total SKUs", value: num(productSummary?.total_products), icon: Package, color: "#6366f1", bg: "#6366f120" },
    { label: "Inventory Value", value: formatCurrency(num(productSummary?.total_inventory_value)), icon: Package, color: "#10b981", bg: "#10b98120", raw: true },
    { label: "Low Stock", value: num(productSummary?.low_stock), icon: AlertTriangle, color: "#f59e0b", bg: "#f59e0b20" },
    { label: "Out of Stock", value: num(productSummary?.out_of_stock), icon: XCircle, color: "#f43f5e", bg: "#f43f5e20" },
  ] as const;

  return (
    <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <h6 className="mb-3">Inventory Health</h6>

        {/* Health tiles */}
        <div className="row g-2 mb-3">
          {healthTiles.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="col-6 col-md-3">
                <div className="p-2 rounded text-center" style={{ backgroundColor: t.bg, border: `1px solid ${t.color}30` }}>
                  <Icon size={16} color={t.color} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.color, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {"raw" in t ? t.value : new Intl.NumberFormat("en-US").format(t.value as number)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aging distribution */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div style={{ fontSize: 12, fontWeight: 600 }}>Inbound Aging Distribution</div>
          <div className="d-flex gap-1">
            {(["value", "count"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setAgingView(m)}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  backgroundColor: agingView === m ? "#6366f1" : "var(--surface-muted)",
                  color: agingView === m ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${agingView === m ? "#6366f1" : "var(--border-subtle)"}`,
                }}>
                {m === "value" ? "By Value" : "By Count"}
              </button>
            ))}
          </div>
        </div>

        {riskPct > 30 && (
          <div className="rounded px-2 py-1 mb-2 d-flex align-items-center gap-2" style={{ backgroundColor: "#fff1f2", fontSize: 11 }}>
            <Clock size={12} color="#f43f5e" />
            <span><strong style={{ color: "#f43f5e" }}>{riskPct.toFixed(0)}% of stock value</strong> ({formatCurrency(agingBuckets.riskValue)}) is aging 91d+</span>
          </div>
        )}

        <div style={{ height: 160, position: "relative" }}>
          {loading
            ? <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
            : <Bar data={barData} options={barOptions as never} />
          }
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
