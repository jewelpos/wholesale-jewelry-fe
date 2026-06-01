"use client";

import React, { useMemo } from "react";
import {
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  UserPlus,
} from "react-feather";
import DashboardCustomer from "./types";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

const num = (v: number | null | undefined) => Number(v ?? 0);

const SYSTEM_ACCOUNT_PATTERN = /^(counter\s*sale|cash\s*sale|walk[\s-]*in)/i;
const isSystemAccount = (c: DashboardCustomer) =>
  SYSTEM_ACCOUNT_PATTERN.test(c.custcompanyname ?? "") ||
  SYSTEM_ACCOUNT_PATTERN.test(c.fullname ?? "");

const KpiTiles = ({ customers, loading }: Props) => {
  const kpis = useMemo(() => {
    const total = customers.length;
    const totalReceivables = customers.reduce(
      (s, c) => s + num(c.balancedue),
      0
    );
    const withBalanceDue = customers.filter((c) => num(c.balancedue) > 0)
      .length;
    const namedCustomers = customers.filter((c) => !isSystemAccount(c));
    const totalSales = namedCustomers.reduce((s, c) => s + num(c.totalsale), 0);
    const buyers = namedCustomers.filter((c) => num(c.numberofsales) > 0).length;
    const avgLifetimeSale = buyers ? totalSales / buyers : 0;
    const withOpenCredit = customers.filter((c) => num(c.opencredit) > 0)
      .length;
    const dormant = customers.filter((c) => {
      const d = c.days_since_last_sale;
      return d === null || d === undefined || d > 90;
    }).length;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const newQuarter = customers.filter((c) => {
      if (!c.custregistrationdate) return false;
      const t = new Date(c.custregistrationdate).getTime();
      return !isNaN(t) && t >= ninetyDaysAgo;
    }).length;

    return {
      total,
      totalReceivables,
      withBalanceDue,
      avgLifetimeSale,
      withOpenCredit,
      dormant,
      newQuarter,
    };
  }, [customers]);

  const tiles = [
    {
      icon: <Users size={20} />,
      label: "Total Customers",
      value: formatNumber(kpis.total),
      tone: "primary",
    },
    {
      icon: <DollarSign size={20} />,
      label: "Total Receivables",
      value: formatCurrency(kpis.totalReceivables),
      tone: "warning",
    },
    {
      icon: <AlertCircle size={20} />,
      label: "Customers w/ Balance",
      value: formatNumber(kpis.withBalanceDue),
      tone: "danger",
    },
    {
      icon: <TrendingUp size={20} />,
      label: "Avg Lifetime Sale",
      value: formatCurrency(kpis.avgLifetimeSale),
      tone: "success",
    },
    {
      icon: <Clock size={20} />,
      label: "Dormant > 90d",
      value: formatNumber(kpis.dormant),
      tone: "secondary",
    },
    {
      icon: <UserPlus size={20} />,
      label: "New (last 90d)",
      value: formatNumber(kpis.newQuarter),
      tone: "info",
    },
  ];

  return (
    <div className="row g-3">
      {tiles.map((t) => (
        <div className="col-6 col-md-4 col-xl-2" key={t.label}>
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body py-3 px-3">
              <div
                className={`d-inline-flex align-items-center justify-content-center rounded-circle bg-${t.tone}-subtle text-${t.tone} mb-2`}
                style={{ width: 36, height: 36 }}
              >
                {t.icon}
              </div>
              <div className="text-muted small mb-1">{t.label}</div>
              <div className="fs-5 fw-semibold">
                {loading && !customers.length ? "—" : t.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiTiles;
