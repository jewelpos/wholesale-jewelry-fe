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
import { num, formatCurrency, PRISM } from "@/components/ui/dashboard/admin/utils";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const COLORS = [
  PRISM.indigo, PRISM.cyan, PRISM.emerald, PRISM.amber,
  PRISM.violet, PRISM.orange, PRISM.teal, PRISM.rose,
];

interface PivotRow {
  warehouseid?: number | string | null;
  warehousename?: string | null;
  monthly_payment?: number | string | null;
  [key: string]: number | string | null | undefined;
}

interface Props {
  rows: PivotRow[];
  loading: boolean;
}

const WarehouseBreakdown = ({ rows, loading }: Props) => {
  const warehouseData = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    for (const row of rows) {
      const id = String(row.warehouseid ?? "unknown");
      const name = String(row.warehousename ?? "Unknown");
      const total = num(row.monthly_payment as number);
      const existing = map.get(id);
      if (existing) {
        existing.total += total;
      } else {
        map.set(id, { name, total });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows]);

  const chartData = {
    labels: warehouseData.map(w => w.name),
    datasets: [
      {
        label: "YTD Collections",
        data: warehouseData.map(w => w.total),
        backgroundColor: warehouseData.map((_, i) => COLORS[i % COLORS.length] + "cc"),
        borderColor: warehouseData.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number } }) => `  ${formatCurrency(ctx.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          callback: (v: number | string) => {
            const n = typeof v === "number" ? v : parseFloat(v as string);
            return formatCurrency(n);
          },
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const barHeight = Math.max(80, warehouseData.length * 42);

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="mb-2">
          <h6 className="mb-1">Warehouse Breakdown</h6>
          <div className="text-muted" style={{ fontSize: 11 }}>YTD collections by warehouse</div>
        </div>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 100 }}>
            <span className="text-muted small">Loading…</span>
          </div>
        ) : warehouseData.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 80 }}>
            <span className="text-muted small">No warehouse data.</span>
          </div>
        ) : (
          <div style={{ height: barHeight, position: "relative" }}>
            <Bar data={chartData} options={options as never} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseBreakdown;
