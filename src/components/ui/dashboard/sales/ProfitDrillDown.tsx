"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Slider } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/reports";
import { InvoiceSummary } from "@/types/reports";
import { num, formatCurrency, marginColor } from "./utils";

type Props = { selectedYear: number; warehouseFilter: number | null };

const PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  Paid: "#10b981",
  Partial: "#f59e0b",
  Open: "#6366f1",
  Void: "#94a3b8",
  Hold: "#8b5cf6",
  Backorder: "#06b6d4",
};

const StatusPill = ({ status }: { status: string }) => {
  const color = STATUS_COLORS[status] ?? "#94a3b8";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 10,
        backgroundColor: color + "22",
        color,
        border: `1px solid ${color}44`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
};

const ProfitDrillDown = ({ selectedYear, warehouseFilter }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [maxMargin, setMaxMargin] = useState(100);
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery(GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      page,
      perpage: PER_PAGE,
      filters: [
        {
          key: "saledate",
          value: {
            filterType: "date",
            type: "inRange",
            dateFrom: `${selectedYear}-01-01`,
            dateTo: `${selectedYear}-12-31`,
          },
        },
      ],
      sortModel: [{ colId: "profit_margin_percent", sort: "asc" }],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const invoices: InvoiceSummary[] = data?.getInvoiceProfitSummaryList?.data ?? [];
  const total: number = data?.getInvoiceProfitSummaryList?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  const filtered = useMemo(
    () => invoices.filter((inv) => num(inv.profit_margin_percent) <= maxMargin),
    [invoices, maxMargin]
  );

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">Profit Drill-Down</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              Per-invoice profit · Sorted by margin % ascending · {total} invoices
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Margin ≤ {maxMargin === 100 ? "All" : `${maxMargin}%`}
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={maxMargin}
              onChange={(v) => { setMaxMargin(v as number); setPage(1); }}
              tooltip={{ formatter: (v) => v === 100 ? "All" : `${v}%` }}
              styles={{ track: { backgroundColor: "#6366f1" }, rail: { backgroundColor: "#e2e8f0" } }}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
            <thead style={{ fontSize: 11, position: "sticky", top: 0, backgroundColor: "var(--surface-card)", zIndex: 1 }}>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="text-end">Revenue</th>
                <th className="text-end">Cost</th>
                <th className="text-end">Profit</th>
                <th className="text-end">Margin</th>
                <th className="text-end">Discount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !filtered.length && (
                <tr><td colSpan={9} className="text-center text-muted py-4">Loading…</td></tr>
              )}
              {!loading && !filtered.length && (
                <tr><td colSpan={9} className="text-center text-muted py-4">No data for {selectedYear}.</td></tr>
              )}
              {filtered.map((inv) => {
                const margin = num(inv.profit_margin_percent);
                const discountPct = num(inv.totalamount) > 0
                  ? ((num(inv.discountamount) / num(inv.totalamount)) * 100)
                  : 0;
                return (
                  <tr key={inv.invoicenumber}>
                    <td>
                      <Link
                        href={`/jw/${parsedStoreId}/${parsedOutletId}/sales_invoices/${inv.invoicenumber}/view`}
                        className="text-decoration-none fw-semibold"
                        style={{ fontSize: 12, color: "#6366f1" }}
                      >
                        #{inv.invoicenumber}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 140 }}>
                      <div className="text-truncate" title={inv.custcompanyname} style={{ fontSize: 12 }}>
                        {inv.custcompanyname || `#${inv.customerid}`}
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                      {inv.saledate ? new Date(inv.saledate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(num(inv.netamount))}
                    </td>
                    <td className="text-end" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                      {formatCurrency(num(inv.totalcost))}
                    </td>
                    <td className="text-end fw-semibold" style={{ fontVariantNumeric: "tabular-nums", color: num(inv.profit) >= 0 ? "#10b981" : "#f43f5e" }}>
                      {formatCurrency(num(inv.profit))}
                    </td>
                    <td className="text-end">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 8,
                          backgroundColor: marginColor(margin) + "20",
                          color: marginColor(margin),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-end" style={{ color: discountPct > 0 ? "#f59e0b" : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                      {discountPct > 0 ? `${discountPct.toFixed(1)}%` : "—"}
                    </td>
                    <td>
                      <StatusPill status={inv.statusname ?? "—"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: 12 }}>
            <span className="text-muted">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ fontSize: 11, padding: "2px 8px" }}
              >
                <ChevronLeft size={12} />
              </button>
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ fontSize: 11, padding: "2px 8px" }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitDrillDown;
