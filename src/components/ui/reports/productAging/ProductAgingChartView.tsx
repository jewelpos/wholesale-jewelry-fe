"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useLazyQuery } from "@apollo/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { GET_PRODUCT_AGING_LIST_QUERY } from "@/lib/graphql/query/products";
import { ItemAgingSummary } from "@/types/product";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const BUCKET_PRIORITY = ["0-30", "31-60", "61-90", "91-180", "180+", "never", "no sale", "no stock"];

const sortBuckets = (buckets: string[]) =>
  [...buckets].sort((a, b) => {
    const score = (s: string) => {
      const idx = BUCKET_PRIORITY.findIndex((k) => s.toLowerCase().includes(k));
      return idx === -1 ? 999 : idx;
    };
    return score(a) - score(b);
  });

const bucketColors = (bucket: string) => {
  const lower = bucket.toLowerCase();
  if (lower.includes("never") || lower.includes("no sale") || lower.includes("no stock"))
    return { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", solid: "#94a3b8" };
  if (lower.includes("0-30") || lower.startsWith("0"))
    return { bg: "#dcfce7", border: "#86efac", text: "#166534", solid: "#198754" };
  if (lower.includes("31-60") || lower.includes("31"))
    return { bg: "#fef9c3", border: "#fde047", text: "#854d0e", solid: "#d97706" };
  if (lower.includes("61-90") || lower.includes("61"))
    return { bg: "#ffedd5", border: "#fdba74", text: "#9a3412", solid: "#ea580c" };
  if (lower.includes("91") || lower.includes("180") || lower.includes("90+"))
    return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", solid: "#dc3545" };
  return { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", solid: "#94a3b8" };
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  storeid: number;
  outletid?: number;
  warehouseid?: number;
}

const ProductAgingChartView = ({ storeid, outletid, warehouseid }: Props) => {
  const [getProductAgingList, { loading }] = useLazyQuery(GET_PRODUCT_AGING_LIST_QUERY);
  const [allRows, setAllRows] = useState<ItemAgingSummary[]>([]);
  const [agingType, setAgingType] = useState<"sales" | "inbound">("sales");
  const [chartType, setChartType] = useState<"bar" | "doughnut">("bar");

  useEffect(() => {
    if (!outletid) { setAllRows([]); return; }
    getProductAgingList({
      variables: {
        storeid,
        outletid,
        warehouseid: warehouseid && warehouseid !== -1 ? warehouseid : undefined,
        page: 1,
        perpage: 10000,
        filters: [],
        sortModel: [],
        rowGroupCols: [],
        groupKeys: [],
      },
    })
      .then(({ data }) => setAllRows(data?.getProductAgingList?.data ?? []))
      .catch(() => setAllRows([]));
  }, [storeid, outletid, warehouseid, getProductAgingList]);

  const { buckets, itemCounts, totalCosts, colors } = useMemo(() => {
    const field = agingType === "sales" ? "sales_aging_bucket" : "inbound_aging_bucket";
    const map: Record<string, { count: number; cost: number }> = {};
    for (const row of allRows) {
      const bucket = (row[field as keyof ItemAgingSummary] as string) || "Unknown";
      if (!map[bucket]) map[bucket] = { count: 0, cost: 0 };
      map[bucket].count += 1;
      map[bucket].cost += Number(row.total_cost ?? 0);
    }
    const sorted = sortBuckets(Object.keys(map));
    return {
      buckets: sorted,
      itemCounts: sorted.map((b) => map[b].count),
      totalCosts: sorted.map((b) => map[b].cost),
      colors: sorted.map(bucketColors),
    };
  }, [allRows, agingType]);

  const totalItems = itemCounts.reduce((s, n) => s + n, 0);
  const totalCost = totalCosts.reduce((s, n) => s + n, 0);

  if (!outletid) {
    return (
      <div className="card mb-3 border-0 shadow-sm">
        <div className="card-body p-4 d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Select an outlet to view the aging chart</div>
        </div>
      </div>
    );
  }

  const barData = {
    labels: buckets,
    datasets: [
      {
        label: "Items",
        data: itemCounts,
        backgroundColor: colors.map((c) => c.bg),
        borderColor: colors.map((c) => c.border),
        borderWidth: 1.5,
        borderRadius: 6,
        yAxisID: "yItems",
      },
      {
        label: "Stock Cost",
        data: totalCosts,
        backgroundColor: colors.map((c) => c.solid + "33"),
        borderColor: colors.map((c) => c.solid),
        borderWidth: 1.5,
        borderRadius: 6,
        yAxisID: "yValue",
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12, padding: 16 } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.datasetIndex === 0
              ? ` ${ctx.parsed.y} items`
              : ` ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      yItems: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        ticks: { precision: 0, font: { size: 11 } },
        grid: { color: "rgba(0,0,0,0.04)" },
        title: { display: true, text: "Item Count", font: { size: 10 }, color: "#94a3b8" },
      },
      yValue: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          callback: (v) => `$${(Number(v) / 1000).toFixed(0)}k`,
        },
        title: { display: true, text: "Stock Cost", font: { size: 10 }, color: "#94a3b8" },
      },
    },
  };

  const doughnutData = {
    labels: buckets,
    datasets: [{
      data: itemCounts,
      backgroundColor: colors.map((c) => c.bg),
      borderColor: colors.map((c) => c.border),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = totalItems > 0 ? ((ctx.parsed / totalItems) * 100).toFixed(1) : "0.0";
            return ` ${ctx.parsed} items (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="card mb-3 border-0 shadow-sm">
      <div className="card-body p-3">

        {/* header row */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <div className="fw-semibold" style={{ fontSize: 14 }}>Aging Distribution</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {loading ? "Loading…" : `${totalItems} items · ${fmt(totalCost)} total cost`}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${agingType === "sales" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={() => setAgingType("sales")}
              >
                Sales Age
              </button>
              <button
                type="button"
                className={`btn ${agingType === "inbound" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={() => setAgingType("inbound")}
              >
                Inbound Age
              </button>
            </div>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${chartType === "bar" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={() => setChartType("bar")}
              >
                Bar
              </button>
              <button
                type="button"
                className={`btn ${chartType === "doughnut" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={() => setChartType("doughnut")}
              >
                Donut
              </button>
            </div>
          </div>
        </div>

        {/* bucket summary chips */}
        {!loading && buckets.length > 0 && (
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {buckets.map((label, i) => (
              <div
                key={label}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: colors[i].bg,
                  border: `1px solid ${colors[i].border}`,
                  fontSize: 11,
                }}
              >
                <span style={{ color: colors[i].text, fontWeight: 600 }}>{label}</span>
                <span style={{ color: colors[i].text, marginLeft: 6 }}>{itemCounts[i]} items</span>
              </div>
            ))}
          </div>
        )}

        {/* chart area */}
        {loading ? (
          <div style={{ height: 260 }} className="d-flex align-items-center justify-content-center">
            <div className="text-muted" style={{ fontSize: 13 }}>Loading chart data…</div>
          </div>
        ) : buckets.length === 0 ? (
          <div style={{ height: 260 }} className="d-flex align-items-center justify-content-center">
            <div className="text-muted" style={{ fontSize: 13 }}>No data available</div>
          </div>
        ) : (
          <div style={{ height: 260 }}>
            {chartType === "bar"
              ? <Bar data={barData} options={barOptions} />
              : <Doughnut data={doughnutData} options={doughnutOptions} />}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductAgingChartView;
