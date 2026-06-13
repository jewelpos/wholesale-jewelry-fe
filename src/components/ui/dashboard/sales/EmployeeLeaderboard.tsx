"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { EmployeeYearlySalesSummary } from "@/types/reports";
import { MONTH_KEYS, num, formatCurrency, yearFilter, stdVars, marginColor } from "./utils";

type Props = { selectedYear: number; warehouseFilter: number | null };

const EmployeeLeaderboard = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [topN, setTopN] = useState(10);

  const { data, loading } = useQuery(GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: EmployeeYearlySalesSummary[] = data?.getMonthlyEmployeeSalesPivot?.data ?? [];

  const currentMonthKey = MONTH_KEYS[new Date().getMonth()];
  const priorMonthKey = MONTH_KEYS[Math.max(0, new Date().getMonth() - 1)];

  // Aggregate by employee (sum across warehouses)
  const employees = useMemo(() => {
    const byEmp: Record<string, { sales: number; profit: number; margin: number; currentMonth: number; priorMonth: number; rows: EmployeeYearlySalesSummary[] }> = {};
    for (const r of rows) {
      if (!r.employeename) continue;
      if (!byEmp[r.employeename]) byEmp[r.employeename] = { sales: 0, profit: 0, margin: 0, currentMonth: 0, priorMonth: 0, rows: [] };
      byEmp[r.employeename].sales += num(r.total_sales);
      byEmp[r.employeename].profit += num(r.total_profit);
      byEmp[r.employeename].currentMonth += num(r[currentMonthKey]);
      byEmp[r.employeename].priorMonth += num(r[priorMonthKey]);
      byEmp[r.employeename].rows.push(r);
    }
    return Object.entries(byEmp)
      .map(([name, d]) => ({
        name,
        sales: d.sales,
        profit: d.profit,
        margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
        currentMonth: d.currentMonth,
        priorMonth: d.priorMonth,
        mom: d.priorMonth > 0 ? ((d.currentMonth - d.priorMonth) / d.priorMonth) * 100 : null,
      }))
      .filter((e) => e.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, topN);
  }, [rows, topN, currentMonthKey, priorMonthKey]);

  const maxSales = employees[0]?.sales ?? 1;

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body p-0">
        <div className="d-flex justify-content-between align-items-start p-3 pb-0 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Employee Leaderboard</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>YTD revenue per sales rep · MoM change</div>
          </div>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Show top {topN}
            </div>
            <Slider
              min={5}
              max={20}
              step={5}
              marks={{ 5: "5", 10: "10", 15: "15", 20: "20" }}
              value={topN}
              onChange={(v) => setTopN(v as number)}
              styles={{ track: { backgroundColor: "#8b5cf6" }, rail: { backgroundColor: "#e2e8f0" } }}
              style={{ marginBottom: 8 }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
            <thead style={{ fontSize: 11, position: "sticky", top: 0, backgroundColor: "var(--surface-card)", zIndex: 1 }}>
              <tr>
                <th style={{ width: 28, paddingLeft: 16 }}>#</th>
                <th>Employee</th>
                <th style={{ minWidth: 100 }}>Revenue share</th>
                <th className="text-end">YTD Sales</th>
                <th className="text-end">Profit</th>
                <th className="text-end">Margin</th>
                <th className="text-end">MoM</th>
              </tr>
            </thead>
            <tbody>
              {loading && !employees.length && (
                <tr><td colSpan={7} className="text-center text-muted py-4">Loading…</td></tr>
              )}
              {!loading && !employees.length && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No employee data for {selectedYear}.</td></tr>
              )}
              {employees.map((e, i) => {
                const pct = (e.sales / maxSales) * 100;
                const barGradient = i === 0
                  ? "linear-gradient(90deg, var(--tile-indigo), var(--tile-violet))"
                  : i < 3
                  ? "linear-gradient(90deg, var(--tile-violet), var(--tile-cyan))"
                  : "linear-gradient(90deg, var(--tile-cyan), var(--tile-teal))";

                return (
                  <tr key={e.name}>
                    <td className="text-muted fw-semibold" style={{ paddingLeft: 16, fontSize: 11 }}>{i + 1}</td>
                    <td>
                      <div className="fw-semibold" style={{ fontSize: 12 }}>{e.name}</div>
                    </td>
                    <td>
                      <div style={{ height: 6, backgroundColor: "var(--border-subtle)", borderRadius: 3, overflow: "hidden", minWidth: 80 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: barGradient, borderRadius: 3 }} />
                      </div>
                    </td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(e.sales)}
                    </td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums", color: "#10b981" }}>
                      {formatCurrency(e.profit)}
                    </td>
                    <td className="text-end">
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 10,
                          backgroundColor: `${marginColor(e.margin)}20`,
                          color: marginColor(e.margin),
                        }}
                      >
                        {e.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-end">
                      {e.mom !== null ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: e.mom >= 0 ? "#10b981" : "#f43f5e" }}>
                          {e.mom >= 0 ? "+" : ""}{e.mom.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaderboard;
