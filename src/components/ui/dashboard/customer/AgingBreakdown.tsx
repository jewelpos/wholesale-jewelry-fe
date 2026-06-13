"use client";

import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GET_INVOICE_AGING_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { formatCurrency, num, BUCKET_COLORS } from "./utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Props = {
  outletid: number;
  allOutlets: boolean;
  collectionRate?: number;
};

type AgingRow = {
  due_0_30: number | null;
  due_31_60: number | null;
  due_61_90: number | null;
  due_91_120: number | null;
  due_120_plus: number | null;
  total_due: number | null;
};

const AgingBreakdown = ({ outletid, allOutlets, collectionRate }: Props) => {
  const { storeId, outletId } = useParams();
  const { data, loading, error } = useQuery(GET_INVOICE_AGING_REPORT_QUERY, {
    variables: {
      outletid,
      page: 1,
      perpage: 10000,
      filters: [],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !outletid,
    fetchPolicy: "cache-and-network",
  });

  const totals = useMemo(() => {
    const rows: AgingRow[] = data?.getInvoiceAgingReport?.data ?? [];
    return rows.reduce(
      (acc, r) => ({
        b0: acc.b0 + num(r.due_0_30),
        b30: acc.b30 + num(r.due_31_60),
        b60: acc.b60 + num(r.due_61_90),
        b90: acc.b90 + num(r.due_91_120),
        b120: acc.b120 + num(r.due_120_plus),
      }),
      { b0: 0, b30: 0, b60: 0, b90: 0, b120: 0 }
    );
  }, [data]);

  const grandTotal = totals.b0 + totals.b30 + totals.b60 + totals.b90 + totals.b120;
  const overdueAmount = totals.b60 + totals.b90 + totals.b120;
  const overduePercent = grandTotal > 0 ? ((overdueAmount / grandTotal) * 100).toFixed(0) : "0";

  const buckets = [
    { label: "0–30 days", value: totals.b0, color: BUCKET_COLORS[0] },
    { label: "31–60 days", value: totals.b30, color: BUCKET_COLORS[1] },
    { label: "61–90 days", value: totals.b60, color: BUCKET_COLORS[2] },
    { label: "91–120 days", value: totals.b90, color: BUCKET_COLORS[3] },
    { label: "120+ days", value: totals.b120, color: BUCKET_COLORS[4] },
  ];

  const chartData = {
    labels: [""],
    datasets: buckets.map((b, i) => ({
      label: b.label,
      data: [b.value],
      backgroundColor: BUCKET_COLORS[i],
      borderRadius: i === 0 ? { topLeft: 4, bottomLeft: 4 } : i === 4 ? { topRight: 4, bottomRight: 4 } : 0,
    })),
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = grandTotal > 0 ? ((Number(ctx.parsed.x) / grandTotal) * 100).toFixed(1) : "0";
            return `${ctx.dataset.label}: ${formatCurrency(Number(ctx.parsed.x))} (${pct}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { callback: (v) => formatCurrency(Number(v)), font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y: { stacked: true, display: false },
    },
  };

  const riskLevel = Number(overduePercent) >= 40 ? "danger" : Number(overduePercent) >= 20 ? "warning" : "success";
  const riskText = Number(overduePercent) >= 40 ? "Critical — action needed" : Number(overduePercent) >= 20 ? "Moderate risk" : "Healthy";

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">A/R Aging Breakdown</h6>
            <div className="text-muted small">
              Total outstanding{" "}
              <span className="fw-semibold text-dark">{loading && !data ? "…" : formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <Link
            href={`/jw/${storeId}/${outletId}/customers/balance_aging`}
            className="small text-decoration-none"
          >
            View report →
          </Link>
        </div>

        {/* Risk summary line */}
        {grandTotal > 0 && !loading && (
          <div className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-3 bg-${riskLevel}-subtle`} style={{ fontSize: 11 }}>
            <span className={`fw-semibold text-${riskLevel}`}>{overduePercent}% overdue &gt;60d</span>
            <span className="text-muted">·</span>
            <span className={`text-${riskLevel}`}>{riskText}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formatCurrency(overdueAmount)} at risk</span>
          </div>
        )}

        {allOutlets && (
          <div className="alert alert-info py-1 small mb-2" style={{ fontSize: 11 }}>
            Aging shown for current outlet only.
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-1 small mb-2">{error.message}</div>
        )}

        <div style={{ height: 100 }}>
          <Bar data={chartData} options={options} />
        </div>

        {/* Bucket breakdown with % */}
        <div className="mt-3">
          {buckets.map((b) => {
            const pct = grandTotal > 0 ? ((b.value / grandTotal) * 100).toFixed(1) : "0.0";
            return (
              <div key={b.label} className="d-flex align-items-center justify-content-between py-1" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <span className="d-inline-flex align-items-center gap-2 small">
                  <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: b.color, flexShrink: 0 }} />
                  <span className="text-muted">{b.label}</span>
                </span>
                <span className="d-flex align-items-center gap-2">
                  <span className="text-muted" style={{ fontSize: 11 }}>{pct}%</span>
                  <span className="fw-semibold small" style={{ minWidth: 72, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {loading && !data ? "—" : formatCurrency(b.value)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Collection rate footer */}
        {collectionRate !== undefined && (
          <div className="d-flex align-items-center justify-content-between mt-3 pt-2" style={{ borderTop: "1px solid #e2e8f0" }}>
            <span className="text-muted small">Collection rate</span>
            <span
              className={`fw-semibold small text-${collectionRate >= 90 ? "success" : collectionRate >= 70 ? "warning" : "danger"}`}
            >
              {collectionRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgingBreakdown;
