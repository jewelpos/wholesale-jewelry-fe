"use client";

import React, { useMemo } from "react";
import { TrendingDown, RefreshCw, Clock, Shield } from "lucide-react";
import DashboardCustomer from "./types";
import { formatCurrency, num, isSystemAccount } from "./utils";
import { computeChurnScore, churnRiskLabel, computeReorderDue, computeAtRiskRevenue } from "./forecast";

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
};

const ForecastPanel = ({ customers, loading }: Props) => {
  const metrics = useMemo(() => {
    const named = customers.filter((c) => !isSystemAccount(c));

    const totalAtRisk = named.reduce((s, c) => s + computeAtRiskRevenue(c), 0);
    const atRiskCount = named.filter((c) => computeChurnScore(c) >= 51).length;

    const reorderDue = named.filter((c) => {
      const r = computeReorderDue(c);
      return r !== null && r.daysOverdue > 0;
    });
    const reorderEstValue = reorderDue.reduce((s, c) => {
      const sales = num(c.numberofsales);
      return s + (sales > 0 ? num(c.totalsale) / sales : 0);
    }, 0);

    const likelyCollect30d = named
      .filter((c) => num(c.balancedue) > 0 && c.days_since_last_sale !== null && c.days_since_last_sale <= 45)
      .reduce((s, c) => s + num(c.balancedue), 0);

    const scoredCustomers = named.filter((c) => num(c.numberofsales) > 0);
    const avgChurnScore = scoredCustomers.length
      ? Math.round(scoredCustomers.reduce((s, c) => s + computeChurnScore(c), 0) / scoredCustomers.length)
      : 0;
    const fleetRisk = churnRiskLabel(avgChurnScore);

    return { totalAtRisk, atRiskCount, reorderDueCount: reorderDue.length, reorderEstValue, likelyCollect30d, avgChurnScore, fleetRisk };
  }, [customers]);

  const show = (v: string) => (loading && !customers.length ? "—" : v);

  const fleetScoreColor =
    metrics.fleetRisk === "critical" ? "var(--tile-rose)"
    : metrics.fleetRisk === "high" ? "var(--tile-orange)"
    : metrics.fleetRisk === "medium" ? "var(--tile-amber)"
    : "var(--tile-emerald)";

  const tiles = [
    {
      icon: <TrendingDown size={18} />,
      label: "Revenue at Risk",
      value: show(formatCurrency(metrics.totalAtRisk)),
      sub: `${metrics.atRiskCount} high-churn accounts`,
      desc: "Projected revenue loss if high-risk customers churn",
      accentColor: "var(--tile-rose)",
      accentBg: "var(--tile-rose-bg)",
      gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    },
    {
      icon: <RefreshCw size={18} />,
      label: "Reorder Pipeline",
      value: show(`${metrics.reorderDueCount} overdue`),
      sub: `${formatCurrency(metrics.reorderEstValue)} est. orders`,
      desc: "Customers past their avg reorder cycle",
      accentColor: "var(--tile-amber)",
      accentBg: "var(--tile-amber-bg)",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    {
      icon: <Clock size={18} />,
      label: "Est. 30d Collections",
      value: show(formatCurrency(metrics.likelyCollect30d)),
      sub: "active accounts with balance",
      desc: "A/R likely to be collected in next 30 days",
      accentColor: "var(--tile-cyan)",
      accentBg: "var(--tile-cyan-bg)",
      gradient: "linear-gradient(135deg, #06b6d4, #0284c7)",
    },
    {
      icon: <Shield size={18} />,
      label: "Fleet Risk Score",
      value: show(`${metrics.avgChurnScore}/100`),
      sub: `${metrics.fleetRisk.charAt(0).toUpperCase() + metrics.fleetRisk.slice(1)} — portfolio avg`,
      desc: "Average churn risk across active customers",
      accentColor: fleetScoreColor,
      accentBg: "var(--tile-violet-bg)",
      gradient: `linear-gradient(135deg, ${fleetScoreColor}, ${fleetScoreColor})`,
    },
  ];

  return (
    <div
      className="card"
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="card-body py-3">
        {/* Panel header */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--tile-indigo), var(--tile-violet))",
              color: "#fff",
            }}
          >
            <TrendingDown size={14} />
          </div>
          <div>
            <h6 className="mb-0" style={{ color: "var(--text-primary)" }}>Forecast Intelligence</h6>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              Predictive insights based on customer behavior patterns
            </div>
          </div>
        </div>

        <div className="row g-3">
          {tiles.map((t) => (
            <div className="col-6 col-xl-3" key={t.label}>
              <div
                className="h-100 p-3 position-relative overflow-hidden"
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderTop: `3px solid ${t.accentColor}`,
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--surface-card)",
                }}
              >
                {/* Icon with gradient bg */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: t.gradient,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {t.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1.3 }}>
                    {t.label}
                  </span>
                </div>

                {/* Value */}
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.4px" }}>
                  {t.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>{t.sub}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: 8,
                    marginTop: 10,
                    lineHeight: 1.4,
                  }}
                >
                  {t.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastPanel;
