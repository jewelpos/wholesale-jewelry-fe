"use client";

import React, { useMemo } from "react";
import { Bubble } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend, BubbleController, ChartOptions } from "chart.js";
import { useParams } from "next/navigation";
import { ItemAgingSummary } from "@/types/product";
import { num, formatCurrency, agingColor } from "./utils";

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip, Legend);

type Props = { agingData: ItemAgingSummary[]; loading: boolean };

const BUCKET_ORDER = ["0-30", "31-90", "91-180", "181+"];
const BUCKET_LABELS: Record<string, string> = { "0-30": "Fresh (0-30d)", "31-90": "Aging (31-90d)", "91-180": "Old (91-180d)", "181+": "Dead (181d+)" };

const MIN_R = 4, MAX_R = 22;

const StockHealthScatter = ({ agingData, loading }: Props) => {
  const { storeId, outletId } = useParams();

  const { datasets, quadrantStats } = useMemo(() => {
    const valid = agingData.filter((r) => num(r.itemquantityinhand) > 0);
    if (!valid.length) return { datasets: [], quadrantStats: null };

    const maxCost = Math.max(...valid.map((r) => num(r.total_cost)), 1);

    const byBucket: Record<string, ItemAgingSummary[]> = {};
    for (const r of valid) {
      const b = r.inbound_aging_bucket || "Unknown";
      if (!byBucket[b]) byBucket[b] = [];
      byBucket[b].push(r);
    }

    const datasets = BUCKET_ORDER.filter((b) => byBucket[b]?.length).map((bucket) => ({
      label: BUCKET_LABELS[bucket] ?? bucket,
      data: byBucket[bucket].map((r) => ({
        x: Math.min(num(r.last_sale_days ?? 0), 400),
        y: num(r.itemquantityinhand),
        r: MIN_R + ((num(r.total_cost) / maxCost) * (MAX_R - MIN_R)),
        _item: r,
      })),
      backgroundColor: agingColor(bucket) + "99",
      borderColor: agingColor(bucket),
      borderWidth: 1,
    }));

    const fastMover = valid.filter((r) => (r.last_sale_days ?? 0) <= 30 && num(r.itemquantityinhand) > 0).length;
    const slowMover = valid.filter((r) => (r.last_sale_days ?? 999) > 30 && (r.last_sale_days ?? 999) <= 90 && num(r.itemquantityinhand) > 0).length;
    const overstock = valid.filter((r) => (r.last_sale_days ?? 999) > 90 && num(r.itemquantityinhand) > 20).length;
    const dead = valid.filter((r) => (r.last_sale_days ?? 999) > 180).length;

    return { datasets, quadrantStats: { fastMover, slowMover, overstock, dead } };
  }, [agingData]);

  const options: ChartOptions<"bubble"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 }, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw as { x: number; y: number; r: number; _item: ItemAgingSummary };
            const item = raw._item;
            return [
              item.itemdescription || item.itemcode,
              `Last sale: ${raw.x}d ago`,
              `Qty on hand: ${raw.y}`,
              `Stock value: ${formatCurrency(num(item.total_cost))}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Days Since Last Sale", font: { size: 11 } },
        min: 0, max: 400,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10 } },
      },
      y: {
        title: { display: true, text: "Qty On Hand", font: { size: 11 } },
        beginAtZero: true,
        ticks: { font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
    },
    onClick: (_evt, elements, chart) => {
      if (!elements.length) return;
      const el = elements[0];
      const ds = chart.data.datasets[el.datasetIndex] as unknown as { data: Array<{ _item: ItemAgingSummary }> };
      const item = ds.data[el.index]?._item;
      if (item?.itemcode && storeId && outletId) {
        window.location.href = `/jw/${storeId}/${outletId}/products/${item.itemcode}/view`;
      }
    },
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="mb-2">
          <h6 className="mb-1">Stock Health Map</h6>
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Bubble size = stock cost · Click to open product</div>
        </div>

        {quadrantStats && !loading && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            <span className="badge bg-success-subtle text-success" style={{ fontSize: 10 }}>✓ Fast Movers: {quadrantStats.fastMover}</span>
            <span className="badge bg-warning-subtle text-warning" style={{ fontSize: 10 }}>⚡ Slow Movers: {quadrantStats.slowMover}</span>
            <span className="badge bg-orange-subtle text-warning" style={{ fontSize: 10 }}>📦 Overstock: {quadrantStats.overstock}</span>
            <span className="badge bg-danger-subtle text-danger" style={{ fontSize: 10 }}>☠ Dead Stock: {quadrantStats.dead}</span>
          </div>
        )}

        <div style={{ height: 250, position: "relative" }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : datasets.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No aging data.</div>
          ) : (
            <Bubble data={{ datasets }} options={options} />
          )}
        </div>

        <div className="d-flex justify-content-between mt-1" style={{ fontSize: 10, color: "#94a3b8" }}>
          <span>← Recently sold</span>
          <span>Not sold recently →</span>
        </div>
      </div>
    </div>
  );
};

export default StockHealthScatter;
