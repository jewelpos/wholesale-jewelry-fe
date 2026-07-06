"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import { GET_PRODUCT_LIST_SUMMARY_QUERY } from "@/lib/graphql/query/products";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtCurrency = (n: number) => formatCurrency(n);

const CARDS = [
  { key: "total_products"       as const, label: "Total Products",    format: fmtNum },
  { key: "out_of_stock"         as const, label: "Out of Stock",       format: fmtNum },
  { key: "low_stock"            as const, label: "Low Stock (≤5)",     format: fmtNum },
  { key: "total_inventory_value" as const, label: "Inventory Value",   format: fmtCurrency },
];

const Skeleton = () => (
  <div style={{ height: 28, width: "60%", background: "var(--border-subtle)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
);

type Props = { outletid: number };

const ProductListSummaryCards = ({ outletid }: Props) => {
  const { data, loading } = useQuery(GET_PRODUCT_LIST_SUMMARY_QUERY, {
    variables: { outletid },
    skip: !outletid || outletid <= 0,
  });

  const stats = data?.getProductListSummary;

  return (
    <div className="row g-2 mb-3">
      {CARDS.map((card) => {
        const value = Number(stats?.[card.key] ?? 0);
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

export default ProductListSummaryCards;
