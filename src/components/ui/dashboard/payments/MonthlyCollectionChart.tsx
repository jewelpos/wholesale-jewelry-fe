"use client";

import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { num, formatCurrency, MONTH_LABELS } from "@/components/ui/dashboard/admin/utils";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface PivotRow {
  month_display?: string | null;
  monthly_payment?: number | string | null;
  [key: string]: number | string | null | undefined;
}

interface Props {
  rows: PivotRow[];
  loading: boolean;
  selectedYear: number;
}

const MonthlyCollectionChart = ({ rows, loading, selectedYear }: Props) => {
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const row of rows) {
      const display = (row.month_display ?? "").toLowerCase();
      const idx = MONTH_LABELS.findIndex(m => display.includes(m.toLowerCase()));
      if (idx >= 0) {
        totals[idx] += num(row.monthly_payment as number);
      }
    }
    return totals;
  }, [rows]);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "Collections",
        data: monthlyTotals,
        backgroundColor: "#6366f1cc",
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `  ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          callback: (v: number | string) => {
            const n = typeof v === "number" ? v : parseFloat(v as string);
            if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
            return `$${n}`;
          },
        },
      },
    },
  };

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="mb-2">
          <h6 className="mb-1">Monthly Collections — {selectedYear}</h6>
          <div className="text-muted" style={{ fontSize: 11 }}>
            Total collected per month · all payment modes combined
          </div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 220 }}>
            <span className="text-muted small">Loading…</span>
          </div>
        ) : (
          <div style={{ height: 220, position: "relative" }}>
            <Bar data={chartData} options={options as never} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCollectionChart;
