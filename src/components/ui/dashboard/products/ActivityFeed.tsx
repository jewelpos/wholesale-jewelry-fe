"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpDown, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { GET_INVENTORY_ADJUSTMENT_LIST_QUERY, GET_INVENTORY_TRANSFER_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import { num, formatCurrency, daysSince } from "./utils";

type Tab = "adjustments" | "transfers" | "movers";

type Props = { products: ProductListType[]; loading: boolean };

const timeAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  const d = daysSince(dateStr);
  if (d === null) return "—";
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const ActivityFeed = ({ products, loading: productsLoading }: Props) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [tab, setTab] = useState<Tab>("adjustments");
  const [topMoversN, setTopMoversN] = useState<"top" | "bottom">("top");

  const { data: adjData, loading: adjLoading } = useQuery(GET_INVENTORY_ADJUSTMENT_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
      page: 1,
      perpage: 20,
      filters: [],
      sortModel: [{ colId: "adjusted_date", sort: "desc" }],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || tab !== "adjustments",
  });

  const { data: txData, loading: txLoading } = useQuery(GET_INVENTORY_TRANSFER_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
      page: 1,
      perpage: 20,
      filters: [],
      sortModel: [{ colId: "transferdatetime", sort: "desc" }],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || tab !== "transfers",
  });

  const adjustments = adjData?.getInventoryAdjustmentList?.data ?? [];
  const transfers = txData?.getInventoryTransferList?.data ?? [];

  const sortedByRevenue = [...products].sort((a, b) => num(b.totalsoldvalue) - num(a.totalsoldvalue));
  const topMovers = topMoversN === "top" ? sortedByRevenue.slice(0, 15) : [...sortedByRevenue].reverse().slice(0, 15);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "adjustments", label: "Adjustments", icon: <BarChart2 size={13} /> },
    { key: "transfers", label: "Transfers", icon: <ArrowUpDown size={13} /> },
    { key: "movers", label: "Movers", icon: <TrendingUp size={13} /> },
  ];

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Activity Feed</h6>
          <div className="d-flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{
                  fontSize: 11, padding: "3px 10px",
                  backgroundColor: tab === t.key ? "#6366f1" : "var(--surface-muted)",
                  color: tab === t.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${tab === t.key ? "#6366f1" : "var(--border-subtle)"}`,
                  borderRadius: 20,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments */}
        {tab === "adjustments" && (
          <div>
            {adjLoading && <div className="text-muted small py-3 text-center">Loading adjustments…</div>}
            {!adjLoading && adjustments.length === 0 && <div className="text-muted small py-3 text-center">No recent adjustments.</div>}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {adjustments.map((adj: {
                adj_id: number; itemcode: string; description: string;
                qty_adjusted: number; cost_adjusted: number;
                adjusted_date: string; updated_by: string; warehouse: string; updateremarks: string;
              }) => (
                <div key={adj.adj_id} className="d-flex align-items-start gap-3 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div
                    className="flex-shrink-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: adj.qty_adjusted >= 0 ? "#ecfdf5" : "#fff1f2",
                      color: adj.qty_adjusted >= 0 ? "#10b981" : "#f43f5e",
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {adj.qty_adjusted >= 0 ? "+" : ""}
                    {adj.qty_adjusted}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <Link
                        href={`/jw/${storeId}/${outletId}/products/${adj.itemcode}/view`}
                        className="fw-semibold text-decoration-none"
                        style={{ fontSize: 12, color: "#6366f1" }}
                      >
                        {adj.itemcode}
                      </Link>
                      <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{timeAgo(adj.adjusted_date)}</span>
                    </div>
                    <div className="text-truncate" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{adj.description}</div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{adj.warehouse}</span>
                      {adj.cost_adjusted !== 0 && (
                        <span style={{ fontSize: 10, color: adj.cost_adjusted >= 0 ? "#10b981" : "#f43f5e" }}>
                          {adj.cost_adjusted >= 0 ? "+" : ""}{formatCurrency(adj.cost_adjusted)}
                        </span>
                      )}
                      {adj.updated_by && <span style={{ fontSize: 10, color: "#94a3b8" }}>by {adj.updated_by}</span>}
                    </div>
                    {adj.updateremarks && (
                      <div className="text-muted text-truncate" style={{ fontSize: 10, maxWidth: 280 }}>{adj.updateremarks}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfers */}
        {tab === "transfers" && (
          <div>
            {txLoading && <div className="text-muted small py-3 text-center">Loading transfers…</div>}
            {!txLoading && transfers.length === 0 && <div className="text-muted small py-3 text-center">No recent transfers.</div>}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {transfers.map((tx: {
                inventoryitemtransferid: number; transfermode: string; fromwarhouse: string;
                towarehouse: string; totalquantities: number; username: string;
                transferdatetime: string; transferstatus: string; remarks: string; totalitemtransfered: number;
              }) => (
                <div key={tx.inventoryitemtransferid} className="d-flex align-items-start gap-3 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div
                    className="flex-shrink-0 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#eff6ff", color: "#3b82f6" }}
                  >
                    <ArrowUpDown size={14} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ fontSize: 12 }}>
                        {tx.fromwarhouse || "—"} → {tx.towarehouse || "—"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{timeAgo(tx.transferdatetime)}</span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{tx.totalitemtransfered} items · {tx.totalquantities} units</span>
                      {tx.transferstatus && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, backgroundColor: tx.transferstatus === "Completed" ? "#ecfdf5" : "#fef3c7", color: tx.transferstatus === "Completed" ? "#10b981" : "#f59e0b" }}>
                          {tx.transferstatus}
                        </span>
                      )}
                    </div>
                    {tx.username && <div style={{ fontSize: 10, color: "#94a3b8" }}>by {tx.username}</div>}
                    {tx.remarks && <div className="text-muted text-truncate" style={{ fontSize: 10, maxWidth: 280 }}>{tx.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movers */}
        {tab === "movers" && (
          <div>
            <div className="d-flex gap-2 mb-2">
              {(["top", "bottom"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTopMoversN(m)}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{
                    fontSize: 11, padding: "2px 10px",
                    backgroundColor: topMoversN === m ? (m === "top" ? "#10b981" : "#f43f5e") : "var(--surface-muted)",
                    color: topMoversN === m ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${topMoversN === m ? (m === "top" ? "#10b981" : "#f43f5e") : "var(--border-subtle)"}`,
                    borderRadius: 20,
                  }}
                >
                  {m === "top" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {m === "top" ? "Top Sellers" : "Low Performers"}
                </button>
              ))}
            </div>
            {productsLoading && <div className="text-muted small py-3 text-center">Loading…</div>}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {topMovers.map((p, i) => {
                const margin = num(p.totalsoldvalue) > 0 ? (num(p.totalsoldprofit) / num(p.totalsoldvalue)) * 100 : 0;
                return (
                  <div key={`${p.itemid}-${p.itemwarehouseid}`} className="d-flex align-items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ width: 20, fontSize: 10, fontWeight: 700, color: i < 3 ? "#f59e0b" : "var(--text-tertiary)", textAlign: "center" }}>
                      {i + 1}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <Link
                          href={`/jw/${storeId}/${outletId}/products/${p.itemcode}/view`}
                          className="fw-semibold text-decoration-none"
                          style={{ fontSize: 12, color: "#6366f1" }}
                        >
                          {p.itemcode}
                        </Link>
                        <span className="fw-semibold" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(num(p.totalsoldvalue))}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <span className="text-truncate" style={{ fontSize: 10, color: "var(--text-secondary)", maxWidth: 160 }}>{p.itemdescription}</span>
                        <div className="d-flex gap-2 align-items-center">
                          {p.itemmetal && (
                            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 8, backgroundColor: "#fef3c7", color: "#f59e0b" }}>{p.itemmetal}</span>
                          )}
                          <span style={{ fontSize: 10, color: margin >= 20 ? "#10b981" : margin >= 10 ? "#f59e0b" : "#f43f5e" }}>{margin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
