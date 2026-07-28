"use client";

import React from "react";
import dayjs from "dayjs";
import { ProductActivityChartPoint } from "@/types/product";

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; text: string; label: string; icon: string }> = {
  purchase:        { color: "#198754", bg: "#dcfce7", border: "#86efac", text: "#166534", label: "Purchase",       icon: "↓" },
  sale:             { color: "#dc3545", bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", label: "Sale",           icon: "↑" },
  memo:             { color: "#0891b2", bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e", label: "Memo",           icon: "✎" },
  // Credit memo (a return against a memo) shares salemodeid range (6, 8) with a regular
  // memo in the raw feed, but is a stock-in reversal, not a fresh commitment — distinct tag.
  memo_credit:      { color: "#0d9488", bg: "#ccfbf1", border: "#5eead4", text: "#0f766e", label: "Memo Credit",    icon: "↩" },
  adjustment:       { color: "#fd7e14", bg: "#ffedd5", border: "#fdba74", text: "#9a3412", label: "Adjustment",     icon: "~" },
  // Sales return (stock IN) and supplier return (stock OUT) move stock in opposite
  // directions — kept visually and categorically distinct rather than one shared "Return".
  sales_return:     { color: "#0d6efd", bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", label: "Sales Return",    icon: "↩" },
  supplier_return:  { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", text: "#92400e", label: "Supplier Return", icon: "↪" },
  transfer:         { color: "#7c3aed", bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8", label: "Transfer",       icon: "⇄" },
};

// activity_category comes straight from the backend view (driven by salemodeid, not
// string-matching on transaction_type, which for sales rows is the raw salemode name and
// can't be reliably substring-matched — e.g. "Purchase Invoice" contains "purchase").
const resolveKey = (type: string, category?: string): string => {
  if (category && TYPE_CONFIG[category]) return category;
  const lower = type?.toLowerCase() ?? "";
  if (lower.includes("memo") && lower.includes("credit")) return "memo_credit";
  if (lower.includes("memo")) return "memo";
  if (lower.includes("purchase") || lower.includes("receive")) return "purchase";
  if (lower.includes("supplier") && lower.includes("return")) return "supplier_return";
  if (lower.includes("return")) return "sales_return";
  if (lower.includes("invoice") || lower.includes("sale")) return "sale";
  if (lower.includes("adjust")) return "adjustment";
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
              const key = resolveKey(item.transaction_type, item.activity_category);
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
