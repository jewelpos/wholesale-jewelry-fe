"use client";

import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { CategorySalesSummary } from "@/types/reports";
import { num, formatCurrency, yearFilter, stdVars, marginColor } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

type Props = { selectedYear: number; warehouseFilter: number | null };

const CategoryAnalysis = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [marginThreshold, setMarginThreshold] = useState(0);

  const { data, loading } = useQuery(GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: CategorySalesSummary[] = data?.getMonthlyItemCategorySalesPivot?.data ?? [];

  // Aggregate by category (sum across subcategories + warehouses)
  const { categories } = useMemo(() => {
    const byCategory: Record<string, { sales: number; profit: number; cost: number; quantity: number }> = {};
    for (const r of rows) {
      const key = r.categoryname || "Uncategorized";
      if (!byCategory[key]) byCategory[key] = { sales: 0, profit: 0, cost: 0, quantity: 0 };
      byCategory[key].sales += num(r.total_sales);
      byCategory[key].profit += num(r.total_profit);
      byCategory[key].cost += num(r.total_cost);
      byCategory[key].quantity += num(r.total_quantity);
    }

    const categories = Object.entries(byCategory)
      .map(([name, d]) => ({
        name,
        sales: d.sales,
        profit: d.profit,
        margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
        quantity: d.quantity,
      }))
      .filter((c) => c.margin >= marginThreshold)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 12);

    return { categories };
  }, [rows, marginThreshold]);

  const chartData = {
    labels: categories.map((c) => c.name.length > 20 ? c.name.substring(0, 18) + "…" : c.name),
    datasets: [
      {
        label: "Revenue",
        data: categories.map((c) => c.sales),
        backgroundColor: categories.map((c) => `rgba(99,102,241,${0.5 + (c.sales / (categories[0]?.sales || 1)) * 0.5})`),
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Profit",
        data: categories.map((c) => c.profit),
        backgroundColor: "rgba(16,185,129,0.6)",
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
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, padding: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrency(num(ctx.parsed.x))}`,
          afterLabel: (ctx) => {
            if (ctx.datasetIndex === 0) {
              const cat = categories[ctx.dataIndex];
              return `  Margin: ${cat.margin.toFixed(1)}% · Qty: ${cat.quantity}`;
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
      y: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  const chartHeight = Math.max(180, categories.length * 36);

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Sales by Category</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>Revenue &amp; profit per product category</div>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Min margin ≥ {marginThreshold.toFixed(0)}%
            </div>
            <Slider
              min={0}
              max={50}
              step={5}
              value={marginThreshold}
              onChange={(v) => setMarginThreshold(v as number)}
              tooltip={{ formatter: (v) => `${v}%` }}
              styles={{ track: { backgroundColor: "#10b981" }, rail: { backgroundColor: "#e2e8f0" } }}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div style={{ height: chartHeight, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No category data.</div>
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>

        {/* Margin badges */}
        {!loading && categories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-3">
            {categories.slice(0, 6).map((c) => (
              <span
                key={c.name}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 20,
                  backgroundColor: `${marginColor(c.margin)}20`,
                  color: marginColor(c.margin),
                  border: `1px solid ${marginColor(c.margin)}40`,
                }}
              >
                {c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name}: {c.margin.toFixed(1)}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAnalysis;
