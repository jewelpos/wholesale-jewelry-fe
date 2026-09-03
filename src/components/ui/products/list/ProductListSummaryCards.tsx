"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtCurrency = (n: number) => formatCurrency(n);

const CARDS = [
  { key: "total_products"       as const, label: "Total Products",    format: fmtNum },
  { key: "out_of_stock"         as const, label: "Out of Stock",       format: fmtNum },
  { key: "low_stock"            as const, label: "Low Stock (≤5)",     format: fmtNum },
  { key: "total_inventory_value" as const, label: "Inventory Value",   format: fmtCurrency },
  { key: "total_pcs"            as const, label: "Total Pcs",          format: fmtNum },
  { key: "total_quantity"       as const, label: "Total Quantity (Wt)", format: fmtNum },
];

const Skeleton = () => (
  <div style={{ height: 28, width: "60%", background: "var(--border-subtle)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
);

type Props = {
  stats?: Record<string, unknown> | null;
  loading?: boolean;
  showFinancial?: boolean;
  // Last on-demand recalculation for the grid's current search/filter/pill selection —
  // null until the user clicks Recalculate. Rendered as a small comparison line under
  // the static (unfiltered) total so both numbers are visible at once.
  filteredStats?: Record<string, unknown> | null;
};

const ProductListSummaryCards = ({ stats, loading, showFinancial = true, filteredStats }: Props) => {
  const cards = showFinancial ? CARDS : CARDS.filter((c) => c.key !== "total_inventory_value");
  return (
    <div className="row g-2 mb-3">
      {cards.map((card) => {
        const value = Number(stats?.[card.key] ?? 0);
        return (
          <div key={card.key} className="col-6 col-md-2">
            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                padding: "12px 16px",
                height: "100%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                {card.label}
              </div>
              {loading ? (
                <Skeleton />
              ) : (
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15 }}>
                  {card.format(value)}
                </div>
              )}
              {filteredStats && (
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                  Filtered: {card.format(Number(filteredStats[card.key] ?? 0))}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default ProductListSummaryCards;
