"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Clock, Zap } from "lucide-react";
import { Slider } from "antd";
import { ProductListType } from "@/types/product";
import { num, formatCurrency, daysSince } from "./utils";

type Props = { products: ProductListType[]; loading: boolean };

const AlertPanels = ({ products, loading }: Props) => {
  const { storeId, outletId } = useParams();
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [dormantDays, setDormantDays] = useState(90);

  const { lowStock, deadStock, demandPressure } = useMemo(() => {
    const lowStock = products
      .filter((p) => num(p.itemquantityinhand) > 0 && num(p.itemquantityinhand) <= lowStockThreshold)
      .sort((a, b) => num(a.itemquantityinhand) - num(b.itemquantityinhand))
      .slice(0, 10);

    const deadStock = products
      .filter((p) => {
        const days = daysSince(p.lastsaledate);
        return num(p.itemquantityinhand) > 0 && (days === null || days >= dormantDays);
      })
      .map((p) => ({ ...p, _days: daysSince(p.lastsaledate) }))
      .sort((a, b) => (b._days ?? 9999) - (a._days ?? 9999))
      .slice(0, 10);

    const demandPressure = products
      .filter((p) => num(p.soquantity) > num(p.availableqty))
      .map((p) => ({ ...p, _gap: num(p.soquantity) - num(p.availableqty) }))
      .sort((a, b) => b._gap - a._gap)
      .slice(0, 10);

    return { lowStock, deadStock, demandPressure };
  }, [products, lowStockThreshold, dormantDays]);

  const ItemRow = ({ p, right }: { p: ProductListType & { _days?: number | null; _gap?: number }; right: React.ReactNode }) => (
    <div
      className="d-flex align-items-start justify-content-between gap-2 px-3 py-2"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="min-w-0 flex-grow-1">
        <Link
          href={`/jw/${storeId}/${outletId}/products/${p.itemcode}/view`}
          className="text-decoration-none fw-semibold d-block text-truncate"
          style={{ fontSize: 12, color: "var(--text-primary)" }}
        >
          {p.itemdescription || p.itemcode}
        </Link>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
          {p.itemcode}{p.itemmetal ? ` · ${p.itemmetal}` : ""}{p.categoryname ? ` · ${p.categoryname}` : ""}
        </div>
      </div>
      <div className="flex-shrink-0 text-end">{right}</div>
    </div>
  );

  const Panel = ({
    icon: Icon,
    accent,
    title,
    sub,
    count,
    children,
  }: {
    icon: React.FC<{ size: number; style?: React.CSSProperties }>;
    accent: string;
    title: string;
    sub: string;
    count: number;
    children: React.ReactNode;
  }) => (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderTop: `3px solid ${accent}`, borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="d-flex align-items-start gap-2 px-3 pt-3 pb-2">
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: accent + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{sub}</div>
        </div>
        <span
          className="ms-auto badge"
          style={{ fontSize: 11, backgroundColor: accent + "22", color: accent, border: `1px solid ${accent}44` }}
        >
          {count}
        </span>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {loading ? (
          <div className="text-muted small py-3 text-center">Loading…</div>
        ) : count === 0 ? (
          <div className="text-muted small py-3 text-center">All clear</div>
        ) : children}
      </div>
    </div>
  );

  return (
    <div className="row g-3">
      {/* Low Stock */}
      <div className="col-12 col-xl-4">
        <Panel icon={AlertTriangle} accent="#f59e0b" title="Low Stock Alert" sub={`qty ≤ ${lowStockThreshold} units`} count={lowStock.length}>
          <div className="px-3 pt-1 pb-2">
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Threshold: ≤ {lowStockThreshold}</div>
            <Slider min={1} max={100} step={1} value={lowStockThreshold} onChange={(v) => setLowStockThreshold(v as number)}
              styles={{ track: { backgroundColor: "#f59e0b" }, rail: { backgroundColor: "#e2e8f0" } }}
              tooltip={{ formatter: (v) => `${v} units` }} style={{ marginBottom: 4 }} />
          </div>
          {lowStock.map((p) => (
            <ItemRow key={`${p.itemid}-${p.itemwarehouseid}`} p={p} right={
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{num(p.itemquantityinhand)}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>in hand</div>
                <div style={{ height: 3, width: 48, borderRadius: 2, backgroundColor: "var(--border-subtle)", marginTop: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (num(p.itemquantityinhand) / lowStockThreshold) * 100)}%`, height: "100%", backgroundColor: "#f59e0b", borderRadius: 2 }} />
                </div>
              </div>
            } />
          ))}
        </Panel>
      </div>

      {/* Dead Stock */}
      <div className="col-12 col-xl-4">
        <Panel icon={Clock} accent="#f43f5e" title="Dead Stock" sub={`no sale in ${dormantDays}+ days`} count={deadStock.length}>
          <div className="px-3 pt-1 pb-2">
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Dormant ≥ {dormantDays}d</div>
            <Slider min={30} max={365} step={30} value={dormantDays} onChange={(v) => setDormantDays(v as number)}
              marks={{ 30: "30d", 90: "90d", 180: "180d", 365: "1yr" }}
              styles={{ track: { backgroundColor: "#f43f5e" }, rail: { backgroundColor: "#e2e8f0" } }}
              tooltip={{ formatter: (v) => `${v}d` }} style={{ marginBottom: 4 }} />
          </div>
          {deadStock.map((p) => {
            const capitalTied = num(p.itemquantityinhand) * num(p.itemaveragecost || p.avgpurchasecost);
            return (
              <ItemRow key={`${p.itemid}-${p.itemwarehouseid}`} p={p} right={
                <div className="text-end">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f43f5e" }}>
                    {p._days !== null && p._days !== undefined ? `${p._days}d` : "Never sold"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>since last sale</div>
                  {capitalTied > 0 && (
                    <div style={{ fontSize: 10, color: "#f97316", marginTop: 1 }}>{formatCurrency(capitalTied)} tied</div>
                  )}
                </div>
              } />
            );
          })}
        </Panel>
      </div>

      {/* Demand Pressure */}
      <div className="col-12 col-xl-4">
        <Panel icon={Zap} accent="#6366f1" title="Demand Pressure" sub="SO qty exceeds available stock" count={demandPressure.length}>
          {demandPressure.map((p) => (
            <ItemRow key={`${p.itemid}-${p.itemwarehouseid}`} p={p} right={
              <div className="text-end">
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", fontVariantNumeric: "tabular-nums" }}>−{p._gap}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>unit shortfall</div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                  {num(p.availableqty)} avail / {num(p.soquantity)} ordered
                </div>
              </div>
            } />
          ))}
        </Panel>
      </div>
    </div>
  );
};

export default AlertPanels;
