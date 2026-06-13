"use client";

import React, { useMemo } from "react";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
  BubbleController,
} from "chart.js";
import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardCustomer from "./types";
import { formatCurrency, num, isSystemAccount } from "./utils";
import { computeChurnScore, churnRiskColor, churnRiskLabel } from "./forecast";

ChartJS.register(BubbleController, LinearScale, PointElement, Tooltip, Legend);

type Props = {
  customers: DashboardCustomer[];
  loading: boolean;
};

const MAX_BUBBLE = 20;
const MIN_BUBBLE = 4;

const CustomerHealthScatter = ({ customers, loading }: Props) => {
  const { storeId, outletId } = useParams();

  const { datasets, quadrantStats } = useMemo(() => {
    const named = customers
      .filter((c) => !isSystemAccount(c) && num(c.numberofsales) > 0)
      .filter((c) => c.days_since_last_sale !== null);

    if (!named.length) return { datasets: [], quadrantStats: null };

    const maxSale = Math.max(...named.map((c) => num(c.totalsale)), 1);

    // Group by risk for color
    const byRisk: Record<string, DashboardCustomer[]> = {
      critical: [], high: [], medium: [], low: [],
    };
    for (const c of named) {
      const score = computeChurnScore(c);
      byRisk[churnRiskLabel(score)].push(c);
    }

    const riskOrder = ["critical", "high", "medium", "low"] as const;
    const riskLabels = { critical: "Critical Risk", high: "High Risk", medium: "Medium Risk", low: "Low Risk" };

    const ds = riskOrder.map((risk) => ({
      label: riskLabels[risk],
      data: byRisk[risk].map((c) => {
        const r = MIN_BUBBLE + ((num(c.totalsale) / maxSale) * (MAX_BUBBLE - MIN_BUBBLE));
        return {
          x: Math.min(c.days_since_last_sale ?? 0, 400),
          y: num(c.balancedue),
          r: Math.max(MIN_BUBBLE, r),
          _customer: c,
        };
      }),
      backgroundColor: churnRiskColor(risk) + "99",
      borderColor: churnRiskColor(risk),
      borderWidth: 1,
    }));

    // Quadrant counts (x=90d, y=$0 threshold)
    const vipActive = named.filter((c) => (c.days_since_last_sale ?? 0) <= 90 && num(c.balancedue) === 0).length;
    const atRisk = named.filter((c) => (c.days_since_last_sale ?? 0) > 90 && num(c.balancedue) > 0).length;
    const activeOwing = named.filter((c) => (c.days_since_last_sale ?? 0) <= 90 && num(c.balancedue) > 0).length;
    const dormant = named.filter((c) => (c.days_since_last_sale ?? 0) > 90 && num(c.balancedue) === 0).length;

    return {
      datasets: ds,
      quadrantStats: { vipActive, atRisk, activeOwing, dormant },
    };
  }, [customers]);

  const options: ChartOptions<"bubble"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw as { x: number; y: number; r: number; _customer: DashboardCustomer };
            const c = raw._customer;
            const name = c.custcompanyname || c.fullname || `#${c.customerid}`;
            return [
              name,
              `Last sale: ${raw.x}d ago`,
              `Balance: ${formatCurrency(raw.y)}`,
              `Lifetime: ${formatCurrency(num(c.totalsale))}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Days Since Last Sale", font: { size: 11 } },
        min: 0,
        max: 400,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10 } },
      },
      y: {
        title: { display: true, text: "Balance Due ($)", font: { size: 11 } },
        beginAtZero: true,
        ticks: {
          callback: (v) => formatCurrency(Number(v)),
          font: { size: 10 },
        },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
    },
    onClick: (_evt, elements, chart) => {
      if (!elements.length) return;
      const el = elements[0];
      const ds = chart.data.datasets[el.datasetIndex] as unknown as { data: Array<{ _customer: DashboardCustomer }> };
      const c = ds.data[el.index]._customer;
      if (c?.customerid && storeId && outletId) {
        window.location.href = `/jw/${storeId}/${outletId}/dashboard/customer/${c.customerid}`;
      }
    },
  };

  return (
    <div className="card h-100" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">Customer Health Map</h6>
            <div className="text-muted small">
              Bubble size = lifetime value · Click any bubble to open customer
            </div>
          </div>
        </div>

        {/* Quadrant summary chips */}
        {quadrantStats && !loading && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-success-subtle text-success" style={{ fontSize: 11 }}>
              ✓ Active &amp; Paid: {quadrantStats.vipActive}
            </span>
            <span className="badge bg-warning-subtle text-warning" style={{ fontSize: 11 }}>
              ⚡ Active w/ Balance: {quadrantStats.activeOwing}
            </span>
            <span className="badge bg-danger-subtle text-danger" style={{ fontSize: 11 }}>
              ⚠ At Risk: {quadrantStats.atRisk}
            </span>
            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: 11 }}>
              ○ Dormant: {quadrantStats.dormant}
            </span>
          </div>
        )}

        {/* Quadrant labels overlay via CSS */}
        <div className="position-relative" style={{ height: 260 }}>
          {loading && !customers.length ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Loading…</div>
          ) : datasets.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No customer data available.</div>
          ) : (
            <Bubble
              data={{ datasets }}
              options={options}
            />
          )}
        </div>

        {/* Axis legend */}
        <div className="d-flex justify-content-between mt-2" style={{ fontSize: 10, color: "#94a3b8" }}>
          <span>← Recently active</span>
          <span>Dormant →</span>
        </div>

        <div className="d-flex justify-content-end mt-1">
          <Link
            href={`/jw/${storeId}/${outletId}/customers/list`}
            className="small text-decoration-none"
          >
            View all customers →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerHealthScatter;
