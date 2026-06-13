"use client";

import React, { useMemo } from "react";
import { Users, DollarSign, AlertCircle, TrendingUp, UserPlus, Activity, Zap, BarChart2 } from "lucide-react";
import DashboardCustomer from "./types";
import { formatCurrency, formatNumber, num, isSystemAccount } from "./utils";
import { computeAtRiskRevenue, computeDSO } from "./forecast";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
};

type TileAccent = {
  color: string;
  bg: string;
};

const ACCENTS: Record<string, TileAccent> = {
  indigo:  { color: "var(--tile-indigo)",  bg: "var(--tile-indigo-bg)"  },
  violet:  { color: "var(--tile-violet)",  bg: "var(--tile-violet-bg)"  },
  emerald: { color: "var(--tile-emerald)", bg: "var(--tile-emerald-bg)" },
  amber:   { color: "var(--tile-amber)",   bg: "var(--tile-amber-bg)"   },
  rose:    { color: "var(--tile-rose)",    bg: "var(--tile-rose-bg)"    },
  cyan:    { color: "var(--tile-cyan)",    bg: "var(--tile-cyan-bg)"    },
  orange:  { color: "var(--tile-orange)",  bg: "var(--tile-orange-bg)"  },
  teal:    { color: "var(--tile-teal)",    bg: "var(--tile-teal-bg)"    },
};

const KpiTiles = ({ customers, loading }: Props) => {
  const kpis = useMemo(() => {
    const named = customers.filter((c) => !isSystemAccount(c));
    const totalAR = named.reduce((s, c) => s + num(c.balancedue), 0);
    const totalSales = named.reduce((s, c) => s + num(c.totalsale), 0);
    const collectionRate = totalSales > 0 ? ((totalSales - totalAR) / totalSales) * 100 : 0;
    const dso = computeDSO(totalAR, totalSales);
    const overdue60Amount = named
      .filter((c) => num(c.balancedue) > 0 && (c.days_since_last_sale ?? 0) > 60)
      .reduce((s, c) => s + num(c.balancedue), 0);
    const buyers = named.filter((c) => num(c.numberofsales) > 0);
    const avgLifetimeSale = buyers.length ? totalSales / buyers.length : 0;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const newQuarter = named.filter((c) => {
      if (!c.custregistrationdate) return false;
      const t = new Date(c.custregistrationdate).getTime();
      return !isNaN(t) && t >= ninetyDaysAgo;
    }).length;
    const totalAtRisk = named.reduce((s, c) => s + computeAtRiskRevenue(c), 0);
    const dormantCount = named.filter((c) => {
      const d = c.days_since_last_sale;
      return d !== null && d !== undefined && d > 90 && num(c.numberofsales) > 0;
    }).length;
    return { total: named.length, totalAR, totalSales, collectionRate, dso, overdue60Amount, avgLifetimeSale, newQuarter, totalAtRisk, dormantCount };
  }, [customers]);

  const show = (v: string) => (loading && !customers.length ? "—" : v);

  const tiles = [
    {
      icon: <Users size={17} />,
      label: "Total Customers",
      value: show(formatNumber(kpis.total)),
      sub: `${kpis.dormantCount} dormant >90d`,
      accent: ACCENTS.indigo,
      trend: null,
    },
    {
      icon: <DollarSign size={17} />,
      label: "Total A/R",
      value: show(formatCurrency(kpis.totalAR)),
      sub: `${kpis.collectionRate.toFixed(0)}% collected`,
      accent: ACCENTS.amber,
      trend: null,
    },
    {
      icon: <AlertCircle size={17} />,
      label: "Overdue >60d",
      value: show(formatCurrency(kpis.overdue60Amount)),
      sub: "balance past due",
      accent: ACCENTS.rose,
      trend: kpis.overdue60Amount > 0 ? "up" : null,
    },
    {
      icon: <Activity size={17} />,
      label: "Days Sales Outstanding",
      value: show(kpis.dso > 0 ? `${kpis.dso}d` : "—"),
      sub: "avg collection time",
      accent: kpis.dso > 60 ? ACCENTS.rose : kpis.dso > 30 ? ACCENTS.amber : ACCENTS.emerald,
      trend: null,
    },
    {
      icon: <TrendingUp size={17} />,
      label: "Avg Lifetime Value",
      value: show(formatCurrency(kpis.avgLifetimeSale)),
      sub: "per buying customer",
      accent: ACCENTS.emerald,
      trend: null,
    },
    {
      icon: <Zap size={17} />,
      label: "Revenue at Risk",
      value: show(formatCurrency(kpis.totalAtRisk)),
      sub: "high-churn accounts",
      accent: kpis.totalAtRisk > 0 ? ACCENTS.orange : ACCENTS.teal,
      trend: kpis.totalAtRisk > 0 ? "up" : null,
    },
    {
      icon: <UserPlus size={17} />,
      label: "New (last 90d)",
      value: show(formatNumber(kpis.newQuarter)),
      sub: "new registrations",
      accent: ACCENTS.cyan,
      trend: null,
    },
    {
      icon: <BarChart2 size={17} />,
      label: "Collection Rate",
      value: show(`${kpis.collectionRate.toFixed(1)}%`),
      sub: `of ${formatCurrency(kpis.totalSales)} invoiced`,
      accent: kpis.collectionRate >= 90 ? ACCENTS.emerald : kpis.collectionRate >= 70 ? ACCENTS.amber : ACCENTS.rose,
      trend: null,
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
              borderLeft: `var(--tile-border-width, 4px) solid ${t.accent.color}`,
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-card)",
              transition: "box-shadow 0.15s ease",
            }}
          >
            <div className="card-body py-3 px-3">
              {/* Icon */}
              <div
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: t.accent.bg,
                  color: t.accent.color,
                }}
              >
                {t.icon}
              </div>
              {/* Label */}
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                {t.label}
              </div>
              {/* Value */}
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                {t.value}
              </div>
              {/* Sub */}
              {t.sub && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
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

export default KpiTiles;
