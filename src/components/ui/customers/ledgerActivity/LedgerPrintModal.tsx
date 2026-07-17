"use client";

import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { CustomerLedgerReportType } from "@/types/customer";
import { useAppSelector } from "@/lib/store/hook";
import DOMPurify from "dompurify";
import dayjs, { Dayjs } from "dayjs";
import { useParams } from "next/navigation";

interface LedgerPrintModalProps {
  customerid: number;
  rowData: CustomerLedgerReportType[];
  openingBalance: number;
  fromdate: Dayjs | null;
  todate: Dayjs | null;
  onClose: () => void;
}

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val: string | null | undefined) =>
  val ? dayjs(Number(val)).format("MM/DD/YYYY") : "";

const LedgerPrintModal = ({
  customerid,
  rowData,
  openingBalance,
  fromdate,
  todate,
  onClose,
}: LedgerPrintModalProps) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const storeName = useAppSelector((state) => state.store.data?.storename ?? "");

  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: parsedStoreId, customerid },
    fetchPolicy: "cache-first",
  });
  const customer = customerData?.getCustomer;

  const totalDebits = rowData.reduce((s, r) => s + (r.ledamountdebit || 0), 0);
  const totalCredits = rowData.reduce((s, r) => s + (r.ledamountcredit || 0), 0);
  const closingBalance = rowData.length > 0 ? rowData[rowData.length - 1].running_balance ?? 0 : openingBalance;

  const periodLabel = fromdate || todate
    ? `${fromdate ? fromdate.format("MM/DD/YYYY") : "Beginning"} — ${todate ? todate.format("MM/DD/YYYY") : "Present"}`
    : "All Transactions";

  const handlePrint = () => {
    const content = DOMPurify.sanitize(document.getElementById("ledger-print-content")?.innerHTML ?? "");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Customer Ledger Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 24px; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    h2 { font-size: 13px; font-weight: normal; color: #555; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .store-block h1 { font-size: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .info-box { border: 1px solid #ddd; padding: 8px 10px; border-radius: 4px; }
    .info-box label { font-size: 10px; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #f0f0f0; }
    th { padding: 5px 7px; border: 1px solid #ccc; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 4px 7px; border: 1px solid #ddd; font-size: 11px; }
    tr.ob-row td { background: #eef2ff; font-style: italic; font-weight: 600; }
    tr.total-row td { background: #f4f4f4; font-weight: 700; border-top: 2px solid #999; }
    td.num { text-align: right; }
    .balance-negative { color: #c00; }
    .summary { display: flex; justify-content: flex-end; margin-top: 14px; gap: 20px; }
    .summary-item { text-align: right; }
    .summary-item .label { font-size: 10px; color: #666; }
    .summary-item .value { font-size: 13px; font-weight: 700; }
    .print-date { font-size: 10px; color: #888; margin-top: 4px; }
    @media print { @page { margin: 1.5cm; } }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title">Ledger Statement Preview</h5>
            <div className="d-flex gap-2 ms-auto">
              <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                <i className="feather-printer me-1" />
                Print
              </button>
              <button className="btn-close" onClick={onClose} />
            </div>
          </div>

          <div className="modal-body p-3" style={{ background: "#f5f5f5" }}>
            {/* ——— Print content area ——— */}
            <div
              id="ledger-print-content"
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: 4,
                border: "1px solid #ddd",
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #333", paddingBottom: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{storeName}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Customer Ledger Statement</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "#666" }}>
                  <div>Print Date: {dayjs().format("MM/DD/YYYY")}</div>
                  <div style={{ marginTop: 4 }}>Period: {periodLabel}</div>
                </div>
              </div>

              {/* Customer info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Bill To</div>
                  <div style={{ fontWeight: 700 }}>{customerid} — {customer?.custcompanyname}</div>
                  {customer?.custadd1 && <div>{customer.custadd1}</div>}
                  {(customer?.custcity || customer?.custstate || customer?.custzip) && (
                    <div>{[customer.custcity, customer.custstate, customer.custzip].filter(Boolean).join(", ")}</div>
                  )}
                  {customer?.custphone1 && <div>Ph: {customer.custphone1}</div>}
                </div>
                <div style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Summary</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Debits:</span><strong>{fmt(totalDebits)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Credits:</span><strong>{fmt(totalCredits)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", marginTop: 4, paddingTop: 4 }}>
                    <span>Closing Balance:</span>
                    <strong style={{ color: closingBalance < 0 ? "#c00" : undefined }}>{fmt(closingBalance)}</strong>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    {["Date", "Activity", "Description", "Reference", "Debit", "Credit", "Balance"].map((h) => (
                      <th key={h} style={{ padding: "5px 7px", border: "1px solid #ccc", fontSize: 10, textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fromdate && (
                    <tr style={{ background: "#eef2ff", fontStyle: "italic", fontWeight: 600 }}>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>Opening Balance</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(openingBalance)}</td>
                    </tr>
                  )}
                  {rowData.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", whiteSpace: "nowrap" }}>{fmtDate(row.ledgerdate)}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.ledgercode}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.ledgerdescription}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{row.ledgerreference}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{row.ledamountdebit ? fmt(row.ledamountdebit) : ""}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{row.ledamountcredit ? fmt(row.ledamountcredit) : ""}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right", color: (row.running_balance ?? 0) < 0 ? "#c00" : undefined }}>{fmt(row.running_balance)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f4f4f4", fontWeight: 700, borderTop: "2px solid #999" }}>
                    <td style={{ padding: "4px 7px", border: "1px solid #ddd" }} colSpan={4}>TOTAL</td>
                    <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(totalDebits)}</td>
                    <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(totalCredits)}</td>
                    <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right", color: closingBalance < 0 ? "#c00" : undefined }}>{fmt(closingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerPrintModal;
