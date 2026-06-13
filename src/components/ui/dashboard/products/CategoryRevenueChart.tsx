"use client";

import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend, ChartOptions } from "chart.js";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { CategorySalesSummary } from "@/types/reports";
import { num, formatCurrency, yearFilter, marginColor } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

type Props = { selectedYear: number; warehouseFilter: number | null };
type SortKey = "revenue" | "profit" | "margin";

const CategoryRevenueChart = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [sortBy, setSortBy] = useState<SortKey>("revenue");
  const [marginThreshold, setMarginThreshold] = useState(0);
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      page: 1,
      perpage: 2000,
      filters: yearFilter(selectedYear),
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: CategorySalesSummary[] = data?.getMonthlyItemCategorySalesPivot?.data ?? [];

  const { categories, subRows } = useMemo(() => {
    const catMap: Record<string, { sales: number; profit: number; cost: number; qty: number }> = {};
    for (const r of rows) {
      const k = r.categoryname || "Uncategorized";
      if (!catMap[k]) catMap[k] = { sales: 0, profit: 0, cost: 0, qty: 0 };
      catMap[k].sales += num(r.total_sales);
      catMap[k].profit += num(r.total_profit);
      catMap[k].cost += num(r.total_cost);
      catMap[k].qty += num(r.total_quantity);
    }
    const cats = Object.entries(catMap)
      .map(([name, d]) => ({ name, ...d, margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0 }))
      .filter((c) => c.margin >= marginThreshold && c.sales > 0)
      .sort((a, b) => (sortBy === "revenue" ? b.sales - a.sales : sortBy === "profit" ? b.profit - a.profit : b.margin - a.margin))
      .slice(0, 15);

    const subRows = drillCategory
      ? rows
          .filter((r) => r.categoryname === drillCategory && r.subcategoryname)
          .reduce<Record<string, { sales: number; profit: number; qty: number }>>((acc, r) => {
            const k = r.subcategoryname;
            if (!acc[k]) acc[k] = { sales: 0, profit: 0, qty: 0 };
            acc[k].sales += num(r.total_sales);
            acc[k].profit += num(r.total_profit);
            acc[k].qty += num(r.total_quantity);
            return acc;
          }, {})
      : null;

    return { categories: cats, subRows };
  }, [rows, sortBy, marginThreshold, drillCategory]);

  const displayRows = drillCategory && subRows
    ? Object.entries(subRows).map(([name, d]) => ({ name, sales: d.sales, profit: d.profit, margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0 }))
    : categories;

  const chartData = {
    labels: displayRows.map((c) => c.name.length > 22 ? c.name.substring(0, 20) + "…" : c.name),
    datasets: [
      {
        label: "Revenue",
        data: displayRows.map((c) => c.sales),
        backgroundColor: displayRows.map((_, i) => `rgba(99,102,241,${0.45 + i * 0})`),
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Profit",
        data: displayRows.map((c) => c.profit),
        backgroundColor: "rgba(16,185,129,0.65)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 }, padding: 10 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrency(num(ctx.parsed.x))}`,
          afterLabel: (ctx) => {
            if (ctx.datasetIndex === 0) {
              const row = displayRows[ctx.dataIndex];
              return `  Margin: ${row.margin.toFixed(1)}%`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ticks: { font: { size: 10 }, callback: (v: any) => formatCurrency(Number(v)) },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
    onClick: (_e, elements, chart) => {
      if (!elements.length) return;
      const label = chart.data.labels?.[elements[0].index] as string;
      const fullName = categories.find((c) => c.name.startsWith(label.replace("…", "")))?.name ?? label;
      setDrillCategory((prev) => (prev === fullName ? null : fullName));
    },
  };

  const chartHeight = Math.max(180, displayRows.length * 38);

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="mb-0">
                {drillCategory ? (
                  <span>
                    <button type="button" onClick={() => setDrillCategory(null)} className="btn btn-link p-0 text-decoration-none" style={{ fontSize: 14, color: "#6366f1" }}>
                      Categories
                    </button>
                    {" "}<ChevronRight size={12} className="text-muted" />{" "}
                    {drillCategory}
                  </span>
                ) : "Revenue by Category"}
              </h6>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {drillCategory ? "Click a bar to drill into subcategory" : "Click a bar to drill into subcategories"}
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {(["revenue", "profit", "margin"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortBy(k)}
                className="btn btn-sm"
                style={{
                  fontSize: 11, padding: "2px 10px",
                  backgroundColor: sortBy === k ? "#6366f1" : "var(--surface-muted)",
                  color: sortBy === k ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${sortBy === k ? "#6366f1" : "var(--border-subtle)"}`,
                  borderRadius: 20,
                }}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Min margin ≥ {marginThreshold}%</div>
          <Slider min={0} max={50} step={5} value={marginThreshold} onChange={(v) => setMarginThreshold(v as number)}
            tooltip={{ formatter: (v) => `${v}%` }}
            styles={{ track: { backgroundColor: "#10b981" }, rail: { backgroundColor: "#e2e8f0" } }}
            style={{ marginBottom: 0 }} />
        </div>

        <div style={{ height: chartHeight, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : displayRows.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No category data.</div>
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>

        {!loading && categories.length > 0 && !drillCategory && (
          <div className="d-flex flex-wrap gap-1 mt-2">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setDrillCategory(c.name)}
                style={{
                  fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                  backgroundColor: marginColor(c.margin) + "20", color: marginColor(c.margin),
                  border: `1px solid ${marginColor(c.margin)}40`,
                }}
              >
                {c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name}: {c.margin.toFixed(1)}%
                <ChevronDown size={9} style={{ marginLeft: 3 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryRevenueChart;
