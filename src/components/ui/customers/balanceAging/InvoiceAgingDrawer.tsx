"use client";

import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import dayjs from "dayjs";
import { GET_CUSTOMER_INVOICE_AGING_QUERY } from "@/lib/graphql/query/customer";
import { AgingBucketBadge, InvoiceAgingRow, SALEMODE_DOC_LABEL } from "../AgingBucketBadge";

interface Props {
  storeid: number;
  customerid: number | null;
  companyname: string;
  onClose: () => void;
}

const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}`;

const InvoiceAgingDrawer = ({ storeid, customerid, companyname, onClose }: Props) => {
  const [fetchAging, { data, loading }] = useLazyQuery(GET_CUSTOMER_INVOICE_AGING_QUERY, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (customerid) {
      fetchAging({ variables: { storeid, customerid } });
    }
  }, [storeid, customerid, fetchAging]);

  const rows: InvoiceAgingRow[] = data?.getCustomerInvoiceAging ?? [];
  const isOpen = !!customerid;
  const totalDue = rows.reduce((s, r) => s + Math.abs(r.balancedue), 0);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.25)",
          zIndex: 1040,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(560px, 92vw)",
          background: "#fff",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
          zIndex: 1050,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {isOpen && (
          <>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px" }}>
                    INVOICE AGING
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    {companyname} <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 13 }}>#{customerid}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 16,
                    color: "#64748b",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Total open balance: </span>
                <span style={{ fontWeight: 700, color: totalDue > 0 ? "#dc2626" : "#1e293b" }}>{fmt(totalDue)}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {loading && (
                <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 12 }}>Loading…</div>
              )}
              {!loading && rows.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 12 }}>
                  No open invoices for this customer
                </div>
              )}
              {!loading && rows.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Sale Date</th>
                      <th style={thStyle}>Aging</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.invoicenumber} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: "#1e40af" }}>#{r.invoicenumber}</span>
                        </td>
                        <td style={tdStyle}>{SALEMODE_DOC_LABEL[r.salemodeid ?? 0] ?? "—"}</td>
                        <td style={tdStyle}>{r.saledate ? dayjs(r.saledate).format("MMM D, YYYY") : "—"}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <AgingBucketBadge bucket={r.agingbucket} />
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>{r.daysoverdue}d</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt(r.balancedue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const thStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontWeight: 600,
  fontSize: 10,
  color: "#475569",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "6px 10px",
  verticalAlign: "middle",
};

export default InvoiceAgingDrawer;
