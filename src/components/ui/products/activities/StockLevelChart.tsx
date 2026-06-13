"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
} from "chart.js";
import dayjs from "dayjs";
import { ProductActivityChartPoint } from "@/types/product";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const TYPE_COLOR: Record<string, string> = {
  purchase:   "#198754",
  invoice:    "#dc3545",
  adjustment: "#fd7e14",
  return:     "#0d6efd",
};

const resolveColor = (type: string) => {
  const key = type?.toLowerCase() ?? "";
  if (key.includes("purchase") || key.includes("receive")) return TYPE_COLOR.purchase;
  if (key.includes("invoice") || key.includes("sale")) return TYPE_COLOR.invoice;
  if (key.includes("adjust")) return TYPE_COLOR.adjustment;
  if (key.includes("return")) return TYPE_COLOR.return;
  return "#6c757d";
};

interface Props {
  data: ProductActivityChartPoint[];
  itemLabel?: string;
}

const StockLevelChart = ({ data, itemLabel }: Props) => {
  if (!data.length) {
    return (
      <div className="card mb-3 border-0 shadow-sm h-100">
        <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 180 }}>
          <i data-feather="bar-chart-2" style={{ width: 32, height: 32, color: "#cbd5e1", marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Select a product to view stock level trend</div>
        </div>
      </div>
    );
  }

  const labels = data.map((d) => dayjs(Number(d.transation_date)).format("MMM DD"));
  const pointColors = data.map((d) => resolveColor(d.transaction_type));

  const chartData = {
    labels,
    datasets: [{
      label: "Stock Level",
      data: data.map((d) => d.running_balance),
      borderColor: "#4f6af5",
      borderWidth: 2,
      backgroundColor: "rgba(79,106,245,0.07)",
      pointBackgroundColor: pointColors,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8,
      fill: true,
      tension: 0.35,
    }],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 10,
        callbacks: {
          title: (items) => {
            const d = data[items[0].dataIndex];
            return `${dayjs(Number(d.transation_date)).format("MMM DD, YYYY")}  ·  ${d.reference ?? ""}`;
          },
          label: (ctx) => {
            const d = data[ctx.dataIndex];
            const sign = (d.quantity ?? 0) > 0 ? "+" : "";
            return [
              `  ${d.transaction_type}   ${sign}${d.quantity}`,
              `  Balance: ${d.running_balance}`,
            ];
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748b" } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 }, color: "#64748b", precision: 0 },
        title: { display: true, text: "Qty in Hand", font: { size: 11 }, color: "#94a3b8" },
      },
    },
  };

  return (
    <div className="card mb-3 border-0 shadow-sm h-100">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <div className="fw-semibold" style={{ fontSize: 14 }}>Stock Level Trend</div>
            {itemLabel && <div className="text-muted" style={{ fontSize: 12 }}>{itemLabel}</div>}
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {Object.entries(TYPE_COLOR).map(([type, color]) => (
              <span key={type} className="d-flex align-items-center gap-1" style={{ fontSize: 11, color: "#475569" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: 200 }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default StockLevelChart;
