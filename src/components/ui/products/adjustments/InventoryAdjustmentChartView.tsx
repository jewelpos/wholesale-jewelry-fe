"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { InventoryAdjustmentChartResponse } from "@/types/product";
import { formatCurrency } from "@/lib/utils/currencyFormat";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: InventoryAdjustmentChartResponse | null;
  loading: boolean;
}


const InventoryAdjustmentChartView = ({ data, loading }: Props) => {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <div className="text-muted" style={{ fontSize: 13 }}>Loading chart data…</div>
        </div>
      </div>
    );
  }

  if (!data || !data.items?.length) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <div className="text-muted" style={{ fontSize: 13 }}>No adjustment data for selected filters</div>
        </div>
      </div>
    );
  }

  const items = [...data.items].slice(0, 15);
  const labels = items.map((i) => i.itemcode);

  const barData = {
    labels,
    datasets: [
      {
        label: "Qty Adjusted",
        data: items.map((i) => i.total_qty_adjusted),
        backgroundColor: "#dbeafe",
        borderColor: "#93c5fd",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "yQty",
      },
      {
        label: "Cost Adjusted",
        data: items.map((i) => i.total_cost_adjusted),
        backgroundColor: "#ffedd5",
        borderColor: "#fdba74",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "yCost",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12, padding: 16 } },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 10,
        callbacks: {
          title: (items) => {
            const item = data.items[items[0].dataIndex];
            return `${item.itemcode} — ${item.description ?? ""}`;
          },
          label: (ctx) => {
            const item = data.items[ctx.dataIndex];
            return ctx.datasetIndex === 0
              ? `  Qty Adjusted: ${item.total_qty_adjusted}  (${item.adjustment_count} records)`
              : `  Cost Adjusted: ${formatCurrency(item.total_cost_adjusted)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      yQty: {
        type: "linear", position: "left", beginAtZero: true,
        ticks: { precision: 0, font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
        title: { display: true, text: "Qty", font: { size: 10 }, color: "#94a3b8" },
      },
      yCost: {
        type: "linear", position: "right", beginAtZero: true,
        grid: { display: false },
        ticks: { font: { size: 10 }, callback: (v) => formatCurrency(Number(v)) },
        title: { display: true, text: "Cost", font: { size: 10 }, color: "#94a3b8" },
      },
    },
  };

  const STAT_CARDS = [
    { label: "TOTAL RECORDS",    value: data.total_adjustments,             bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", format: (v: number) => String(v) },
    { label: "ITEMS AFFECTED",   value: data.items_affected,                bg: "#dcfce7", border: "#86efac", text: "#166534", format: (v: number) => String(v) },
    { label: "TOTAL QTY MOVED",  value: data.total_qty,                     bg: "#ffedd5", border: "#fdba74", text: "#9a3412", format: (v: number) => String(v) },
    { label: "TOTAL COST ADJ.",  value: data.total_cost,                    bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", format: (v: number) => formatCurrency(v) },
  ];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-3">

        {/* summary chips */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {STAT_CARDS.map((s) => (
            <div key={s.label} style={{ flex: "1 1 calc(25% - 8px)", minWidth: 120, padding: "8px 12px", borderRadius: 8, background: s.bg, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 10, color: s.text, fontWeight: 600, letterSpacing: "0.3px" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.text, lineHeight: 1.3 }}>{s.format(s.value)}</div>
            </div>
          ))}
        </div>

        {/* bar chart */}
        <div style={{ height: 280 }}>
          <Bar data={barData} options={options} />
        </div>
        <div className="text-muted text-center mt-1" style={{ fontSize: 11 }}>Top {items.length} items by qty adjusted</div>

      </div>
    </div>
  );
};

export default InventoryAdjustmentChartView;
