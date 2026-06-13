"use client";

import React, { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { WarehouseSalesSummary } from "@/types/reports";
import { MONTH_KEYS, MONTH_LABELS, num, formatCurrency } from "./utils";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, BarController,
  LineElement, LineController, PointElement, Tooltip, Legend
);

type Props = {
  currentData: WarehouseSalesSummary[];
  priorData: WarehouseSalesSummary[];
  currentTotals: Partial<WarehouseSalesSummary> | null;
  priorTotals: Partial<WarehouseSalesSummary> | null;
  selectedYear: number;
  loading: boolean;
};

const RevenueProfitTrend = ({ currentData, priorData, currentTotals, priorTotals, selectedYear, loading }: Props) => {
  const { revenueData, priorRevenueData, marginData, totalRevenue, totalProfit, overallMargin } = useMemo(() => {
    const sumMonth = (rows: WarehouseSalesSummary[], key: (typeof MONTH_KEYS)[number]) =>
      rows.reduce((s, r) => s + num(r[key]), 0);

    const revenueData = MONTH_KEYS.map((k) =>
      currentTotals ? num((currentTotals as Record<string, number>)[k]) : sumMonth(currentData, k)
    );
    const priorRevenueData = MONTH_KEYS.map((k) =>
      priorTotals ? num((priorTotals as Record<string, number>)[k]) : sumMonth(priorData, k)
    );

    const revenuePerMonth = revenueData;
    const costPerMonth = MONTH_KEYS.map((_, i) => {
      const monthRevenue = revenuePerMonth[i];
      const marginPct = currentTotals?.profit_margin_percent ?? 0;
      return monthRevenue * (1 - marginPct / 100);
    });

    const marginData = revenuePerMonth.map((rev, i) => {
      const cost = costPerMonth[i];
      return rev > 0 ? (((rev - cost) / rev) * 100) : 0;
    });

    const totalRevenue = revenueData.reduce((s, v) => s + v, 0);
    const totalProfit = num(currentTotals?.total_profit);
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

    return { revenueData, priorRevenueData, marginData, totalRevenue, totalProfit, overallMargin };
  }, [currentData, priorData, currentTotals, priorTotals]);

  const data = {
    labels: MONTH_LABELS,
    datasets: [
      {
        type: "bar" as const,
        label: String(selectedYear),
        data: revenueData,
        backgroundColor: "rgba(99,102,241,0.75)",
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "bar" as const,
        label: String(selectedYear - 1),
        data: priorRevenueData,
        backgroundColor: "rgba(148,163,184,0.35)",
        borderColor: "rgba(148,163,184,0.6)",
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
        order: 3,
      },
      {
        type: "line" as const,
        label: "Margin %",
        data: num(currentTotals?.profit_margin_percent ?? 0) > 0
          ? MONTH_LABELS.map(() => num(currentTotals?.profit_margin_percent ?? 0))
          : marginData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.12)",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#10b981",
        fill: false,
        tension: 0.35,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.yAxisID === "y1") return `  Margin: ${num(ctx.parsed.y).toFixed(1)}%`;
            return `  ${ctx.dataset.label}: ${formatCurrency(num(ctx.parsed.y))}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        position: "left",
        ticks: {
          font: { size: 10 },
          callback: (v) => formatCurrency(Number(v)),
        },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y1: {
        position: "right",
        min: 0,
        max: 100,
        ticks: {
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Revenue &amp; Profit Trend</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              Monthly revenue vs prior year · Margin % overlay
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="text-end">
              <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(totalRevenue)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>YTD Revenue</div>
            </div>
            <div className="text-end">
              <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                {overallMargin}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Avg Margin</div>
            </div>
          </div>
        </div>

        <div style={{ height: 240, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Chart type="bar" data={data as any} options={options as any} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueProfitTrend;
