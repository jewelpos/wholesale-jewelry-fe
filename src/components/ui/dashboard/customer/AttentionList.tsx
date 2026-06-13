"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, DollarSign, RefreshCw } from "lucide-react";
import { Slider } from "antd";
import DashboardCustomer from "./types";
import { formatCurrency, num, isSystemAccount } from "./utils";
import {
  computeChurnScore,
  churnRiskLabel,
  churnRiskBadgeClass,
  computeReorderDue,
  paymentBehaviorLabel,
  paymentBehaviorBadgeClass,
  computePaymentBehavior,
} from "./forecast";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
  storeId: number;
  outletId: number;
};

type Tab = "all" | "high-balance" | "dormant" | "overdue" | "reorder";

type AttentionItem = {
  customer: DashboardCustomer;
  reason: Tab;
  detail: string;
  amount: number;
  churnScore: number;
};

const AttentionList = ({ customers, loading, storeId, outletId }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [balanceThreshold, setBalanceThreshold] = useState<number>(5000);
  const [dormantDays, setDormantDays] = useState<number>(180);

  const allItems = useMemo<AttentionItem[]>(() => {
    const out: AttentionItem[] = [];
    for (const c of customers) {
      if (isSystemAccount(c)) continue;
      const balance = num(c.balancedue);
      const days = c.days_since_last_sale ?? null;
      const score = computeChurnScore(c);

      if (balance >= balanceThreshold) {
        out.push({ customer: c, reason: "high-balance", detail: `Balance ${formatCurrency(balance)}`, amount: balance, churnScore: score });
      } else if (balance > 0 && days !== null && days > 60) {
        out.push({ customer: c, reason: "overdue", detail: `${Math.round(days)}d since last sale, ${formatCurrency(balance)} overdue`, amount: balance, churnScore: score });
      } else if (days !== null && days > dormantDays && num(c.numberofsales) > 0) {
        out.push({ customer: c, reason: "dormant", detail: `${Math.round(days)}d since last sale`, amount: balance, churnScore: score });
      } else {
        const reorder = computeReorderDue(c);
        if (reorder && reorder.daysOverdue > 7) {
          out.push({ customer: c, reason: "reorder", detail: `Reorder overdue by ${reorder.daysOverdue}d (avg cycle ${reorder.avgCycleDays}d)`, amount: num(c.totalsale) / Math.max(1, num(c.numberofsales)), churnScore: score });
        }
      }
    }
    return out.sort((a, b) => b.churnScore - a.churnScore || b.amount - a.amount);
  }, [customers, balanceThreshold, dormantDays]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return allItems.slice(0, 12);
    return allItems.filter((i) => i.reason === activeTab).slice(0, 12);
  }, [allItems, activeTab]);

  const countFor = (tab: Tab) =>
    tab === "all" ? allItems.length : allItems.filter((i) => i.reason === tab).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "high-balance", label: "High Balance" },
    { key: "overdue", label: "Overdue" },
    { key: "dormant", label: "Dormant" },
    { key: "reorder", label: "Reorder Due" },
  ];

  const iconFor = (reason: Tab) => {
    switch (reason) {
      case "high-balance": return <DollarSign size={13} className="text-danger" />;
      case "overdue":      return <AlertTriangle size={13} className="text-danger" />;
      case "dormant":      return <Clock size={13} className="text-warning" />;
      case "reorder":      return <RefreshCw size={13} className="text-info" />;
      default:             return <AlertTriangle size={13} className="text-muted" />;
    }
  };

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body p-0">
        {/* Header */}
        <div className="d-flex align-items-start gap-2 p-3 pb-0">
          <AlertTriangle size={16} className="text-warning mt-1 flex-shrink-0" />
          <div className="flex-grow-1 min-w-0">
            <h6 className="mb-0">Needs Attention</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {allItems.length} accounts require follow-up
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="px-3 pt-2">
          <div className="row g-2">
            <div className="col-6">
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Balance ≥ {formatCurrency(balanceThreshold)}
              </div>
              <Slider
                min={1000}
                max={50000}
                step={1000}
                value={balanceThreshold}
                onChange={(v) => setBalanceThreshold(v as number)}
                tooltip={{ formatter: (v) => formatCurrency(v ?? 0) }}
                styles={{ track: { backgroundColor: "#ef4444" }, rail: { backgroundColor: "#e2e8f0" } }}
                style={{ marginBottom: 4 }}
              />
            </div>
            <div className="col-6">
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Dormant ≥ {dormantDays}d
              </div>
              <Slider
                min={30}
                max={365}
                step={30}
                value={dormantDays}
                onChange={(v) => setDormantDays(v as number)}
                tooltip={{ formatter: (v) => `${v}d` }}
                styles={{ track: { backgroundColor: "#f97316" }, rail: { backgroundColor: "#e2e8f0" } }}
                style={{ marginBottom: 4 }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex border-bottom px-3 gap-0" style={{ overflowX: "auto" }}>
          {tabs.map((t) => {
            const count = countFor(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="btn btn-link px-2 py-2 text-decoration-none"
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === t.key ? 600 : 400,
                  color: activeTab === t.key ? "var(--tile-indigo)" : "var(--text-secondary)",
                  borderBottom: activeTab === t.key ? "2px solid var(--tile-indigo)" : "2px solid transparent",
                  borderRadius: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="ms-1 badge"
                    style={{
                      fontSize: 10,
                      backgroundColor: activeTab === t.key ? "var(--tile-indigo)" : "var(--border-subtle)",
                      color: activeTab === t.key ? "#fff" : "var(--text-tertiary)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {loading && !filtered.length && (
            <div className="text-muted small py-4 text-center">Loading…</div>
          )}
          {!loading && !filtered.length && (
            <div className="text-muted small py-4 text-center">Nothing in this category.</div>
          )}
          <ul className="list-unstyled mb-0">
            {filtered.map((item) => {
              const risk = churnRiskLabel(item.churnScore);
              const behavior = computePaymentBehavior(item.customer);
              return (
                <li
                  key={`${item.customer.customerid}-${item.reason}`}
                  className="px-3 py-2"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-start gap-2 min-w-0 flex-grow-1">
                      <div className="mt-1 flex-shrink-0">{iconFor(item.reason)}</div>
                      <div className="min-w-0">
                        <Link
                          href={`/jw/${storeId}/${outletId}/dashboard/customer/${item.customer.customerid}`}
                          className="text-decoration-none fw-semibold d-block text-truncate"
                          style={{ fontSize: 13, maxWidth: 160 }}
                        >
                          {item.customer.custcompanyname || item.customer.fullname || `#${item.customer.customerid}`}
                        </Link>
                        <div className="text-muted" style={{ fontSize: 11 }}>{item.detail}</div>
                        <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                          <span className={`badge ${churnRiskBadgeClass(risk)}`} style={{ fontSize: 10 }}>
                            {risk.charAt(0).toUpperCase() + risk.slice(1)} risk
                          </span>
                          <span className={`badge ${paymentBehaviorBadgeClass(behavior)}`} style={{ fontSize: 10 }}>
                            {paymentBehaviorLabel(behavior)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                      {/* Mini risk bar */}
                      <div style={{ width: 48, height: 4, backgroundColor: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          width: `${item.churnScore}%`, height: "100%", borderRadius: 2,
                          background: item.churnScore >= 76
                            ? "linear-gradient(90deg, var(--tile-rose), var(--tile-orange))"
                            : item.churnScore >= 51
                            ? "linear-gradient(90deg, var(--tile-orange), var(--tile-amber))"
                            : item.churnScore >= 26
                            ? "linear-gradient(90deg, var(--tile-amber), var(--tile-teal))"
                            : "var(--tile-emerald)",
                        }} />
                      </div>
                      <Link
                        href={`/jw/${storeId}/${outletId}/customers/applied_payments?customerid=${item.customer.customerid}`}
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: 11, padding: "1px 8px" }}
                      >
                        Pay
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttentionList;
