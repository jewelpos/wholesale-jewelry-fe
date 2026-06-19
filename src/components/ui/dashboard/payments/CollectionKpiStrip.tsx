"use client";

import React from "react";
import { num, formatCurrency, pctChange } from "@/components/ui/dashboard/admin/utils";

interface PaymentCollectionStats {
  todayTotal: number;
  thisWeekTotal: number;
  thisMonthTotal: number;
  ytdTotal: number;
  todayCount: number;
  thisMonthCount: number;
  yesterdayTotal: number;
  priorWeekTotal: number;
  priorMonthTotal: number;
  priorYtdTotal: number;
  currentDso: number;
  priorPeriodDso: number;
}

interface Props {
  stats: PaymentCollectionStats | null;
  loading: boolean;
}

const TrendBadge = ({
  current,
  prior,
  invertColor = false,
  label,
}: {
  current: number;
  prior: number;
  invertColor?: boolean;
  label: string;
}) => {
  const pct = pctChange(current, prior);
  if (pct === null) return <span className="text-muted" style={{ fontSize: 10 }}>{label}</span>;
  const up = pct >= 0;
  const good = invertColor ? !up : up;
  const color = good ? "#10b981" : "#f43f5e";
  const sign = up ? "↑" : "↓";
  return (
    <span style={{ fontSize: 10, color, fontWeight: 600 }}>
      {sign}{Math.abs(pct).toFixed(1)}% {label}
    </span>
  );
};

interface PillProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  trend?: React.ReactNode;
}

const Pill = ({ icon, label, value, sub, trend }: PillProps) => (
  <div
    className="card flex-grow-1"
    style={{
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-card)",
      backgroundColor: "var(--surface-card)",
      minWidth: 0,
    }}
  >
    <div className="card-body p-2 p-md-3">
      <div className="d-flex align-items-center gap-1 mb-1">
        <i className={`${icon} text-muted`} style={{ fontSize: 12 }} />
        <span className="text-muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div className="text-muted" style={{ fontSize: 10 }}>{sub}</div>}
      {trend && <div className="mt-1">{trend}</div>}
    </div>
  </div>
);

const Skeleton = () => (
  <div className="card flex-grow-1" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)", minWidth: 0 }}>
    <div className="card-body p-2 p-md-3">
      <div style={{ height: 8, width: "50%", backgroundColor: "var(--border-subtle)", borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 20, width: "80%", backgroundColor: "var(--border-subtle)", borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 8, width: "60%", backgroundColor: "var(--border-subtle)", borderRadius: 4 }} />
    </div>
  </div>
);

const CollectionKpiStrip = ({ stats, loading }: Props) => {
  if (loading || !stats) {
    return (
      <div className="d-flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  const today = num(stats.todayTotal);
  const thisWeek = num(stats.thisWeekTotal);
  const thisMonth = num(stats.thisMonthTotal);
  const ytd = num(stats.ytdTotal);
  const dso = num(stats.currentDso);

  return (
    <div className="d-flex flex-wrap gap-2">
      <Pill
        icon="fas fa-calendar-day"
        label="Today"
        value={formatCurrency(today)}
        sub={`${num(stats.todayCount)} payments`}
        trend={<TrendBadge current={today} prior={num(stats.yesterdayTotal)} label="vs yesterday" />}
      />
      <Pill
        icon="fas fa-calendar-week"
        label="This Week"
        value={formatCurrency(thisWeek)}
        trend={<TrendBadge current={thisWeek} prior={num(stats.priorWeekTotal)} label="vs last wk" />}
      />
      <Pill
        icon="fas fa-calendar-alt"
        label="This Month"
        value={formatCurrency(thisMonth)}
        sub={`${num(stats.thisMonthCount)} payments`}
        trend={<TrendBadge current={thisMonth} prior={num(stats.priorMonthTotal)} label="vs last mo" />}
      />
      <Pill
        icon="fas fa-chart-line"
        label="YTD"
        value={formatCurrency(ytd)}
        trend={<TrendBadge current={ytd} prior={num(stats.priorYtdTotal)} label="vs prior yr" />}
      />
      <Pill
        icon="fas fa-clock"
        label="DSO"
        value={`${dso.toFixed(1)} days`}
        trend={
          <TrendBadge
            current={dso}
            prior={num(stats.priorPeriodDso)}
            invertColor
            label="vs prior"
          />
        }
      />
    </div>
  );
};

export default CollectionKpiStrip;
