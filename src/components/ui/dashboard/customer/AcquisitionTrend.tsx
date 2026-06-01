"use client";

import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import DashboardCustomer from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
};

type Granularity = "month" | "year";

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const formatMonthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const AcquisitionTrend = ({ customers, loading }: Props) => {
  const [granularity, setGranularity] = useState<Granularity>("month");

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    let latestYearCount = 0;
    let priorYearCount = 0;
    const monthBucket = new Map<string, number>();
    const yearBucket = new Map<number, number>();

    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    for (const k of months) monthBucket.set(k, 0);

    const years: number[] = [];
    for (let i = 5; i >= 0; i--) years.push(currentYear - i);
    for (const y of years) yearBucket.set(y, 0);

    for (const c of customers) {
      if (!c.custregistrationdate) continue;
      const d = new Date(c.custregistrationdate);
      if (isNaN(d.getTime())) continue;
      const mk = monthKey(d);
      if (monthBucket.has(mk))
        monthBucket.set(mk, (monthBucket.get(mk) ?? 0) + 1);
      const yr = d.getFullYear();
      if (yearBucket.has(yr))
        yearBucket.set(yr, (yearBucket.get(yr) ?? 0) + 1);
      if (yr === currentYear) latestYearCount++;
      else if (yr === currentYear - 1) priorYearCount++;
    }

    const monthSeries = months.map((k) => monthBucket.get(k) ?? 0);
    const yearSeries = years.map((y) => yearBucket.get(y) ?? 0);
    const totalLast12 = monthSeries.reduce((s, n) => s + n, 0);

    return {
      monthLabels: months.map(formatMonthLabel),
      monthSeries,
      yearLabels: years.map((y) => String(y)),
      yearSeries,
      totalLast12,
      latestYear: latestYearCount,
      priorYear: priorYearCount,
    };
  }, [customers]);

  const chartData =
    granularity === "month"
      ? {
          labels: stats.monthLabels,
          datasets: [
            {
              label: "New customers",
              data: stats.monthSeries,
              backgroundColor: "#6366f1",
              borderRadius: 4,
            },
          ],
        }
      : {
          labels: stats.yearLabels,
          datasets: [
            {
              label: "New customers",
              data: stats.yearSeries,
              backgroundColor: "#6366f1",
              borderRadius: 4,
            },
          ],
        };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.parsed.y} new customer${ctx.parsed.y === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  const headerCount =
    granularity === "month" ? stats.totalLast12 : stats.yearSeries.reduce((s, n) => s + n, 0);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
          <div>
            <h6 className="mb-1">Acquisition Trend</h6>
            <div className="text-muted small">
              {granularity === "month"
                ? "New customers, last 12 months"
                : "New customers, by year"}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-outline-secondary ${granularity === "month" ? "active" : ""}`}
                onClick={() => setGranularity("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary ${granularity === "year" ? "active" : ""}`}
                onClick={() => setGranularity("year")}
              >
                Year
              </button>
            </div>
            <div className="text-end">
              <div className="fs-5 fw-semibold">{headerCount}</div>
              <div className="text-muted small">
                YTD {stats.latestYear}
                <span className="mx-1">·</span>Prior {stats.priorYear}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 220 }}>
          <Bar data={chartData} options={options} />
        </div>

        {!loading && granularity === "month" && stats.totalLast12 === 0 && (
          <div className="text-muted small mt-2 text-center">
            No registrations in the last 12 months. Switch to <b>Year</b> for longer history.
          </div>
        )}
      </div>
    </div>
  );
};

export default AcquisitionTrend;
