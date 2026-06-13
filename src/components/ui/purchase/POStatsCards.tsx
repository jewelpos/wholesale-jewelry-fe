"use client";

import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_PURCHASE_ORDER_STATS_QUERY } from "@/lib/graphql/query/purchase";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  storeid: number;
  supplierid?: number;
}

const CARDS = [
  { key: "total"          as const, label: "Total POs",           format: (v: number) => v.toLocaleString() },
  { key: "openCount"      as const, label: "Open",                format: (v: number) => v.toLocaleString() },
  { key: "partialCount"   as const, label: "Partially Received",  format: (v: number) => v.toLocaleString() },
  { key: "totalOpenValue" as const, label: "Total Open Value",    format: fmt },
];

const Skeleton = () => (
  <div style={{ height: 28, width: "60%", background: "var(--border-subtle)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
);

const POStatsCards = ({ storeid, supplierid }: Props) => {
  const [getStats, { data, loading }] = useLazyQuery(GET_PURCHASE_ORDER_STATS_QUERY);

  useEffect(() => {
    if (!storeid) return;
    const vars: Record<string, number> = { storeid };
    if (supplierid && supplierid !== -1) vars.supplierid = supplierid;
    getStats({ variables: vars });
  }, [storeid, supplierid, getStats]);

  const stats = data?.getPurchaseOrderStats;

  return (
    <div className="row g-2 mb-3">
      {CARDS.map((card) => {
        const value = stats?.[card.key] ?? 0;
        return (
          <div key={card.key} className="col-6 col-md-3">
            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                padding: "12px 16px",
                height: "100%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                {card.label}
              </div>
              {loading ? (
                <Skeleton />
              ) : (
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15 }}>
                  {card.format(value)}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default POStatsCards;
