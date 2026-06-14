"use client";
import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { DollarSign, TrendingUp, BarChart2, Users, Calendar } from "lucide-react";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import {
  GET_MONTHLY_SALES_PIVOT_QUERY,
  GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY,
  GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY,
} from "@/lib/graphql/query/reports";
import {
  num,
  formatCurrency,
  formatPct,
  MONTH_KEYS,
  MONTH_LABELS,
  currentYear,
  yearFilter,
  sumPivotRows,
  MonthTotals,
  PRISM,
} from "@/components/ui/dashboard/admin/utils";

const NO_FILTER: never[] = [];

const pVars = (
  storeid: number,
  outletid: number,
  warehouseid: number | null,
  year: number
) => ({
  storeid,
  outletid,
  warehouseid,
  page: 1,
  perpage: 2000,
  filters: yearFilter(year),
  sortModel: NO_FILTER,
  rowGroupCols: NO_FILTER,
  groupKeys: NO_FILTER,
});

type EmpRow = Record<string, number | string | undefined>;

const Tile = ({
  label,
  value,
  sub,
  accent,
  Icon,
  loading,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  Icon: React.ElementType;
  loading: boolean;
  trend?: { pct: number; up: boolean } | null;
}) => (
  <div className="col" style={{ minWidth: 160 }}>
    <div
      className="h-100 p-3"
      style={{
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: accent + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={accent} />
        </div>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
        }}
      >
        {loading ? (
          <span className="text-muted" style={{ fontSize: 14 }}>
            —
          </span>
        ) : (
          value
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          {sub}
        </div>
      )}
      {trend != null && (
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            color: trend.up ? "#10b981" : "#f43f5e",
            fontWeight: 600,
          }}
        >
          {trend.up ? "▲" : "▼"} {Math.abs(trend.pct).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  </div>
);

const ManagerDashboard = () => {
  const params = useParams();
  const storeId = parseInt(params.storeId as string, 10);
  const outletId = parseInt(params.outletId as string, 10);
  const year = currentYear;

  const now = new Date();
  const curMonthIdx = now.getMonth();
  const prevMonthIdx = curMonthIdx === 0 ? 11 : curMonthIdx - 1;
  const curMonthKey = MONTH_KEYS[curMonthIdx];
  const prevMonthKey = MONTH_KEYS[prevMonthIdx];
  const curMonthLabel = MONTH_LABELS[curMonthIdx];
  const prevMonthLabel = MONTH_LABELS[prevMonthIdx];

  const { data: whData } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: outletId },
    skip: !outletId,
  });
  const warehouseId: number | null =
    whData?.getWarehousesByOutletId?.[0]?.warehouseid ?? null;
  const warehouseReady = warehouseId !== null;

  const { data: salesData, loading: salesLoading } = useQuery(
    GET_MONTHLY_SALES_PIVOT_QUERY,
    { variables: pVars(storeId, outletId, null, year) }
  );

  const { data: empData, loading: empLoading } = useQuery(
    GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY,
    {
      variables: pVars(storeId, outletId, warehouseId, year),
      skip: !warehouseReady,
    }
  );

  const { data: categoryData, loading: categoryLoading } = useQuery(
    GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY,
    {
      variables: pVars(storeId, outletId, warehouseId, year),
      skip: !warehouseReady,
    }
  );

  const salesRows: Record<string, number | string>[] =
    salesData?.getMonthlySalesPivot?.data ?? [];
  const totals: MonthTotals | null = useMemo(
    () => (salesRows.length ? sumPivotRows(salesRows) : null),
    [salesRows]
  );

  const totalsMap = totals as Record<string, number> | null;
  const thisMonth = totalsMap ? num(totalsMap[curMonthKey]) : 0;
  const lastMonth = totalsMap ? num(totalsMap[prevMonthKey]) : 0;
  const ytd = totals ? num(totals.total_sales) : 0;
  const ytdProfit = totals ? num(totals.total_profit) : 0;
  const momPct =
    lastMonth > 0 ? ((thisMonth - lastMonth) / Math.abs(lastMonth)) * 100 : null;

  const empRows: EmpRow[] = empData?.getMonthlyEmployeeSalesPivot?.data ?? [];
  const teamCount = new Set(empRows.map((r) => r.employeename).filter(Boolean)).size;

  const teamTable = useMemo(() => {
    const map: Record<
      string,
      { ytd: number; thisMonth: number; lastMonth: number; profit: number }
    > = {};
    for (const r of empRows) {
      const k = String(r.employeename || "Unknown");
      if (!map[k]) map[k] = { ytd: 0, thisMonth: 0, lastMonth: 0, profit: 0 };
      map[k].ytd += num(r.total_sales as number);
      map[k].profit += num(r.total_profit as number);
      map[k].thisMonth += num(r[curMonthKey] as number);
      map[k].lastMonth += num(r[prevMonthKey] as number);
    }
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        ...d,
        margin: d.ytd > 0 ? (d.profit / d.ytd) * 100 : 0,
      }))
      .sort((a, b) => b.thisMonth - a.thisMonth);
  }, [empRows, curMonthKey, prevMonthKey]);

  const categoryRows: Record<string, string | number>[] =
    categoryData?.getMonthlyItemCategorySalesPivot?.data ?? [];
  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of categoryRows) {
      const cat = String(r.categoryname || "Other");
      map[cat] = (map[cat] ?? 0) + num(r.total_sales as number);
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [categoryRows]);

  const topCatTotal = topCategories.reduce((s, [, v]) => s + v, 0);
  const catColors = [PRISM.indigo, PRISM.emerald, PRISM.amber, PRISM.violet, PRISM.cyan];

  return (
    <div>
      {/* Header */}
      <div
        className="mb-4 px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, #0f4c75 0%, #1b6ca8 55%, #155e75 100%)",
          borderRadius: "var(--radius-card)",
          color: "#fff",
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 style={{ fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
              Manager Dashboard
            </h4>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              Sales Performance · Team View · {year}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
              background: "rgba(255,255,255,0.12)",
              padding: "6px 14px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Calendar size={12} />
            {curMonthLabel} {year}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
        <Tile
          label={`${curMonthLabel} Revenue`}
          value={formatCurrency(thisMonth)}
          sub={`Last month: ${formatCurrency(lastMonth)}`}
          accent={PRISM.indigo}
          Icon={DollarSign}
          loading={salesLoading}
          trend={momPct !== null ? { pct: momPct, up: momPct >= 0 } : null}
        />
        <Tile
          label="YTD Revenue"
          value={formatCurrency(ytd)}
          sub={`Profit: ${formatCurrency(ytdProfit)}`}
          accent={PRISM.emerald}
          Icon={TrendingUp}
          loading={salesLoading}
        />
        <Tile
          label="Profit Margin"
          value={totals ? formatPct(totals.profit_margin_percent) : "—"}
          sub={
            totals
              ? totals.profit_margin_percent >= 30
                ? "✓ On target"
                : "Below target"
              : ""
          }
          accent={PRISM.teal}
          Icon={BarChart2}
          loading={salesLoading}
        />
        <Tile
          label="Team Members"
          value={empLoading ? "—" : String(teamCount || 0)}
          sub="Active this year"
          accent={PRISM.violet}
          Icon={Users}
          loading={empLoading}
        />
      </div>

      <div className="row g-3 mb-4">
        {/* Team Performance Table */}
        <div className="col-md-8">
          <div
            className="card h-100"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="card-body">
              <h6 className="mb-1">Team Performance</h6>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 12,
                }}
              >
                {curMonthLabel} vs {prevMonthLabel} · Ranked by this month
              </div>
              {empLoading && (
                <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
                  Loading…
                </div>
              )}
              {!empLoading && teamTable.length === 0 && (
                <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
                  No team data for {year}.
                </div>
              )}
              {!empLoading && teamTable.length > 0 && (
                <div className="table-responsive">
                  <table
                    className="table table-sm align-middle mb-0"
                    style={{ fontSize: 12 }}
                  >
                    <thead style={{ fontSize: 11 }}>
                      <tr>
                        <th style={{ width: 28 }}>#</th>
                        <th>Employee</th>
                        <th className="text-end">{curMonthLabel}</th>
                        <th className="text-end">{prevMonthLabel}</th>
                        <th style={{ width: 80 }}>MoM</th>
                        <th className="text-end">YTD</th>
                        <th className="text-end">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamTable.map((e, i) => {
                        const mom =
                          e.lastMonth > 0
                            ? ((e.thisMonth - e.lastMonth) / e.lastMonth) * 100
                            : null;
                        const rankColor =
                          i === 0
                            ? "#f59e0b"
                            : i === 1
                            ? "#94a3b8"
                            : i === 2
                            ? "#f97316"
                            : "var(--text-tertiary)";
                        return (
                          <tr key={e.name}>
                            <td>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 11,
                                  color: rankColor,
                                }}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{e.name}</td>
                            <td
                              className="text-end"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatCurrency(e.thisMonth)}
                            </td>
                            <td
                              className="text-end"
                              style={{
                                fontVariantNumeric: "tabular-nums",
                                color: "var(--text-secondary)",
                                fontSize: 11,
                              }}
                            >
                              {formatCurrency(e.lastMonth)}
                            </td>
                            <td>
                              {mom === null ? (
                                <span
                                  className="text-muted"
                                  style={{ fontSize: 10 }}
                                >
                                  New
                                </span>
                              ) : mom >= 0 ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#10b981",
                                    fontWeight: 600,
                                  }}
                                >
                                  ▲ {mom.toFixed(1)}%
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#f43f5e",
                                    fontWeight: 600,
                                  }}
                                >
                                  ▼ {Math.abs(mom).toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td
                              className="text-end"
                              style={{
                                fontVariantNumeric: "tabular-nums",
                                fontSize: 11,
                              }}
                            >
                              {formatCurrency(e.ytd)}
                            </td>
                            <td className="text-end">
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "1px 6px",
                                  borderRadius: 8,
                                  backgroundColor: "#6366f118",
                                  color: "#6366f1",
                                }}
                              >
                                {formatPct(e.margin)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="col-md-4">
          <div
            className="card h-100"
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="card-body">
              <h6 className="mb-1">Top Categories YTD</h6>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                By revenue share
              </div>
              {categoryLoading && (
                <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
                  Loading…
                </div>
              )}
              {!categoryLoading && topCategories.length === 0 && (
                <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
                  No category data.
                </div>
              )}
              {!categoryLoading &&
                topCategories.map(([cat, rev], i) => {
                  const pct = topCatTotal > 0 ? (rev / topCatTotal) * 100 : 0;
                  const accent = catColors[i % catColors.length];
                  return (
                    <div key={cat} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{cat}</span>
                        <span
                          style={{ fontSize: 11, color: "var(--text-secondary)" }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "var(--border-subtle)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 3,
                            backgroundColor: accent,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {formatCurrency(rev)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div
        className="card"
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--surface-card)",
        }}
      >
        <div className="card-body">
          <h6 className="mb-3">Monthly Revenue · {year}</h6>
          {salesLoading ? (
            <div className="text-muted text-center py-4" style={{ fontSize: 12 }}>
              Loading…
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-sm align-middle mb-0"
                style={{ fontSize: 12 }}
              >
                <thead style={{ fontSize: 11 }}>
                  <tr>
                    {MONTH_LABELS.map((m) => (
                      <th key={m} className="text-end">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {MONTH_KEYS.map((mk) => {
                      const val = totalsMap ? num(totalsMap[mk]) : 0;
                      return (
                        <td
                          key={mk}
                          className="text-end"
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: mk === curMonthKey ? 700 : 400,
                            color:
                              mk === curMonthKey ? PRISM.indigo : undefined,
                          }}
                        >
                          {formatCurrency(val)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
