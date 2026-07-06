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
} from "chart.js";
import { formatCurrency } from "@/components/ui/dashboard/admin/utils";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const DAY_KEYS = Array.from({ length: 31 }, (_, i) => `day_${String(i + 1).padStart(2, "0")}`);

// Day values come as "35371.45 (14)" — extract the numeric amount before the space
const parseDay = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const str = String(v).trim();
  const match = str.match(/^[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

interface DailyRow {
  [key: string]: number | string | null;
}

interface Props {
  rows: DailyRow[];
  loading: boolean;
  selectedMonth: number;
  selectedYear: number;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DailyCollectionBar = ({ rows, loading, selectedMonth, selectedYear }: Props) => {
  const targetMonth = MONTH_NAMES[selectedMonth - 1].toLowerCase();

  const dailyTotals = useMemo(() => {
    const totals = Array(31).fill(0);
    for (const row of rows) {
      const display = String(row.month_display ?? "").toLowerCase();
      // Only aggregate rows that belong to the selected month (and year if year field present)
      const monthMatches = display.includes(targetMonth);
      const yearField = row.year ? String(row.year) : null;
      const yearMatches = yearField ? yearField === String(selectedYear) : true;
      if (!monthMatches || !yearMatches) continue;
      DAY_KEYS.forEach((key, i) => {
        totals[i] += parseDay(row[key]);
      });
    }
    return totals;
  }, [rows, targetMonth, selectedYear]);

  const labels = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Collections",
        data: dailyTotals,
        backgroundColor: "#06b6d4cc",
        borderColor: "#06b6d4",
        borderWidth: 1,
        borderRadius: 2,
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
          title: (items: { dataIndex: number }[]) => `Day ${items[0].dataIndex + 1}`,
          label: (ctx: { parsed: { y: number } }) => `  ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 10 },
          callback: (v: number | string) => {
            const n = typeof v === "number" ? v : parseFloat(v as string);
            return formatCurrency(n);
          },
        },
      },
    },
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="mb-2">
          <h6 className="mb-1">Daily Collections — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h6>
          <div className="text-muted" style={{ fontSize: 11 }}>Collections per day</div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
            <span className="text-muted small">Loading…</span>
          </div>
        ) : (
          <div style={{ height: 200, position: "relative" }}>
            <Bar data={chartData} options={options as never} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyCollectionBar;
