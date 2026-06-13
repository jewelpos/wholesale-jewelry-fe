"use client";

import React from "react";
import { TrendingUp, DollarSign, AlertTriangle, Calendar, CreditCard, Percent, Clock, Activity } from "lucide-react";

type Balance = {
  customerid: number;
  number_of_sale: number | null;
  last_sale_date: string | null;
  total_sale: number | null;
  amount_received: number | null;
  total_due: number | null;
};

type Aging = { total_due: number | null };
type Customer = { custcreditlimit: number | null; custdiscount: number | null };

type Props = {
  balance: Balance | undefined | null;
  aging: Aging | undefined | null;
  customer: Customer | undefined | null;
  loading: boolean;
  paymentBehaviorBadge?: React.ReactNode;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

const num = (v: number | null | undefined) => Number(v ?? 0);

const formatDateRelative = (s: string | null | undefined) => {
  if (!s) return { label: "Never", subtle: true };
  const d = new Date(s);
  if (isNaN(d.getTime())) return { label: "—", subtle: true };
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { label: dateLabel, sub: `${days}d ago`, subtle: false };
};

type Accent = { color: string; bg: string };
const A: Record<string, Accent> = {
  indigo:  { color: "var(--tile-indigo)",  bg: "var(--tile-indigo-bg)"  },
  emerald: { color: "var(--tile-emerald)", bg: "var(--tile-emerald-bg)" },
  amber:   { color: "var(--tile-amber)",   bg: "var(--tile-amber-bg)"   },
  rose:    { color: "var(--tile-rose)",    bg: "var(--tile-rose-bg)"    },
  violet:  { color: "var(--tile-violet)",  bg: "var(--tile-violet-bg)"  },
  cyan:    { color: "var(--tile-cyan)",    bg: "var(--tile-cyan-bg)"    },
  teal:    { color: "var(--tile-teal)",    bg: "var(--tile-teal-bg)"    },
  orange:  { color: "var(--tile-orange)",  bg: "var(--tile-orange-bg)"  },
};

const KpiStrip = ({ balance, aging, customer, loading, paymentBehaviorBadge }: Props) => {
  const lifetimeSales = num(balance?.total_sale);
  const received = num(balance?.amount_received);
  const outstanding = num(aging?.total_due ?? balance?.total_due);
  const invoices = num(balance?.number_of_sale);
  const lastSale = formatDateRelative(balance?.last_sale_date);
  const creditLimit = num(customer?.custcreditlimit);
  const utilization = creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : null;
  const discount = num(customer?.custdiscount);
  const dso = lifetimeSales > 0 ? Math.round((outstanding / lifetimeSales) * 365) : null;
  const avgOrder = invoices > 0 ? lifetimeSales / invoices : 0;

  const tiles = [
    {
      icon: <TrendingUp size={16} />,
      label: "Lifetime Sales",
      value: formatCurrency(lifetimeSales),
      sub: invoices > 0 ? `${formatNumber(invoices)} invoices · avg ${formatCurrency(avgOrder)}` : "No invoices",
      accent: A.indigo,
    },
    {
      icon: <DollarSign size={16} />,
      label: "Total Paid",
      value: formatCurrency(received),
      sub: lifetimeSales > 0 ? `${((received / lifetimeSales) * 100).toFixed(0)}% of lifetime` : "",
      accent: A.emerald,
    },
    {
      icon: <AlertTriangle size={16} />,
      label: "Outstanding",
      value: formatCurrency(outstanding),
      sub: outstanding > 0 ? "owed now" : "fully paid",
      accent: outstanding > 0 ? A.amber : A.emerald,
    },
    {
      icon: <Calendar size={16} />,
      label: "Last Sale",
      value: lastSale.label,
      sub: lastSale.sub,
      accent: lastSale.subtle ? A.teal : A.cyan,
    },
    {
      icon: <CreditCard size={16} />,
      label: "Credit Utilization",
      value: creditLimit > 0 && utilization !== null ? `${utilization.toFixed(0)}%` : "—",
      sub: creditLimit > 0 ? `${formatCurrency(outstanding)} / ${formatCurrency(creditLimit)}` : "No credit limit",
      accent: utilization === null ? A.teal : utilization >= 90 ? A.rose : utilization >= 60 ? A.amber : A.emerald,
    },
    {
      icon: <Activity size={16} />,
      label: "Customer DSO",
      value: dso !== null && dso > 0 ? `${dso}d` : "—",
      sub: "collection velocity",
      accent: dso !== null && dso > 60 ? A.rose : dso !== null && dso > 30 ? A.amber : A.emerald,
    },
    {
      icon: <Percent size={16} />,
      label: "Discount",
      value: discount > 0 ? `${discount}%` : "—",
      sub: discount > 0 ? "standing discount" : "no discount",
      accent: A.violet,
    },
    {
      icon: <Clock size={16} />,
      label: "Payment Behavior",
      value: paymentBehaviorBadge ?? "—",
      sub: "based on balance history",
      accent: A.orange,
      isNode: true,
    },
  ];

  return (
    <div className="row g-3">
      {tiles.map((t) => (
        <div className="col-6 col-md-4 col-xl-3" key={t.label}>
          <div
            className="card h-100"
            style={{
              border: "1px solid var(--border-subtle)",
              borderLeft: `4px solid ${t.accent.color}`,
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="card-body py-3 px-3">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: t.accent.bg, color: t.accent.color }}
              >
                {t.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                {t.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.4px" }}>
                {loading && !balance ? "—" : t.isNode ? t.value : String(t.value)}
              </div>
              {t.sub && !t.isNode && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{t.sub}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiStrip;
