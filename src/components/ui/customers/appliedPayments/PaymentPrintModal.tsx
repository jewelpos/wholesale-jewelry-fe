"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { CustomerPaymentListType } from "@/types/customer";
import { useAppSelector } from "@/lib/store/hook";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { useParams } from "next/navigation";

interface PaymentPrintModalProps {
  customerid: number;
  payments: CustomerPaymentListType[];
  onClose: () => void;
}

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val: string | Date | null | undefined) =>
  val ? dayjs(val).format("MM/DD/YYYY") : "";

const PaymentPrintModal = ({ customerid, payments, onClose }: PaymentPrintModalProps) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const storeName = useAppSelector((state) => state.store.data?.storename ?? "");

  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: parsedStoreId, customerid },
    fetchPolicy: "cache-first",
  });
  const customer = customerData?.getCustomer;

  const totalPaid = payments.reduce((s, p) => s + (p.amountpaid || 0), 0);

  const handlePrint = () => {
    const content = DOMPurify.sanitize(document.getElementById("payment-print-content")?.innerHTML ?? "");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Customer Payment Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 14px; }
    .store-name { font-size: 17px; font-weight: 700; }
    .report-title { font-size: 13px; color: #555; margin-top: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .info-box { border: 1px solid #ddd; padding: 8px 10px; border-radius: 4px; }
    .info-box .label { font-size: 10px; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; padding: 5px 7px; border: 1px solid #ccc; font-size: 10px; text-transform: uppercase; text-align: left; }
    td { padding: 4px 7px; border: 1px solid #ddd; font-size: 11px; }
    tr:nth-child(even) td { background: #fafafa; }
    tr.total-row td { background: #f4f4f4; font-weight: 700; border-top: 2px solid #999; }
    td.num { text-align: right; }
    td.voided { color: #999; text-decoration: line-through; }
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
            <h5 className="modal-title">Payment Report Preview</h5>
            <div className="d-flex gap-2 ms-auto">
              <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                <i className="feather-printer me-1" />
                Print
              </button>
              <button className="btn-close" onClick={onClose} />
            </div>
          </div>

          <div className="modal-body p-3" style={{ background: "#f5f5f5" }}>
            <div
              id="payment-print-content"
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
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{storeName}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Customer Payment Report</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "#666" }}>
                  <div>Print Date: {dayjs().format("MM/DD/YYYY")}</div>
                  <div style={{ marginTop: 4 }}>Total Records: {payments.length}</div>
                </div>
              </div>

              {/* Customer + Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontWeight: 700 }}>{customerid} — {customer?.custcompanyname}</div>
                  {customer?.custadd1 && <div>{customer.custadd1}</div>}
                  {(customer?.custcity || customer?.custstate || customer?.custzip) && (
                    <div>{[customer.custcity, customer.custstate, customer.custzip].filter(Boolean).join(", ")}</div>
                  )}
                  {customer?.custphone1 && <div>Ph: {customer.custphone1}</div>}
                </div>
                <div style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Summary</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Total Payments:</span><strong>{payments.length}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", marginTop: 4, paddingTop: 4 }}>
                    <span>Total Amount Paid:</span>
                    <strong>{fmt(totalPaid)}</strong>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    {["Txn #", "Payment Date", "Invoice #", "Mode", "Reference", "Amount Paid", "Status", "Applied By"].map((h) => (
                      <th key={h} style={{ padding: "5px 7px", border: "1px solid #ccc", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", color: p.voidpayment ? "#999" : undefined, textDecoration: p.voidpayment ? "line-through" : undefined }}>{p.transactionno}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", whiteSpace: "nowrap" }}>{fmtDate(p.paymentdate)}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{p.invoiceno}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{p.paymode}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{p.paymentreference}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(p.amountpaid)}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{p.paymentstatus}</td>
                      <td style={{ padding: "4px 7px", border: "1px solid #ddd" }}>{p.appliedby}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f4f4f4", fontWeight: 700, borderTop: "2px solid #999" }}>
                    <td colSpan={5} style={{ padding: "4px 7px", border: "1px solid #ddd" }}>TOTAL</td>
                    <td style={{ padding: "4px 7px", border: "1px solid #ddd", textAlign: "right" }}>{fmt(totalPaid)}</td>
                    <td colSpan={2} style={{ padding: "4px 7px", border: "1px solid #ddd" }}></td>
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

export default PaymentPrintModal;
