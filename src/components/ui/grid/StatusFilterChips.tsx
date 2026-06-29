"use client";

import React, { useState } from "react";

interface Counts {
  total: number;
  paid: number;
  pending: number;
  voided: number;
}

interface Props {
  active: string | null;
  onChange: (v: string | null) => void;
  counts: Counts;
}

const CHIPS: {
  label: string;
  key: keyof Counts;
  filter: string | null;
  tooltip: string;
}[] = [
  { label: "All",    key: "total",   filter: null,   tooltip: "Show all records" },
  { label: "Paid",   key: "paid",    filter: "paid",  tooltip: "Paid · Fulfilled · Shipped · Closed · Ready" },
  { label: "Open",   key: "pending", filter: "open",  tooltip: "Open · Pending · Active · Confirmed" },
  { label: "Voided", key: "voided",  filter: "void",  tooltip: "Voided · Cancelled · Returned · Rejected" },
];

const StatusFilterChips: React.FC<Props> = ({ active, onChange, counts }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {CHIPS.map((chip) => {
        const isActive = active === chip.filter;
        const count = counts[chip.key] ?? 0;
        const showTooltip = hoveredKey === chip.label;

        return (
          <div
            key={chip.label}
            style={{ position: "relative", display: "inline-flex" }}
            onMouseEnter={() => setHoveredKey(chip.label)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <button
              type="button"
              onClick={() => onChange(isActive ? null : chip.filter)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                background: isActive ? "var(--accent)" : "var(--surface-muted)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
              }}
            >
              {chip.label}
              <span
                style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : "var(--border-subtle)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  borderRadius: 10,
                  padding: "0 5px",
                  fontSize: 11,
                  fontWeight: 600,
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {count}
              </span>
            </button>

            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1e293b",
                  color: "#f8fafc",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "5px 10px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  zIndex: 9999,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {chip.tooltip}
                {/* arrow */}
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderWidth: "4px 4px 0",
                    borderStyle: "solid",
                    borderColor: "#1e293b transparent transparent",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusFilterChips;
