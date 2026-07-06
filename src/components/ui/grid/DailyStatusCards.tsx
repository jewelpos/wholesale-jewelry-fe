"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currencyFormat";

export interface DailySummaryData {
  total_today?: number | null;
  paid_today?: number | null;
  pending_today?: number | null;
  voided_today?: number | null;
  revenue_today?: number | null;
  avg_today?: number | null;
}

interface Props {
  data: DailySummaryData | null | undefined;
  loading: boolean;
  labelOverrides?: {
    total?: string;
    revenue?: string;
    avg?: string;
    open?: string;
  };
}

const Skeleton = () => (
  <div
    style={{
      height: 28,
      width: "60%",
      background: "#e2e8f0",
      borderRadius: 6,
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  />
);

const Card = ({
  label,
  value,
  context,
  loading,
}: {
  label: string;
  value: string;
  context: string;
  loading: boolean;
}) => (
  <div className="col-6 col-md-3">
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-card)",
        padding: "12px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-tertiary)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {loading ? (
        <Skeleton />
      ) : (
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.15,
            marginBottom: 4,
          }}
        >
          {value}
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
        {loading ? "" : context}
      </div>
    </div>
  </div>
);

const DailyStatusCards: React.FC<Props> = ({ data, loading, labelOverrides }) => {
  const total = Number(data?.total_today ?? 0);
  const paid = Number(data?.paid_today ?? 0);
  const pending = Number(data?.pending_today ?? 0);
  const revenue = Number(data?.revenue_today ?? 0);
  const avg = Number(data?.avg_today ?? 0);

  return (
    <div className="row g-2 mb-1">
      <Card
        label={labelOverrides?.revenue ?? "Revenue Today"}
        value={formatCurrency(revenue)}
        context={`${total} ${total === 1 ? "document" : "documents"} today`}
        loading={loading}
      />
      <Card
        label={labelOverrides?.total ?? "Documents Today"}
        value={String(total)}
        context={`${paid} paid · ${pending} open`}
        loading={loading}
      />
      <Card
        label={labelOverrides?.avg ?? "Avg Value"}
        value={formatCurrency(avg)}
        context="per document today"
        loading={loading}
      />
      <Card
        label={labelOverrides?.open ?? "Open Today"}
        value={String(pending)}
        context="awaiting payment"
        loading={loading}
      />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default DailyStatusCards;
