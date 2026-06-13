"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { GET_MONTHLY_DAILY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { DailySalesSummary } from "@/types/reports";
import { MONTH_FULL, MONTH_LABELS, num, formatCurrency, yearFilter, stdVars } from "./utils";

type Props = { selectedYear: number; warehouseFilter: number | null };

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const DailySalesHeatmap = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentMonthIdx);

  const { data, loading } = useQuery(GET_MONTHLY_DAILY_SALES_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const rows: DailySalesSummary[] = data?.getMonthlyDailySalesPivot?.data ?? [];

  // Sum across warehouses for selected month
  const { dayValues, monthMax } = useMemo(() => {
    const monthName = MONTH_FULL[selectedMonthIdx].substring(0, 3).toLowerCase();
    const monthRows = rows.filter((r) => {
      const display = (r.month_display ?? "").toLowerCase();
      return display.includes(monthName);
    });

    const daysInMonth = selectedMonthIdx === 1 && isLeapYear(selectedYear) ? 29 : DAYS_IN_MONTH[selectedMonthIdx];
    const dayValues: number[] = Array.from({ length: daysInMonth }, (_, i) => {
      const key = `day_${String(i + 1).padStart(2, "0")}` as keyof DailySalesSummary;
      return monthRows.reduce((s, r) => s + num(r[key] as number), 0);
    });

    const monthMax = Math.max(...dayValues, 1);
    return { dayValues, monthMax };
  }, [rows, selectedMonthIdx, selectedYear]);

  const firstDayOfWeek = new Date(selectedYear, selectedMonthIdx, 1).getDay();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthlyTotal = dayValues.reduce((s, v) => s + v, 0);

  return (
    <div
      className="card h-100"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Daily Sales Heatmap</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {MONTH_FULL[selectedMonthIdx]} {selectedYear} ·{" "}
              <span className="fw-semibold" style={{ color: "#6366f1" }}>{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
        </div>

        {/* Month slider */}
        <div className="mb-3">
          <Slider
            min={0}
            max={11}
            step={1}
            marks={MONTH_LABELS.reduce((acc, label, i) => ({ ...acc, [i]: label }), {} as Record<number, string>)}
            value={selectedMonthIdx}
            onChange={(v) => setSelectedMonthIdx(v as number)}
            styles={{ track: { backgroundColor: "#6366f1" }, rail: { backgroundColor: "#e2e8f0" } }}
            style={{ marginBottom: 4 }}
            tooltip={{ formatter: (v) => MONTH_FULL[v ?? 0] }}
          />
        </div>

        {loading ? (
          <div className="text-center text-muted py-4 small">Loading…</div>
        ) : (
          <>
            {/* Weekday headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 3,
                marginBottom: 4,
              }}
            >
              {weekDays.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, color: "var(--text-tertiary)", fontWeight: 600 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 3,
              }}
            >
              {/* Empty offset cells */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} style={{ height: 32 }} />
              ))}

              {dayValues.map((value, i) => {
                const intensity = value / monthMax;
                const alpha = 0.08 + intensity * 0.85;
                const isToday =
                  new Date().getFullYear() === selectedYear &&
                  new Date().getMonth() === selectedMonthIdx &&
                  new Date().getDate() === i + 1;

                return (
                  <div
                    key={i}
                    title={`Day ${i + 1}: ${formatCurrency(value)}`}
                    style={{
                      height: 32,
                      borderRadius: 4,
                      backgroundColor: value > 0 ? `rgba(99,102,241,${alpha.toFixed(2)})` : "var(--surface-muted)",
                      border: isToday ? "2px solid #6366f1" : "1px solid transparent",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: value > 0 ? "default" : "default",
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 600, color: intensity > 0.6 ? "#fff" : "var(--text-primary)", lineHeight: 1 }}>
                      {i + 1}
                    </div>
                    {value > 0 && (
                      <div style={{ fontSize: 7, color: intensity > 0.6 ? "rgba(255,255,255,0.85)" : "var(--text-secondary)", lineHeight: 1 }}>
                        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(Math.round(value))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="d-flex align-items-center justify-content-end gap-1 mt-2">
              <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>Low</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((a) => (
                <div
                  key={a}
                  style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: `rgba(99,102,241,${a})` }}
                />
              ))}
              <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>High</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailySalesHeatmap;
