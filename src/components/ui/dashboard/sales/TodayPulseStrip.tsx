"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { TrendingUp, FileText, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import { GET_INVOICE_DAILY_SUMMARY_QUERY } from "@/lib/graphql/query/sales";
import { formatCurrency, num } from "./utils";

const TILES = [
  {
    key: "revenue_today" as const,
    label: "Revenue Today",
    icon: TrendingUp,
    accent: "#6366f1",
    bg: "var(--tile-indigo-bg)",
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "total_today" as const,
    label: "Invoices Today",
    icon: FileText,
    accent: "#8b5cf6",
    bg: "var(--tile-violet-bg)",
    format: (v: number) => String(v),
  },
  {
    key: "paid_today" as const,
    label: "Paid Today",
    icon: CheckCircle,
    accent: "#10b981",
    bg: "var(--tile-emerald-bg)",
    format: (v: number) => String(v),
  },
  {
    key: "pending_today" as const,
    label: "Pending",
    icon: Clock,
    accent: "#f59e0b",
    bg: "var(--tile-amber-bg)",
    format: (v: number) => String(v),
  },
  {
    key: "voided_today" as const,
    label: "Voided",
    icon: XCircle,
    accent: "#f43f5e",
    bg: "var(--tile-rose-bg)",
    format: (v: number) => String(v),
  },
  {
    key: "avg_today" as const,
    label: "Avg Invoice",
    icon: DollarSign,
    accent: "#06b6d4",
    bg: "var(--tile-cyan-bg)",
    format: (v: number) => formatCurrency(v),
  },
];

type DailySummary = {
  total_today: number;
  paid_today: number;
  pending_today: number;
  voided_today: number;
  revenue_today: number;
  avg_today: number;
};

const TodayPulseStrip = () => {
  const { outletId } = useParams();
  const parsedOutletId = parseInt(outletId as string, 10);

  const { data, loading } = useQuery(GET_INVOICE_DAILY_SUMMARY_QUERY, {
    variables: { outletid: parsedOutletId },
    skip: !parsedOutletId,
    pollInterval: 5 * 60 * 1000,
  });

  const summary: DailySummary = data?.getInvoiceDailySummary ?? {
    total_today: 0, paid_today: 0, pending_today: 0,
    voided_today: 0, revenue_today: 0, avg_today: 0,
  };

  return (
    <div className="row g-2">
      {TILES.map(({ key, label, icon: Icon, accent, bg, format }) => {
        const value = num(summary[key]);
        return (
          <div key={key} className="col-6 col-sm-4 col-xl-2">
            <div
              className="p-3 h-100"
              style={{
                border: "1px solid var(--border-subtle)",
                borderLeft: `4px solid ${accent}`,
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--surface-card)",
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={15} style={{ color: accent }} />
                </div>
                {loading && (
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ color: accent, width: 12, height: 12, borderWidth: 2 }}
                  />
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {loading ? "—" : format(value)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginTop: 2 }}>
                {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodayPulseStrip;
