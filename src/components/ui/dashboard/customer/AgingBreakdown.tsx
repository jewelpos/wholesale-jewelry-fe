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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  outletid: number;
  allOutlets: boolean;
};

type AgingRow = {
  due_0_30: number | null;
  due_31_60: number | null;
  due_61_90: number | null;
  due_91_120: number | null;
  due_120_plus: number | null;
  total_due: number | null;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: number | null | undefined) => Number(v ?? 0);

const BUCKET_COLORS = [
  "#22c55e",
  "#84cc16",
  "#facc15",
  "#f97316",
  "#ef4444",
];

const AgingBreakdown = ({ outletid, allOutlets }: Props) => {
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

  const grandTotal =
    totals.b0 + totals.b30 + totals.b60 + totals.b90 + totals.b120;

  const chartData = {
    labels: [""],
    datasets: [
      {
        label: "0–30 days",
        data: [totals.b0],
        backgroundColor: BUCKET_COLORS[0],
      },
      {
        label: "31–60 days",
        data: [totals.b30],
        backgroundColor: BUCKET_COLORS[1],
      },
      {
        label: "61–90 days",
        data: [totals.b60],
        backgroundColor: BUCKET_COLORS[2],
      },
      {
        label: "91–120 days",
        data: [totals.b90],
        backgroundColor: BUCKET_COLORS[3],
      },
      {
        label: "120+ days",
        data: [totals.b120],
        backgroundColor: BUCKET_COLORS[4],
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(Number(ctx.parsed.x))}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          callback: (v) => formatCurrency(Number(v)),
        },
      },
      y: { stacked: true, display: false },
    },
  };

  const buckets = [
    { label: "0–30 days", value: totals.b0, color: BUCKET_COLORS[0] },
    { label: "31–60 days", value: totals.b30, color: BUCKET_COLORS[1] },
    { label: "61–90 days", value: totals.b60, color: BUCKET_COLORS[2] },
    { label: "91–120 days", value: totals.b90, color: BUCKET_COLORS[3] },
    { label: "120+ days", value: totals.b120, color: BUCKET_COLORS[4] },
  ];

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">A/R Aging</h6>
            <div className="text-muted small">
              Total outstanding{" "}
              <span className="fw-semibold text-dark">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
          <Link
            href={`/jw/${storeId}/${outletId}/customers/balance_aging`}
            className="small text-decoration-none"
          >
            View report →
          </Link>
        </div>

        {allOutlets && (
          <div className="alert alert-info py-2 small mb-3">
            Aging is shown for the current outlet only.
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 small">
            Failed to load aging: {error.message}
          </div>
        )}

        <div style={{ height: 120 }}>
          <Bar data={chartData} options={options} />
        </div>

        <div className="row g-2 mt-2">
          {buckets.map((b) => (
            <div className="col-6 col-md-4 col-xl-12" key={b.label}>
              <div className="d-flex align-items-center justify-content-between small">
                <span className="d-inline-flex align-items-center gap-2">
                  <span
                    className="d-inline-block rounded-circle"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: b.color,
                    }}
                  />
                  {b.label}
                </span>
                <span className="fw-semibold">
                  {loading && !data ? "—" : formatCurrency(b.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgingBreakdown;
