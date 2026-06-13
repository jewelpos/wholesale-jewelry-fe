"use client";

import React, { useMemo } from "react";
import { ProductActivityChartPoint } from "@/types/product";

const TYPE_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  purchase:   { label: "Purchase",   bg: "#dcfce7", border: "#86efac", text: "#166534" },
  invoice:    { label: "Sale",       bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  memo:       { label: "Memo",       bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e" },
  adjustment: { label: "Adjustment", bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
  return:     { label: "Return",     bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  transfer:   { label: "Transfer",   bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8" },
};

const resolveKey = (type: string): string => {
  const lower = type?.toLowerCase() ?? "";
  if (lower.includes("memo")) return "memo";
  if (lower.includes("purchase") || lower.includes("receive")) return "purchase";
  if (lower.includes("invoice") || lower.includes("sale")) return "invoice";
  if (lower.includes("adjust")) return "adjustment";
  if (lower.includes("return")) return "return";
  if (lower.includes("transfer")) return "transfer";
  return "adjustment";
};

interface Props {
  data: ProductActivityChartPoint[];
  onHandQty?: number | null;
  availableQty?: number | null;
}

const ActivitySummaryChart = ({ data, onHandQty, availableQty }: Props) => {
  const summary = useMemo(() => {
    const map: Record<string, { txns: number; qty: number }> = {};
    for (const d of data) {
      const key = resolveKey(d.transaction_type);
      if (!map[key]) map[key] = { txns: 0, qty: 0 };
      map[key].txns += 1;
      map[key].qty += Math.abs(Number(d.quantity ?? 0));
    }
    return map;
  }, [data]);

  const total = data.length;

  if (!total) {
    return (
      <div className="card mb-3 border-0 shadow-sm h-100">
        <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 180 }}>
          <i data-feather="pie-chart" style={{ width: 32, height: 32, color: "#cbd5e1", marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Activity breakdown will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3 border-0 shadow-sm h-100">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div className="fw-semibold" style={{ fontSize: 14 }}>Activity Breakdown</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{total} transactions</div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {/* On Hand + Available Qty cards */}
          {onHandQty !== null && (
            <div style={{ flex: "1 1 calc(50% - 4px)", padding: "8px 12px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #cbd5e1" }}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.3px" }}>ON HAND</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{onHandQty}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>current stock balance</div>
            </div>
          )}
          {availableQty !== null && availableQty !== undefined && (
            <div style={{ flex: "1 1 calc(50% - 4px)", padding: "8px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
              <div style={{ fontSize: 10, color: "#166534", fontWeight: 600, letterSpacing: "0.3px" }}>AVAILABLE</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#166534", lineHeight: 1.3 }}>{availableQty}</div>
              <div style={{ fontSize: 11, color: "#166534", opacity: 0.75 }}>available to sell</div>
            </div>
          )}

          {/* One card per transaction type */}
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const s = summary[key];
            if (!s) return null;
            return (
              <div key={key} style={{
                flex: "1 1 calc(50% - 4px)",
                padding: "8px 12px",
                borderRadius: 8,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}>
                <div style={{ fontSize: 10, color: cfg.text, fontWeight: 600, letterSpacing: "0.3px" }}>{cfg.label.toUpperCase()}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: cfg.text, lineHeight: 1.3 }}>{s.qty}</div>
                <div style={{ fontSize: 11, color: cfg.text, opacity: 0.75 }}>{s.txns} transaction{s.txns !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivitySummaryChart;
