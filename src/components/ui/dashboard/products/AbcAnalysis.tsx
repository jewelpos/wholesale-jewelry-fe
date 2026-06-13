"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { ProductListType } from "@/types/product";
import { num, formatCurrency, classifyABC, abcBadgeStyle, type AbcClass } from "./utils";

type Props = { products: ProductListType[]; loading: boolean };

const AbcAnalysis = ({ products, loading }: Props) => {
  const { storeId, outletId } = useParams();
  const [docFilter, setDocFilter] = useState<number>(30);
  const [classFilter, setClassFilter] = useState<AbcClass | "ALL">("ALL");

  const classified = useMemo(() => classifyABC(products), [products]);

  const filtered = useMemo(() => {
    return classified.filter((p) => {
      if (classFilter !== "ALL" && p.abcClass !== classFilter) return false;
      if (p.daysOfCover !== null && p.daysOfCover > 0 && p.daysOfCover < docFilter) return true;
      if (docFilter === 0) return true;
      return p.daysOfCover === null || p.daysOfCover < docFilter;
    });
  }, [classified, docFilter, classFilter]);

  const counts = useMemo(() => ({
    A: classified.filter((p) => p.abcClass === "A").length,
    B: classified.filter((p) => p.abcClass === "B").length,
    C: classified.filter((p) => p.abcClass === "C").length,
  }), [classified]);

  const totalRevenue = classified.reduce((s, p) => s + num(p.totalsoldvalue), 0);

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">ABC Analysis</h6>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              A = top 80% revenue · B = next 15% · C = bottom 5% · {classified.length} items ranked
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            {(["ALL", "A", "B", "C"] as const).map((cls) => {
              const style = cls === "ALL" ? null : abcBadgeStyle(cls);
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setClassFilter(cls)}
                  className="btn btn-sm"
                  style={{
                    fontSize: 11, padding: "2px 12px",
                    backgroundColor: classFilter === cls ? (style?.color ?? "#6366f1") : "var(--surface-muted)",
                    color: classFilter === cls ? "#fff" : (style?.color ?? "var(--text-secondary)"),
                    border: `1px solid ${style?.border ?? "var(--border-subtle)"}`,
                    borderRadius: 20,
                  }}
                >
                  {cls === "ALL" ? "All" : `${cls} (${counts[cls]})`}
                </button>
              );
            })}

            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b" }}>
                Days of cover: {docFilter === 366 ? "Show all" : `< ${docFilter}d`}
              </div>
              <Slider
                min={0} max={366} step={30}
                marks={{ 0: "0", 180: "180d", 366: "∞" }}
                value={docFilter}
                onChange={(v) => setDocFilter(v as number)}
                styles={{ track: { backgroundColor: "#6366f1" }, rail: { backgroundColor: "#e2e8f0" } }}
                tooltip={{ formatter: (v) => v === 366 ? "Show all" : `< ${v}d` }}
                style={{ marginBottom: 4 }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
            <thead style={{ fontSize: 11, position: "sticky", top: 0, backgroundColor: "var(--surface-card)", zIndex: 1 }}>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>Item</th>
                <th>Class</th>
                <th>Metal</th>
                <th>Category</th>
                <th className="text-end">Revenue</th>
                <th className="text-end">Rev share</th>
                <th className="text-end">Margin</th>
                <th className="text-end">Qty on hand</th>
                <th className="text-end">Days cover</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="text-center text-muted py-4">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-muted py-4">No items match.</td></tr>
              )}
              {filtered.slice(0, 50).map((p, i) => {
                const style = abcBadgeStyle(p.abcClass);
                const margin = num(p.totalsoldvalue) > 0
                  ? ((num(p.totalsoldprofit) / num(p.totalsoldvalue)) * 100)
                  : 0;
                return (
                  <tr key={`${p.itemid}-${p.itemwarehouseid}`}>
                    <td className="text-muted" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td>
                      <Link
                        href={`/jw/${storeId}/${outletId}/products/${p.itemcode}/view`}
                        className="text-decoration-none fw-semibold d-block"
                        style={{ fontSize: 12, color: "#6366f1" }}
                      >
                        {p.itemcode}
                      </Link>
                      <div className="text-truncate text-muted" style={{ fontSize: 10, maxWidth: 160 }}>{p.itemdescription}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                          backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`,
                        }}
                      >
                        {p.abcClass}
                      </span>
                    </td>
                    <td>
                      {p.itemmetal ? (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, backgroundColor: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}>
                          {p.itemmetal}
                        </span>
                      ) : <span className="text-muted" style={{ fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.categoryname || "—"}</td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(num(p.totalsoldvalue))}</td>
                    <td className="text-end" style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                      {p.revSharePct.toFixed(1)}%
                    </td>
                    <td className="text-end">
                      <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, backgroundColor: margin >= 20 ? "#ecfdf5" : margin >= 10 ? "#fffbeb" : "#fff1f2", color: margin >= 20 ? "#10b981" : margin >= 10 ? "#f59e0b" : "#f43f5e" }}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums" }}>{num(p.itemquantityinhand)}</td>
                    <td className="text-end">
                      {p.daysOfCover !== null ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: p.daysOfCover < 30 ? "#f43f5e" : p.daysOfCover < 90 ? "#f59e0b" : "#10b981" }}>
                          {Math.round(p.daysOfCover)}d
                        </span>
                      ) : <span className="text-muted" style={{ fontSize: 11 }}>∞</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && classified.length > 0 && (
          <div className="d-flex gap-4 mt-2 flex-wrap" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            <span>A items: <strong>{counts.A}</strong> SKUs = 80% revenue</span>
            <span>B items: <strong>{counts.B}</strong> SKUs = 15% revenue</span>
            <span>C items: <strong>{counts.C}</strong> SKUs = 5% revenue</span>
            <span>Total revenue ranked: <strong>{formatCurrency(totalRevenue)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbcAnalysis;
