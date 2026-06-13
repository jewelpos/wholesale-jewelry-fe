"use client";

import React, { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { MonthlyPaymentSummary } from "@/types/reports";
import { num, formatCurrency, yearFilter, stdVars, MONTH_LABELS } from "./utils";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

type Props = { selectedYear: number; warehouseFilter: number | null };

const MODE_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#f43f5e", "#f97316", "#14b8a6",
];

const PaymentModeDonut = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const { data, loading } = useQuery(GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: MonthlyPaymentSummary[] = data?.getMonthlyDailyPaymentsPivot?.data ?? [];

  // Aggregate payment_mode_totals across all months
  const { modeTotals, grandTotal, monthlyTotals } = useMemo(() => {
    const modeTotals: Record<string, number> = {};
    let grandTotal = 0;
    const monthlyTotals: number[] = Array(12).fill(0);

    for (const row of rows) {
      grandTotal += num(row.monthly_payment);

      // Sum by month index
      const monthName = (row.month_display ?? "").toLowerCase();
      const monthIdx = MONTH_LABELS.findIndex((m) => monthName.includes(m.toLowerCase()));
      if (monthIdx >= 0) monthlyTotals[monthIdx] += num(row.monthly_payment);

      const raw = row.payment_mode_totals;
      if (!raw) continue;
      let modes: Record<string, number> = {};
      if (typeof raw === "string") {
        try { modes = JSON.parse(raw); } catch { continue; }
      } else if (typeof raw === "object") {
        modes = raw as Record<string, number>;
      }
      for (const [k, v] of Object.entries(modes)) {
        modeTotals[k] = (modeTotals[k] ?? 0) + Number(v);
      }
    }

    return { modeTotals, grandTotal, monthlyTotals };
  }, [rows]);

  const modeEntries = Object.entries(modeTotals).sort((a, b) => b[1] - a[1]);

  const chartData = {
    labels: modeEntries.map(([mode]) => mode),
    datasets: [
      {
        data: modeEntries.map(([, amount]) => amount),
        backgroundColor: modeEntries.map((_, i) => MODE_COLORS[i % MODE_COLORS.length] + "cc"),
        borderColor: modeEntries.map((_, i) => MODE_COLORS[i % MODE_COLORS.length]),
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="mb-2">
          <h6 className="mb-1">Payment Collection</h6>
          <div className="text-muted" style={{ fontSize: 11 }}>
            Mode breakdown · YTD total:{" "}
            <span className="fw-semibold" style={{ color: "#10b981" }}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
            <span className="text-muted small">Loading…</span>
          </div>
        ) : modeEntries.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center" style={{ height: 200 }}>
            <span className="text-muted small">No payment data for {selectedYear}.</span>
          </div>
        ) : (
          <>
            {/* Donut chart */}
            <div style={{ height: 180, position: "relative" }}>
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const total = grandTotal || 1;
                          const pct = ((ctx.parsed / total) * 100).toFixed(1);
                          return `  ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
              {/* Center label */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                  {formatCurrency(grandTotal)}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>collected</div>
              </div>
            </div>

            {/* Mode legend */}
            <div className="d-flex flex-column gap-1 mt-2">
              {modeEntries.map(([mode, amount], i) => {
                const pct = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : "0.0";
                return (
                  <div key={mode} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: MODE_COLORS[i % MODE_COLORS.length] }} />
                      <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{mode}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 60,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "var(--border-subtle)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: MODE_COLORS[i % MODE_COLORS.length],
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", minWidth: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", minWidth: 64, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModeDonut;
