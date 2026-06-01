"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, DollarSign } from "react-feather";
import DashboardCustomer from "./types";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
  storeId: number;
  outletId: number;
};

const BALANCE_ALERT_THRESHOLD = 5000;
const DORMANT_DAYS = 180;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: number | null | undefined) => Number(v ?? 0);

const SYSTEM_ACCOUNT_PATTERN = /^(counter\s*sale|cash\s*sale|walk[\s-]*in)/i;
const isSystemAccount = (c: DashboardCustomer) =>
  SYSTEM_ACCOUNT_PATTERN.test(c.custcompanyname ?? "") ||
  SYSTEM_ACCOUNT_PATTERN.test(c.fullname ?? "");

type AttentionItem = {
  customer: DashboardCustomer;
  reason: "high-balance" | "dormant-with-balance";
  detail: string;
  amount: number;
};

const AttentionList = ({ customers, loading, storeId, outletId }: Props) => {
  const items = useMemo<AttentionItem[]>(() => {
    const out: AttentionItem[] = [];
    for (const c of customers) {
      if (isSystemAccount(c)) continue;
      const balance = num(c.balancedue);
      const days = c.days_since_last_sale ?? null;

      if (balance >= BALANCE_ALERT_THRESHOLD) {
        out.push({
          customer: c,
          reason: "high-balance",
          detail: `Balance ${formatCurrency(balance)}`,
          amount: balance,
        });
        continue;
      }

      if (
        balance > 0 &&
        (days === null || days > DORMANT_DAYS)
      ) {
        out.push({
          customer: c,
          reason: "dormant-with-balance",
          detail:
            days === null
              ? `No recorded sale, ${formatCurrency(balance)} owed`
              : `${Math.round(days)}d since last sale, ${formatCurrency(
                  balance
                )} owed`,
          amount: balance,
        });
      }
    }
    return out.sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [customers]);

  const iconFor = (r: AttentionItem["reason"]) => {
    if (r === "high-balance")
      return <DollarSign size={14} className="text-danger" />;
    return <Clock size={14} className="text-warning" />;
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            <div>
              <h6 className="mb-1">Needs Attention</h6>
              <div className="text-muted small">
                High balance or dormant with money owed
              </div>
            </div>
          </div>
        </div>

        {loading && !items.length && (
          <div className="text-muted small py-4 text-center">Loading…</div>
        )}

        {!loading && !items.length && (
          <div className="text-muted small py-4 text-center">
            Nothing requires attention.
          </div>
        )}

        <ul className="list-unstyled mb-0">
          {items.map((item) => (
            <li
              key={`${item.customer.customerid}-${item.reason}`}
              className="d-flex align-items-start justify-content-between py-2 border-bottom"
            >
              <div className="d-flex align-items-start gap-2">
                <div className="mt-1">{iconFor(item.reason)}</div>
                <div>
                  <Link
                    href={`/jw/${storeId}/${outletId}/dashboard/customer/${item.customer.customerid}`}
                    className="text-decoration-none fw-semibold d-block"
                  >
                    {item.customer.custcompanyname ||
                      item.customer.fullname ||
                      `Customer #${item.customer.customerid}`}
                  </Link>
                  <div className="text-muted small">{item.detail}</div>
                </div>
              </div>
              <Link
                href={`/jw/${storeId}/${outletId}/customers/applied_payments?customerid=${item.customer.customerid}`}
                className="btn btn-sm btn-outline-primary"
              >
                Record payment
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AttentionList;
