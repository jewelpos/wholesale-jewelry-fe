"use client";

import React from "react";
import type { Icon } from "react-feather";

type Balance = {
  customerid: number;
  number_of_sale: number | null;
  last_sale_date: string | null;
  total_sale: number | null;
  amount_received: number | null;
  total_due: number | null;
};

type Aging = {
  total_due: number | null;
};

type Customer = {
  custcreditlimit: number | null;
  custdiscount: number | null;
};

type Props = {
  balance: Balance | undefined | null;
  aging: Aging | undefined | null;
  customer: Customer | undefined | null;
  loading: boolean;
  icons: {
    DollarSign: Icon;
    TrendingUp: Icon;
    AlertTriangle: Icon;
    Calendar: Icon;
    CreditCard: Icon;
  };
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

const formatDateRelative = (s: string | null | undefined) => {
  if (!s) return { label: "Never", subtle: true };
  const d = new Date(s);
  if (isNaN(d.getTime())) return { label: "—", subtle: true };
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { label: dateLabel, sub: `${days}d ago`, subtle: false };
};

const KpiStrip = ({ balance, aging, customer, loading, icons }: Props) => {
  const { DollarSign, TrendingUp, AlertTriangle, Calendar, CreditCard } = icons;

  const lifetimeSales = num(balance?.total_sale);
  const received = num(balance?.amount_received);
  const outstanding = num(aging?.total_due ?? balance?.total_due);
  const invoices = num(balance?.number_of_sale);
  const lastSale = formatDateRelative(balance?.last_sale_date);
  const creditLimit = num(customer?.custcreditlimit);
  const utilization =
    creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : null;
  const discount = num(customer?.custdiscount);

  const tiles = [
    {
      icon: <TrendingUp size={18} />,
      label: "Lifetime Sales",
      value: formatCurrency(lifetimeSales),
      sub: invoices > 0 ? `${formatNumber(invoices)} invoices` : "",
      tone: "primary",
    },
    {
      icon: <DollarSign size={18} />,
      label: "Total Paid",
      value: formatCurrency(received),
      tone: "success",
    },
    {
      icon: <AlertTriangle size={18} />,
      label: "Outstanding",
      value: formatCurrency(outstanding),
      sub: outstanding > 0 ? "owed now" : "all paid",
      tone: outstanding > 0 ? "warning" : "success",
    },
    {
      icon: <Calendar size={18} />,
      label: "Last Sale",
      value: lastSale.label,
      sub: lastSale.sub,
      tone: lastSale.subtle ? "secondary" : "info",
    },
    {
      icon: <CreditCard size={18} />,
      label: "Credit Utilization",
      value:
        creditLimit > 0 && utilization !== null
          ? `${utilization.toFixed(0)}%`
          : "—",
      sub:
        creditLimit > 0
          ? `${formatCurrency(outstanding)} / ${formatCurrency(creditLimit)}`
          : "No credit limit",
      tone:
        utilization === null
          ? "secondary"
          : utilization >= 90
          ? "danger"
          : utilization >= 60
          ? "warning"
          : "success",
    },
    {
      icon: <DollarSign size={18} />,
      label: "Discount",
      value: discount > 0 ? `${discount}%` : "—",
      tone: "secondary",
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
                {loading && !balance ? "—" : t.value}
              </div>
              {t.sub && (
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {t.sub}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiStrip;
