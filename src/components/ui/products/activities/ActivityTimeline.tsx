"use client";

import React from "react";
import dayjs from "dayjs";
import { ProductActivityChartPoint } from "@/types/product";

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; text: string; label: string; icon: string }> = {
  purchase:   { color: "#198754", bg: "#dcfce7", border: "#86efac", text: "#166534", label: "Purchase",   icon: "↓" },
  invoice:    { color: "#dc3545", bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", label: "Sale",       icon: "↑" },
  memo:       { color: "#0891b2", bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e", label: "Memo",       icon: "✎" },
  adjustment: { color: "#fd7e14", bg: "#ffedd5", border: "#fdba74", text: "#9a3412", label: "Adjustment", icon: "~" },
  return:     { color: "#0d6efd", bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", label: "Return",     icon: "↩" },
  transfer:   { color: "#7c3aed", bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8", label: "Transfer",   icon: "⇄" },
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
}

const ActivityTimeline = ({ data }: Props) => {
  if (!data.length) {
    return (
      <div className="card mb-3 border-0 shadow-sm">
        <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 120 }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No transactions to display</div>
        </div>
      </div>
    );
  }

  const reversed = [...data].reverse();

  return (
    <div className="card mb-3 border-0 shadow-sm">
      <div className="card-body p-3">
        <div className="fw-semibold mb-3" style={{ fontSize: 14 }}>
          Item Activity Timeline
          <span className="text-muted ms-2" style={{ fontSize: 12, fontWeight: 400 }}>{data.length} transactions</span>
        </div>

        <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          <div style={{ position: "relative", paddingLeft: 32 }}>
            <div style={{ position: "absolute", left: 11, top: 6, bottom: 6, width: 2, background: "#e2e8f0", borderRadius: 2 }} />

            {reversed.map((item, i) => {
              const key = resolveKey(item.transaction_type);
              const cfg = TYPE_CONFIG[key];
              const isPositive = (item.quantity ?? 0) > 0;
              const date = dayjs(Number(item.transation_date)).format("MMM DD, YYYY");

              return (
                <div key={i} style={{ position: "relative", marginBottom: 10 }}>
                  <div style={{
                    position: "absolute", left: -21, top: 10,
                    width: 14, height: 14, borderRadius: "50%",
                    background: cfg.color,
                    border: "2px solid #fff",
                    boxShadow: `0 0 0 2px ${cfg.color}33`,
                    zIndex: 1,
                  }} />

                  <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 8, padding: "8px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                          {cfg.icon} {cfg.label.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{date}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isPositive ? "#198754" : "#dc3545", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {isPositive ? "+" : ""}{item.quantity}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        <span className="fw-medium">{item.reference}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        bal: <span style={{ color: "#475569", fontWeight: 600 }}>{item.running_balance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
