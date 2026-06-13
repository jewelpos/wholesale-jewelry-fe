"use client";

import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import { ProductListType } from "@/types/product";
import { num, formatCurrency, METAL_COLORS } from "./utils";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

type Props = { products: ProductListType[]; loading: boolean };

const MetalTypeBreakdown = ({ products, loading }: Props) => {
  const { byMetal, grandRevenue, grandCost } = useMemo(() => {
    const map: Record<string, { revenue: number; cost: number; qty: number; count: number }> = {};
    for (const p of products) {
      const key = p.itemmetal?.trim() || "Unspecified";
      if (!map[key]) map[key] = { revenue: 0, cost: 0, qty: 0, count: 0 };
      map[key].revenue += num(p.totalsoldvalue);
      map[key].cost += num(p.totalcostvalue);
      map[key].qty += num(p.itemquantityinhand);
      map[key].count += 1;
    }
    const sorted = Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
    return {
      byMetal: sorted,
      grandRevenue: sorted.reduce((s, [, d]) => s + d.revenue, 0),
      grandCost: sorted.reduce((s, [, d]) => s + d.cost, 0),
    };
  }, [products]);

  const [viewMode, setViewMode] = React.useState<"revenue" | "cost">("revenue");
  const values = byMetal.map(([, d]) => viewMode === "revenue" ? d.revenue : d.cost);
  const grand = viewMode === "revenue" ? grandRevenue : grandCost;

  const chartData = {
    labels: byMetal.map(([name]) => name),
    datasets: [{
      data: values,
      backgroundColor: byMetal.map((_, i) => METAL_COLORS[i % METAL_COLORS.length] + "cc"),
      borderColor: byMetal.map((_, i) => METAL_COLORS[i % METAL_COLORS.length]),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">Metal Type Breakdown</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {viewMode === "revenue" ? "Sold revenue" : "Inventory cost"} by metal
            </div>
          </div>
          <div className="d-flex gap-1">
            {(["revenue", "cost"] as const).map((m) => (
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
                {m === "revenue" ? "Sales" : "Stock"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
            <span className="text-muted small">Loading…</span>
          </div>
        ) : byMetal.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
            <span className="text-muted small">No metal type data. Ensure itemmetal is set on products.</span>
          </div>
        ) : (
          <>
            <div style={{ height: 160, position: "relative" }}>
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "62%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const pct = grand > 0 ? ((ctx.parsed / grand) * 100).toFixed(1) : "0.0";
                          return `  ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{formatCurrency(grand)}</div>
                <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{viewMode === "revenue" ? "sold" : "in stock"}</div>
              </div>
            </div>

            <div className="d-flex flex-column gap-1 mt-2" style={{ maxHeight: 200, overflowY: "auto" }}>
              {byMetal.map(([name, d], i) => {
                const val = viewMode === "revenue" ? d.revenue : d.cost;
                const pct = grand > 0 ? ((val / grand) * 100).toFixed(1) : "0.0";
                const color = METAL_COLORS[i % METAL_COLORS.length];
                return (
                  <div key={name} className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 min-w-0">
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                      <span className="text-truncate" style={{ fontSize: 12, color: "var(--text-primary)" }}>{name}</span>
                      <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>({d.count})</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <div style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: "var(--border-subtle)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", minWidth: 34, textAlign: "right" }}>{pct}%</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", minWidth: 60, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(val)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetalTypeBreakdown;
