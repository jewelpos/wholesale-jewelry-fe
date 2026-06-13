"use client";

import React, { useMemo } from "react";
import { Package, AlertTriangle, XCircle, DollarSign, TrendingUp, BarChart2, ShoppingCart, Clock } from "lucide-react";
import { ProductListType } from "@/types/product";
import { num, formatCurrency } from "./utils";

type Summary = { total_products: number; out_of_stock: number; low_stock: number; total_inventory_value: number } | null;

type Props = { summary: Summary; products: ProductListType[]; loading: boolean };

const KpiStrip = ({ summary, products, loading }: Props) => {
  const derived = useMemo(() => {
    const totalSoldValue = products.reduce((s, p) => s + num(p.totalsoldvalue), 0);
    const totalSoldProfit = products.reduce((s, p) => s + num(p.totalsoldprofit), 0);
    const totalBooked = products.reduce((s, p) => s + num(p.soquantity), 0);
    const avgMargin = totalSoldValue > 0 ? (totalSoldProfit / totalSoldValue) * 100 : 0;
    return { totalSoldValue, totalSoldProfit, totalBooked, avgMargin };
  }, [products]);

  const tiles = [
    {
      label: "Total SKUs",
      value: loading ? "—" : formatNumber(summary?.total_products ?? 0),
      icon: Package, accent: "#6366f1", bg: "var(--tile-indigo-bg)",
    },
    {
      label: "Inventory Value",
      value: loading ? "—" : formatCurrency(num(summary?.total_inventory_value)),
      icon: DollarSign, accent: "#8b5cf6", bg: "var(--tile-violet-bg)",
    },
    {
      label: "Out of Stock",
      value: loading ? "—" : formatNumber(summary?.out_of_stock ?? 0),
      icon: XCircle, accent: "#f43f5e", bg: "var(--tile-rose-bg)",
    },
    {
      label: "Low Stock",
      value: loading ? "—" : formatNumber(summary?.low_stock ?? 0),
      icon: AlertTriangle, accent: "#f59e0b", bg: "var(--tile-amber-bg)",
    },
    {
      label: "Total Sold (YTD)",
      value: loading ? "—" : formatCurrency(derived.totalSoldValue),
      icon: TrendingUp, accent: "#10b981", bg: "var(--tile-emerald-bg)",
    },
    {
      label: "Total Profit",
      value: loading ? "—" : formatCurrency(derived.totalSoldProfit),
      icon: BarChart2, accent: "#14b8a6", bg: "var(--tile-teal-bg)",
    },
    {
      label: "Avg Margin",
      value: loading ? "—" : `${derived.avgMargin.toFixed(1)}%`,
      icon: TrendingUp,
      accent: derived.avgMargin >= 20 ? "#10b981" : derived.avgMargin >= 10 ? "#f59e0b" : "#f43f5e",
      bg: derived.avgMargin >= 20 ? "var(--tile-emerald-bg)" : derived.avgMargin >= 10 ? "var(--tile-amber-bg)" : "var(--tile-rose-bg)",
    },
    {
      label: "Units on Order (SO)",
      value: loading ? "—" : formatNumber(derived.totalBooked),
      icon: ShoppingCart, accent: "#f97316", bg: "var(--tile-orange-bg)",
    },
  ];

  return (
    <div className="row g-2">
      {tiles.map(({ label, value, icon: Icon, accent, bg }) => (
        <div key={label} className="col-6 col-sm-4 col-xl-3">
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
              <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={15} style={{ color: accent }} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
              {value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export default KpiStrip;
