"use client";

import React from "react";

export interface SummaryCardDef {
  label: string;
  value: number | string | null | undefined;
  format?: "currency" | "number" | "percent" | "text";
  accent?: string; // kept for backward compatibility, no longer used for styling
  bg?: string;     // kept for backward compatibility, no longer used for styling
  subtext?: string;
}

interface Props {
  cards: SummaryCardDef[];
  loading?: boolean;
}

const fmt = {
  currency: (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v),
  number: (v: number) => new Intl.NumberFormat("en-US").format(Math.round(v)),
  percent: (v: number) => `${Number(v).toFixed(1)}%`,
  text: (v: string | number) => String(v),
};

function formatValue(
  value: number | string | null | undefined,
  format: SummaryCardDef["format"] = "currency"
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "text") return fmt.text(value as string);
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (format === "currency") return fmt.currency(n);
  if (format === "number") return fmt.number(n);
  if (format === "percent") return fmt.percent(n);
  return String(value);
}

const SkeletonValue = () => (
  <div
    style={{
      height: 28,
      width: "65%",
      background: "linear-gradient(90deg, var(--border-subtle) 25%, var(--surface-muted) 50%, var(--border-subtle) 75%)",
      backgroundSize: "200% 100%",
      borderRadius: 6,
      animation: "reportSkeleton 1.4s ease-in-out infinite",
    }}
  />
);

export default function ReportSummaryCards({ cards, loading }: Props) {
  if (!cards.length) return null;

  const colClass =
    cards.length <= 2
      ? "col-12 col-md-6"
      : cards.length === 3
      ? "col-12 col-md-4"
      : "col-6 col-md-3";

  return (
    <>
      <style>{`
        @keyframes reportSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="row g-2 mb-3">
        {cards.map((card, i) => (
          <div key={i} className={colClass}>
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
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {card.label}
              </div>
              {loading ? (
                <SkeletonValue />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.15,
                      marginBottom: card.subtext ? 4 : 0,
                    }}
                  >
                    {formatValue(card.value, card.format)}
                  </div>
                  {card.subtext && (
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                      {card.subtext}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
