"use client";

import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_SUPPLIER_STATS_QUERY } from "@/lib/graphql/query/supplier";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmt = (n: number) => formatCurrency(n);

interface Props {
  outletid: number | undefined;
}

const CARDS = [
  { key: "totalSuppliers"  as const, label: "Total Suppliers",   format: (v: number) => v.toLocaleString() },
  { key: "totalBalanceDue" as const, label: "Balance Due",       format: fmt },
  { key: "totalOpenCredit" as const, label: "Open Credit",       format: fmt },
  { key: "totalPurchases"  as const, label: "Total Purchases",   format: fmt },
];

const Skeleton = () => (
  <div style={{ height: 28, width: "60%", background: "var(--border-subtle)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
);

const SupplierStatsCards = ({ outletid }: Props) => {
  const [getStats, { data, loading }] = useLazyQuery(GET_SUPPLIER_STATS_QUERY, {
    errorPolicy: "ignore",
  });

  useEffect(() => {
    if (!outletid) return;
    getStats({ variables: { outletid } });
  }, [outletid, getStats]);

  const stats = data?.getSupplierStats;

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

export default SupplierStatsCards;
