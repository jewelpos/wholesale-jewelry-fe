"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER_PAYMENT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { formatCurrency, num } from "@/components/ui/dashboard/admin/utils";

const formatDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

interface Payment {
  transactionno: string | null;
  custcompanyname: string | null;
  paymentdate: string | null;
  invoiceno: number | string | null;
  paymode: string | null;
  amountpaid: number | null;
  voidpayment: boolean | null;
  appliedby: string | null;
  warehousename: string | null;
}

interface Props {
  storeId: number;
  outletId: number;
  warehouseId: number | null;
}

const PAGE_SIZE = 25;

const RecentPaymentsTable = ({ storeId: _storeId, outletId, warehouseId }: Props) => {
  const [page, setPage] = useState(1);

  const filters = warehouseId
    ? [{ key: "warehouseid", value: { filterType: "number", type: "equals", filter: warehouseId } }]
    : [];

  const { data, loading } = useQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY, {
    variables: {
      outletid: outletId,
      page,
      perpage: PAGE_SIZE,
      filters,
      sortModel: [{ colId: "paymentdate", sort: "desc" }],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !outletId,
  });

  const payments: Payment[] = data?.getCustomerPaymentList?.data ?? [];
  const total: number = data?.getCustomerPaymentList?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      className="card"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="mb-1">Recent Payments</h6>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {total > 0 ? `${total.toLocaleString()} total payments` : "No payments found"}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-4">
            <span className="text-muted small">Loading…</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center py-4">
            <span className="text-muted small">No payment records.</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-sm mb-0"
                style={{ fontSize: 12, minWidth: 640 }}
              >
                <thead>
                  <tr style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    <th style={{ fontWeight: 600 }}>Date</th>
                    <th style={{ fontWeight: 600 }}>Transaction #</th>
                    <th style={{ fontWeight: 600 }}>Customer</th>
                    <th style={{ fontWeight: 600 }}>Mode</th>
                    <th style={{ fontWeight: 600 }}>Warehouse</th>
                    <th style={{ fontWeight: 600, textAlign: "right" }}>Amount</th>
                    <th style={{ fontWeight: 600 }}>Applied By</th>
                    <th style={{ fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => {
                    const voided = Boolean(p.voidpayment);
                    return (
                      <tr
                        key={i}
                        style={{
                          opacity: voided ? 0.45 : 1,
                          textDecoration: voided ? "line-through" : "none",
                          color: voided ? "var(--text-secondary)" : undefined,
                        }}
                      >
                        <td>{formatDate(p.paymentdate)}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{p.transactionno ?? "—"}</td>
                        <td>{p.custcompanyname ?? "—"}</td>
                        <td>{p.paymode ?? "—"}</td>
                        <td>{p.warehousename ?? "—"}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(num(p.amountpaid))}
                        </td>
                        <td>{p.appliedby ?? "—"}</td>
                        <td>
                          {voided ? (
                            <span className="badge" style={{ backgroundColor: "#f43f5e22", color: "#f43f5e", fontSize: 10 }}>Voided</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: "#10b98122", color: "#10b981", fontSize: 10 }}>Posted</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
                <span className="text-muted" style={{ fontSize: 11 }}>
                  Page {page} of {totalPages}
                </span>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecentPaymentsTable;
