"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Star, Award } from "lucide-react";
import { WarehouseSalesSummary } from "@/types/reports";
import { MONTH_KEYS, MONTH_LABELS, num, formatCurrency } from "./utils";

type Props = {
  currentTotals: Partial<WarehouseSalesSummary> | null;
  priorTotals: Partial<WarehouseSalesSummary> | null;
  selectedYear: number;
  loading: boolean;
};

const ForecastPanel = ({ currentTotals, priorTotals, selectedYear, loading }: Props) => {
  const { nextMonthProjection, yoyGrowth, bestMonth, avgMargin } = useMemo(() => {
    const monthValues = MONTH_KEYS.map((k) => num((currentTotals as Record<string, number> | null)?.[k]));

    // 3-month moving average ending at the last non-zero month
    const lastNonZero = monthValues.reduce((last, v, i) => (v > 0 ? i : last), -1);
    const slice = lastNonZero >= 2
      ? monthValues.slice(Math.max(0, lastNonZero - 2), lastNonZero + 1)
      : monthValues.slice(0, 3);
    const nextMonthProjection = slice.length > 0 ? slice.reduce((s, v) => s + v, 0) / slice.length : 0;

    // YoY growth
    const currentTotal = num(currentTotals?.total_sales);
    const priorTotal = num(priorTotals?.total_sales);
    const yoyGrowth = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal) * 100 : null;

    // Best month
    const bestIdx = monthValues.reduce((best, v, i) => (v > monthValues[best] ? i : best), 0);
    const bestMonth = { label: MONTH_LABELS[bestIdx], value: monthValues[bestIdx] };

    // Avg margin
    const avgMargin = num(currentTotals?.profit_margin_percent);

    return { nextMonthProjection, yoyGrowth, bestMonth, avgMargin };
  }, [currentTotals, priorTotals]);

  const tiles = [
    {
      label: "Projected Next Month",
      value: formatCurrency(nextMonthProjection),
      sub: "3-month moving avg",
      icon: TrendingUp,
      accent: "#6366f1",
      bg: "var(--tile-indigo-bg)",
    },
    {
      label: "YoY Growth",
      value: yoyGrowth !== null ? `${yoyGrowth >= 0 ? "+" : ""}${yoyGrowth.toFixed(1)}%` : "—",
      sub: `vs ${selectedYear - 1}`,
      icon: yoyGrowth !== null && yoyGrowth >= 0 ? TrendingUp : TrendingDown,
      accent: yoyGrowth !== null && yoyGrowth >= 0 ? "#10b981" : "#f43f5e",
      bg: yoyGrowth !== null && yoyGrowth >= 0 ? "var(--tile-emerald-bg)" : "var(--tile-rose-bg)",
    },
    {
      label: "Best Month",
      value: bestMonth.value > 0 ? bestMonth.label : "—",
      sub: bestMonth.value > 0 ? formatCurrency(bestMonth.value) : "No data",
      icon: Star,
      accent: "#f59e0b",
      bg: "var(--tile-amber-bg)",
    },
    {
      label: "Avg Gross Margin",
      value: `${avgMargin.toFixed(1)}%`,
      sub: "All categories YTD",
      icon: Award,
      accent: avgMargin >= 20 ? "#10b981" : avgMargin >= 10 ? "#f59e0b" : "#f43f5e",
      bg: avgMargin >= 20 ? "var(--tile-emerald-bg)" : avgMargin >= 10 ? "var(--tile-amber-bg)" : "var(--tile-rose-bg)",
    },
  ];

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--tile-indigo), var(--tile-violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={15} color="#fff" />
          </div>
          <div>
            <h6 className="mb-0">Sales Intelligence</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Client-side forecasts from YTD data</div>
          </div>
        </div>

        <div className="row g-2">
          {tiles.map(({ label, value, sub, icon: Icon, accent, bg }) => (
            <div key={label} className="col-6 col-xl-3">
              <div
                className="p-3 h-100"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderTop: `3px solid ${accent}`,
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--surface-card)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Icon size={13} style={{ color: accent }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                  {loading ? "—" : value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastPanel;
