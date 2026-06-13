"use client";

import React, { useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  ChartOptions,
} from "chart.js";
import { ChevronDown, ChevronUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip
);

export interface ReportMiniChartProps {
  labels: string[];
  values: number[];
  title?: string;
  subtitle?: string;
  format?: "currency" | "number";
  color?: string;
  type?: "area" | "bar";
  height?: number;
  loading?: boolean;
  defaultCollapsed?: boolean;
}

const fmt = {
  currency: (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v),
  number: (v: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v),
};

export default function ReportMiniChart({
  labels,
  values,
  title,
  subtitle,
  format = "currency",
  color = "#6366f1",
  type = "area",
  height = 150,
  loading = false,
  defaultCollapsed = false,
}: ReportMiniChartProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const hasData = values.some((v) => v > 0);

  const gradientBg = useMemo(
    () =>
      (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return `${color}30`;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `${color}55`);
        gradient.addColorStop(0.5, `${color}22`);
        gradient.addColorStop(1, `${color}00`);
        return gradient;
      },
    [color]
  );

  const areaData = {
    labels,
    datasets: [
      {
        label: title ?? "Value",
        data: values,
        borderColor: color,
        borderWidth: 2,
        backgroundColor: gradientBg,
        fill: true,
        tension: 0.4,
        pointRadius: values.length > 20 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: title ?? "Value",
        data: values,
        backgroundColor: values.map((v) => {
          const max = Math.max(...values);
          const ratio = max > 0 ? v / max : 0;
          const opacity = Math.round(40 + ratio * 160).toString(16).padStart(2, "0");
          return `${color}${opacity}`;
        }),
        borderColor: color,
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
        hoverBackgroundColor: `${color}cc`,
      },
    ],
  };

  const commonAxisOptions = {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { size: 10 },
        color: "#94a3b8",
        maxRotation: 0,
        maxTicksLimit: labels.length > 15 ? 8 : labels.length,
      },
    },
    y: {
      display: false,
      grid: { display: false },
      border: { display: false },
      beginAtZero: true,
    },
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        titleFont: { size: 11 },
        bodyFont: { size: 13, weight: "bold" as const },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx: any) =>
            ` ${format === "currency" ? fmt.currency(ctx.parsed.y) : fmt.number(ctx.parsed.y)}`,
        },
      },
    },
  };

  const areaOptions: ChartOptions<"line"> = { ...commonOptions, scales: commonAxisOptions };
  const barOptions: ChartOptions<"bar"> = { ...commonOptions, scales: commonAxisOptions };

  return (
    <div
      className="card mb-2"
      style={{
        border: "1px solid #f1f5f9",
        borderRadius: 12,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        className="card-body p-0"
        style={{ overflow: "hidden" }}
      >
        {/* Header — always visible, clickable to toggle */}
        <div
          className="d-flex align-items-center justify-content-between px-3"
          style={{
            height: 36,
            cursor: "pointer",
            userSelect: "none",
            borderBottom: collapsed ? "none" : "1px solid #f1f5f9",
          }}
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {title && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.1px" }}>
                {title}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{subtitle}</span>
            )}
          </div>
          <div style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
            {collapsed
              ? <ChevronDown size={14} />
              : <ChevronUp size={14} />}
          </div>
        </div>

        {/* Chart body — animates open/closed */}
        <div
          style={{
            height: collapsed ? 0 : height,
            overflow: "hidden",
            transition: "height 0.25s ease",
            padding: collapsed ? "0 12px" : "8px 12px 12px",
          }}
        >
          {!collapsed && (
            loading || !hasData ? (
              <div
                style={{
                  height: height - 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                  {loading ? "Loading chart…" : "No data to display"}
                </div>
              </div>
            ) : (
              <div style={{ height: height - 20 }}>
                {type === "area"
                  ? <Line data={areaData} options={areaOptions} />
                  : <Bar data={barData} options={barOptions} />}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
