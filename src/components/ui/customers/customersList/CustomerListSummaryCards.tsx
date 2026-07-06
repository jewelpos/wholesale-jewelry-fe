"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER_LIST_SUMMARY_QUERY } from "@/lib/graphql/query/customer";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtCurrency = (n: number) => formatCurrency(n);

const CARDS = [
  { key: "total_customers"        as const, label: "Total Customers",        format: fmtNum },
  { key: "total_balance_due"      as const, label: "Outstanding Balance",     format: fmtCurrency },
  { key: "total_sales"            as const, label: "Total Sales",             format: fmtCurrency },
  { key: "customers_with_balance" as const, label: "Customers w/ Balance",    format: fmtNum },
];

const Skeleton = () => (
  <div style={{ height: 28, width: "60%", background: "var(--border-subtle)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
);

type Props = { storeid: number };

const CustomerListSummaryCards = ({ storeid }: Props) => {
  const { data, loading } = useQuery(GET_CUSTOMER_LIST_SUMMARY_QUERY, {
    variables: { storeid },
    skip: !storeid,
  });

  const stats = data?.getCustomerListSummary;

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

export default CustomerListSummaryCards;
