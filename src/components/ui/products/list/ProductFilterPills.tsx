"use client";

import React from "react";

const SOLD_GROUP = new Set(["soldtoday", "soldweek", "soldmonth"]);

const PILLS: {
  key: string;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "new",       label: "NEW",         color: "#16a34a", bg: "#dcfce7" },
  { key: "bulk",      label: "Bulk Discount",color: "#2563eb", bg: "#dbeafe" },
  { key: "promo",     label: "On Promo",    color: "#d97706", bg: "#fef3c7" },
  { key: "zerostock", label: "Zero Stock",  color: "#dc2626", bg: "#fee2e2" },
  { key: "soldtoday", label: "Sold Today",  color: "#0d9488", bg: "#ccfbf1" },
  { key: "soldweek",  label: "This Week",   color: "#0d9488", bg: "#ccfbf1" },
  { key: "soldmonth", label: "This Month",  color: "#0d9488", bg: "#ccfbf1" },
];

interface Props {
  activeFilters: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
}

const ProductFilterPills: React.FC<Props> = ({ activeFilters, onToggle, onClear }) => {
  const hasSoldSeparator = (key: string) => key === "soldtoday";
  const anyActive = activeFilters.size > 0;

  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "4px 8px 6px" }}>
      {PILLS.map((pill, i) => {
        const active = activeFilters.has(pill.key);
        const showDivider = hasSoldSeparator(pill.key) && i > 0;
        return (
          <React.Fragment key={pill.key}>
            {showDivider && (
              <div style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 2px" }} />
            )}
            <button
              onClick={() => onToggle(pill.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${pill.color}`,
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "all 0.12s",
                background: active ? pill.color : "transparent",
                color: active ? "#fff" : pill.color,
                lineHeight: "18px",
              }}
            >
              {pill.label}
            </button>
          </React.Fragment>
        );
      })}
      {anyActive && (
        <button
          onClick={onClear}
          style={{
            marginLeft: 4,
            fontSize: 11,
            color: "#94a3b8",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            textDecoration: "underline",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default ProductFilterPills;
