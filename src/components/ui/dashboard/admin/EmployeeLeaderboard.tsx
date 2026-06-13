"use client";
import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { num, formatCurrency, formatPct, MONTH_KEYS, marginColor } from "./utils";

type EmpRow = {
  employeename?: string; year?: number; total_sales?: number; total_profit?: number; profit_margin_percent?: number;
  warehousename?: string; jan?: number; feb?: number; mar?: number; apr?: number; may?: number; jun?: number;
  jul?: number; aug?: number; sep?: number; oct?: number; nov?: number; dec?: number;
};

type Props = { rows: EmpRow[]; selectedYear: number; loading: boolean };

type SortKey = "revenue" | "profit" | "margin" | "transactions";

const EmployeeLeaderboard = ({ rows, selectedYear, loading }: Props) => {
  const [topN, setTopN] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>("revenue");

  const now = new Date();
  const curMonthIdx = now.getMonth();
  const prevMonthIdx = curMonthIdx === 0 ? 11 : curMonthIdx - 1;
  const curMonthKey = MONTH_KEYS[curMonthIdx];
  const prevMonthKey = MONTH_KEYS[prevMonthIdx];

  const employees = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number; curMonth: number; prevMonth: number; warehouse: string }> = {};
    for (const r of rows) {
      if (num(r.year) !== selectedYear) continue;
      const k = r.employeename || "Unknown";
      if (!map[k]) map[k] = { revenue: 0, profit: 0, curMonth: 0, prevMonth: 0, warehouse: r.warehousename || "" };
      map[k].revenue += num(r.total_sales);
      map[k].profit  += num(r.total_profit);
      map[k].curMonth  += num(r[curMonthKey]);
      map[k].prevMonth += num(r[prevMonthKey]);
    }
    return Object.entries(map)
      .map(([name, d]) => ({
        name, ...d,
        margin: d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0,
        momPct: d.prevMonth > 0 ? ((d.curMonth - d.prevMonth) / d.prevMonth) * 100 : null,
      }))
      .sort((a, b) => {
        if (sortBy === "revenue") return b.revenue - a.revenue;
        if (sortBy === "profit") return b.profit - a.profit;
        if (sortBy === "margin") return b.margin - a.margin;
        return b.curMonth - a.curMonth;
      })
      .slice(0, topN);
  }, [rows, selectedYear, sortBy, topN, curMonthKey, prevMonthKey]);

  const maxRevenue = Math.max(...employees.map((e) => e.revenue), 1);

  const SORT_BTNS: { key: SortKey; label: string }[] = [
    { key: "revenue", label: "Revenue" },
    { key: "profit", label: "Profit" },
    { key: "margin", label: "Margin" },
    { key: "transactions", label: "This Month" },
  ];

  return (
    <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Employee Performance Leaderboard</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{selectedYear} · Ranked by YTD revenue · MoM = current vs prior month</div>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <div className="d-flex gap-1">
              {SORT_BTNS.map((b) => (
                <button key={b.key} type="button" onClick={() => setSortBy(b.key)}
                  style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20,
                    backgroundColor: sortBy === b.key ? "#6366f1" : "var(--surface-muted)",
                    color: sortBy === b.key ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${sortBy === b.key ? "#6366f1" : "var(--border-subtle)"}`,
                  }}>
                  {b.label}
                </button>
              ))}
            </div>
            <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}
              className="form-select form-select-sm"
              style={{ fontSize: 11, width: 80, padding: "2px 8px" }}>
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
        </div>

        {loading && <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>Loading…</div>}
        {!loading && employees.length === 0 && <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>No employee data for {selectedYear}.</div>}

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
            <thead style={{ fontSize: 11 }}>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>Employee</th>
                <th>Outlet</th>
                <th className="text-end">YTD Revenue</th>
                <th className="text-end">Profit</th>
                <th className="text-end">Margin</th>
                <th className="text-end">This Month</th>
                <th style={{ width: 100 }}>MoM</th>
                <th style={{ minWidth: 120 }}>Share of Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => {
                const sharePct = maxRevenue > 0 ? (e.revenue / maxRevenue) * 100 : 0;
                return (
                  <tr key={e.name}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 11, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#f97316" : "var(--text-tertiary)" }}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{e.name}</div>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{e.warehouse || "—"}</td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(e.revenue)}</td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums", color: "#10b981" }}>{formatCurrency(e.profit)}</td>
                    <td className="text-end">
                      <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, backgroundColor: marginColor(e.margin) + "20", color: marginColor(e.margin) }}>
                        {formatPct(e.margin)}
                      </span>
                    </td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums", fontSize: 11 }}>{formatCurrency(e.curMonth)}</td>
                    <td>
                      {e.momPct === null ? (
                        <span className="text-muted" style={{ fontSize: 10 }}><Minus size={10} /> New</span>
                      ) : e.momPct >= 0 ? (
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}><TrendingUp size={10} /> +{Math.abs(e.momPct).toFixed(1)}%</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#f43f5e", fontWeight: 600 }}><TrendingDown size={10} /> {e.momPct.toFixed(1)}%</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "var(--border-subtle)", overflow: "hidden" }}>
                          <div style={{ width: `${sharePct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-secondary)", minWidth: 30, textAlign: "right" }}>{sharePct.toFixed(0)}%</span>
                      </div>
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
