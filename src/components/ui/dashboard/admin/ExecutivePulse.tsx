"use client";
import React from "react";
import { DollarSign, TrendingUp, Users, Package, AlertCircle, ShoppingCart, CreditCard, BarChart2 } from "lucide-react";
import { num, formatCurrency, formatPct, formatNum, marginColor, MonthTotals } from "./utils";

type Summary = { total_products?: number; out_of_stock?: number; low_stock?: number; total_inventory_value?: number } | null;
type CustomerSummary = { total_customers?: number; total_balance_due?: number; customers_with_balance?: number } | null;
type POStats = { total?: number; openCount?: number; partialCount?: number; totalOpenValue?: number } | null;

type Props = {
  salesTotals: MonthTotals | null;
  priorTotals: MonthTotals | null;
  productSummary: Summary;
  customerSummary: CustomerSummary;
  poStats: POStats;
  loading: boolean;
};

const delta = (cur: number, pri: number) => {
  if (!pri) return null;
  const pct = ((cur - pri) / Math.abs(pri)) * 100;
  return { pct, up: pct >= 0 };
};

const Tile = ({ label, value, sub, accent, Icon, loading, trend }: {
  label: string; value: string; sub?: string; accent: string;
  Icon: React.ElementType; loading: boolean;
  trend?: { pct: number; up: boolean } | null;
}) => (
  <div
    className="col"
    style={{ minWidth: 160 }}
  >
    <div
      className="h-100 p-3"
      style={{
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={accent} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
        {loading ? <span className="text-muted" style={{ fontSize: 14 }}>—</span> : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
      {trend !== undefined && trend !== null && (
        <div style={{ fontSize: 10, marginTop: 4, color: trend.up ? "#10b981" : "#f43f5e", fontWeight: 600 }}>
          {trend.up ? "▲" : "▼"} {Math.abs(trend.pct).toFixed(1)}% vs prior year
        </div>
      )}
    </div>
  </div>
);

const ExecutivePulse = ({ salesTotals, priorTotals, productSummary, customerSummary, poStats, loading }: Props) => {
  const rev = num(salesTotals?.total_sales);
  const profit = num(salesTotals?.total_profit);
  const margin = num(salesTotals?.profit_margin_percent);
  const priorRev = num(priorTotals?.total_sales);
  const priorProfit = num(priorTotals?.total_profit);

  const tiles = [
    {
      label: "Total Revenue",
      value: formatCurrency(rev),
      sub: `Prior year: ${formatCurrency(priorRev)}`,
      accent: "#6366f1",
      Icon: DollarSign,
      trend: delta(rev, priorRev),
    },
    {
      label: "Gross Profit",
      value: formatCurrency(profit),
      sub: `Margin: ${formatPct(margin)}`,
      accent: "#10b981",
      Icon: TrendingUp,
      trend: delta(profit, priorProfit),
    },
    {
      label: "Gross Margin %",
      value: formatPct(margin),
      sub: margin >= 35 ? "✓ Healthy" : margin >= 20 ? "⚠ Below target" : "✗ Low margin",
      accent: marginColor(margin),
      Icon: BarChart2,
      trend: null,
    },
    {
      label: "Active Customers",
      value: formatNum(num(customerSummary?.total_customers)),
      sub: `${formatNum(num(customerSummary?.customers_with_balance))} with open balance`,
      accent: "#8b5cf6",
      Icon: Users,
      trend: null,
    },
    {
      label: "Outstanding AR",
      value: formatCurrency(num(customerSummary?.total_balance_due)),
      sub: "Total receivables due",
      accent: "#f43f5e",
      Icon: CreditCard,
      trend: null,
    },
    {
      label: "Inventory Value",
      value: formatCurrency(num(productSummary?.total_inventory_value)),
      sub: `${formatNum(num(productSummary?.total_products))} SKUs · ${formatNum(num(productSummary?.out_of_stock))} OOS`,
      accent: "#f59e0b",
      Icon: Package,
      trend: null,
    },
    {
      label: "Open PO Value",
      value: formatCurrency(num(poStats?.totalOpenValue)),
      sub: `${num(poStats?.openCount)} open · ${num(poStats?.partialCount)} partial`,
      accent: "#06b6d4",
      Icon: ShoppingCart,
      trend: null,
    },
    {
      label: "Revenue / Profit Ratio",
      value: rev > 0 ? `${((profit / rev) * 100).toFixed(0)}¢` : "—",
      sub: "Profit per $1 of revenue",
      accent: "#14b8a6",
      Icon: AlertCircle,
      trend: null,
    },
  ];

  return (
    <div className="row row-cols-2 row-cols-md-4 row-cols-xl-8 g-3">
      {tiles.map((t) => (
        <Tile key={t.label} {...t} loading={loading} />
      ))}
    </div>
  );
};

export default ExecutivePulse;
