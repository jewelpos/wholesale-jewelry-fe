"use client";
import React, { useMemo } from "react";
import { AlertTriangle, Clock, Package, ShoppingCart, CreditCard } from "lucide-react";
import { num, formatCurrency } from "./utils";

type AgingRow = { due_31_60?: number; due_61_90?: number; due_91_120?: number; due_120_plus?: number; total_due?: number; customername?: string; companyname?: string };
type POStats = { openCount?: number; partialCount?: number; totalOpenValue?: number } | null;
type ProductSummary = { out_of_stock?: number; low_stock?: number; total_inventory_value?: number } | null;
type ChequeRow = { yearly_total?: number; [key: string]: number | string | undefined };

type Props = {
  agingRows: AgingRow[];
  poStats: POStats;
  productSummary: ProductSummary;
  chequeRows: ChequeRow[];
  loading: boolean;
};

const AlertCard = ({ icon: Icon, title, value, sub, color, items }: {
  icon: React.ElementType; title: string; value: string; sub: string; color: string;
  items?: { label: string; amount: string }[];
}) => (
  <div className="card h-100" style={{ border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
    <div className="card-body p-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>{title}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{sub}</div>
      {items && items.length > 0 && (
        <div style={{ maxHeight: 100, overflowY: "auto" }}>
          {items.map((it, i) => (
            <div key={i} className="d-flex justify-content-between" style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="text-truncate text-muted" style={{ maxWidth: 140 }}>{it.label}</span>
              <span style={{ fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{it.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const AlertCenter = ({ agingRows, poStats, productSummary, chequeRows, loading }: Props) => {
  const { overdueTotal, overdueCount, topOverdue } = useMemo(() => {
    let total = 0, count = 0;
    const top: { label: string; amount: string }[] = [];
    for (const r of agingRows) {
      const overdue = num(r.due_31_60) + num(r.due_61_90) + num(r.due_91_120) + num(r.due_120_plus);
      if (overdue > 0) {
        count++;
        total += overdue;
        top.push({ label: r.companyname || r.customername || "—", amount: formatCurrency(overdue) });
      }
    }
    top.sort((a, b) => {
      const va = parseFloat(a.amount.replace(/[$,]/g, ""));
      const vb = parseFloat(b.amount.replace(/[$,]/g, ""));
      return vb - va;
    });
    return { overdueTotal: total, overdueCount: count, topOverdue: top.slice(0, 5) };
  }, [agingRows]);

  const chequeTotal = useMemo(() => chequeRows.reduce((s, r) => s + num(r.yearly_total as number), 0), [chequeRows]);

  if (loading) return (
    <div className="row g-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-6 col-md-3">
          <div className="card" style={{ height: 130, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)" }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="row g-3">
      <div className="col-6 col-md-3">
        <AlertCard
          icon={CreditCard} title="Overdue AR" color="#f43f5e"
          value={formatCurrency(overdueTotal)}
          sub={`${overdueCount} customers with 30d+ overdue invoices`}
          items={topOverdue}
        />
      </div>
      <div className="col-6 col-md-3">
        <AlertCard
          icon={Package} title="Stock Alerts" color="#f59e0b"
          value={formatNum(num(productSummary?.out_of_stock) + num(productSummary?.low_stock))}
          sub={`${num(productSummary?.out_of_stock)} out of stock · ${num(productSummary?.low_stock)} low stock`}
          items={[]}
        />
      </div>
      <div className="col-6 col-md-3">
        <AlertCard
          icon={ShoppingCart} title="Open POs" color="#6366f1"
          value={formatCurrency(num(poStats?.totalOpenValue))}
          sub={`${num(poStats?.openCount)} open · ${num(poStats?.partialCount)} partially received`}
          items={[]}
        />
      </div>
      <div className="col-6 col-md-3">
        <AlertCard
          icon={Clock} title="Cheque Portfolio" color="#8b5cf6"
          value={formatCurrency(chequeTotal)}
          sub={`${chequeRows.length} customers · cheques on hand`}
          items={[]}
        />
      </div>
    </div>
  );
};

const formatNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export default AlertCenter;
