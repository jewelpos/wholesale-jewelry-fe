"use client";

import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip, Legend, ChartOptions } from "chart.js";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { GET_ITEM_QTY_SOLD_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { ItemQtySoldSummary } from "@/types/reports";
import { MONTH_KEYS, MONTH_LABELS, num } from "./utils";

ChartJS.register(CategoryScale, LinearScale, LineElement, LineController, PointElement, Tooltip, Legend);

const LINE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#ec4899", "#84cc16"];

type Props = { selectedYear: number; warehouseFilter: number | null; categoryFilter: string | null };

const TopItemsTrend = ({ selectedYear, warehouseFilter, categoryFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [topN, setTopN] = useState(5);

  const catFilters = categoryFilter
    ? [{ key: "categoryname", value: { filterType: "text", type: "equals", filter: categoryFilter } }]
    : [];

  const { data, loading } = useQuery(GET_ITEM_QTY_SOLD_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      page: 1,
      perpage: 2000,
      filters: [
        { key: "sales_year", value: { filterType: "number", type: "equals", filter: selectedYear } },
        ...catFilters,
      ],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: ItemQtySoldSummary[] = data?.getMonthlyItemQtySoldPivot?.data ?? [];

  // Aggregate by itemcode (across warehouses)
  const topItems = useMemo(() => {
    const byItem: Record<string, { desc: string; monthQty: number[]; total: number }> = {};
    for (const r of rows) {
      const k = r.itemcode;
      if (!byItem[k]) byItem[k] = { desc: r.itemdescription || k, monthQty: Array(12).fill(0), total: 0 };
      MONTH_KEYS.forEach((mk, i) => {
        byItem[k].monthQty[i] += num(r[mk]);
      });
      byItem[k].total += num(r.total_year_qty);
    }
    return Object.entries(byItem)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, topN);
  }, [rows, topN]);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: topItems.map(([code, d], i) => ({
      label: d.desc.length > 20 ? d.desc.substring(0, 18) + "…" : d.desc,
      data: d.monthQty,
      borderColor: LINE_COLORS[i % LINE_COLORS.length],
      backgroundColor: LINE_COLORS[i % LINE_COLORS.length] + "18",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: LINE_COLORS[i % LINE_COLORS.length],
      tension: 0.35,
      fill: false,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
      tooltip: {
        callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${ctx.parsed.y} units` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
    },
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Top Items — Monthly Qty Sold</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {categoryFilter ? `Category: ${categoryFilter} · ` : ""}Top {topN} items by units sold
            </div>
          </div>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Show top {topN}</div>
            <Slider min={3} max={10} step={1} marks={{ 3: "3", 5: "5", 10: "10" }}
              value={topN} onChange={(v) => setTopN(v as number)}
              styles={{ track: { backgroundColor: "#6366f1" }, rail: { backgroundColor: "#e2e8f0" } }}
              style={{ marginBottom: 8 }} />
          </div>
        </div>

        <div style={{ height: 230, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : topItems.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No sales data for {selectedYear}.</div>
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>

        {!loading && topItems.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {topItems.map(([code, d], i) => (
              <span key={code} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, backgroundColor: LINE_COLORS[i % LINE_COLORS.length] + "18", color: LINE_COLORS[i % LINE_COLORS.length], border: `1px solid ${LINE_COLORS[i % LINE_COLORS.length]}40` }}>
                {code}: {d.total} units
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopItemsTrend;
