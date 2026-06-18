"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { CustomerBalanceAgingType, CustomerLedgerReportType, CustomerPaymentListType } from "@/types/customer";

export type StatementType = "open" | "history" | "payments";

export type InvoiceBalanceDue = {
  invoicenumber: number;
  saledate: string;
  totalamount: number;
  amountreceived: number;
  balancedue: number;
};

export type StatementCustomer = {
  customerid: string;
  custcompanyname: string;
  fullname: string;
  custaddress: string;
  custcity: string;
  custstate: string;
  custzip: string;
  phone: string;
  custemailadd: string;
  opencredit: number;
};

interface Props {
  type: StatementType;
  customer: StatementCustomer;
  openInvoices: InvoiceBalanceDue[];
  ledgerRows: CustomerLedgerReportType[];
  openingBalance: number;
  payments: CustomerPaymentListType[];
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  showAging: boolean;
  showSummaryCard: boolean;
  storeName: string;
  agingData?: CustomerBalanceAgingType | null;
}

const fmt = (n: number | null | undefined) =>
  "$" + (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val: string | Date | null | undefined): string => {
  if (!val) return "";
  if (typeof val === "string") {
    const num = Number(val);
    if (!isNaN(num) && num > 1_000_000_000) return dayjs(num).format("MM/DD/YYYY");
    return dayjs(val).format("MM/DD/YYYY");
  }
  return dayjs(val as Date).format("MM/DD/YYYY");
};

function ageInDays(saledate: string): number {
  const num = Number(saledate);
  const d = !isNaN(num) && num > 1_000_000_000 ? dayjs(num) : dayjs(saledate);
  return dayjs().diff(d, "day");
}

const TH: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #ccc", textAlign: "left",
  fontSize: 10, textTransform: "uppercase", background: "#f0f4f8",
  color: "#555", fontWeight: 700, letterSpacing: "0.04em",
};
const TD: React.CSSProperties = { padding: "4px 8px", border: "1px solid #e8e8e8", fontSize: 11 };
const TDR: React.CSSProperties = { ...TD, textAlign: "right" };

const StatementPrintContent = ({
  type, customer, openInvoices, ledgerRows, openingBalance,
  payments, fromDate, toDate, showAging, showSummaryCard, storeName, agingData,
}: Props) => {
  const today = dayjs().format("MM/DD/YYYY");

  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? fromDate.format("MM/DD/YYYY") : "Beginning"} — ${toDate ? toDate.format("MM/DD/YYYY") : "Present"}`
      : "All Transactions";

  const typeLabel =
    type === "open" ? "Open Invoices Statement" :
    type === "history" ? "Transaction History" :
    "Payment Summary";

  // Open invoices
  const totalOutstanding = openInvoices.reduce((s, inv) => s + inv.balancedue, 0);

  // Use DB view aging when available (accurate), fall back to client-side calc
  const aging = agingData
    ? {
        d0_30:   Number(agingData.due_0_30)   || 0,
        d31_60:  Number(agingData.due_31_60)  || 0,
        d61_90:  Number(agingData.due_61_90)  || 0,
        d90plus: (Number(agingData.due_91_120) || 0) + (Number(agingData.due_120_plus) || 0),
      }
    : openInvoices.reduce(
        (acc, inv) => {
          const age = ageInDays(inv.saledate);
          if (age <= 30) acc.d0_30 += inv.balancedue;
          else if (age <= 60) acc.d31_60 += inv.balancedue;
          else if (age <= 90) acc.d61_90 += inv.balancedue;
          else acc.d90plus += inv.balancedue;
          return acc;
        },
        { d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 }
      );

  // Ledger
  const totalDebits = ledgerRows.reduce((s, r) => s + (r.ledamountdebit || 0), 0);
  const totalCredits = ledgerRows.reduce((s, r) => s + (r.ledamountcredit || 0), 0);
  const closingBalance = ledgerRows.length > 0
    ? ledgerRows[ledgerRows.length - 1].running_balance ?? 0
    : openingBalance;

  // Payments
  const activePayments = payments.filter(p => !p.voidpayment);
  const totalPaid = activePayments.reduce((s, p) => s + p.amountpaid, 0);

  const addressLine = [customer.custcity, customer.custstate, customer.custzip].filter(Boolean).join(", ");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#1a1a1a", background: "#fff" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "3px solid #1e293b", paddingBottom: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>{storeName}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 3 }}>{typeLabel}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
          <div>Statement Date: <strong style={{ color: "#1e293b" }}>{today}</strong></div>
          {type !== "open" && (
            <div style={{ marginTop: 2 }}>Period: <strong style={{ color: "#1e293b" }}>{periodLabel}</strong></div>
          )}
        </div>
      </div>

      {/* ── Customer + Account Info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "12px 14px", background: "#f8fafc" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: "0.06em" }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{customer.custcompanyname || customer.fullname}</div>
          {customer.fullname && customer.custcompanyname && (
            <div style={{ color: "#475569", marginTop: 2 }}>{customer.fullname}</div>
          )}
          {customer.custaddress && <div style={{ color: "#475569", marginTop: 2 }}>{customer.custaddress}</div>}
          {addressLine && <div style={{ color: "#475569" }}>{addressLine}</div>}
          {customer.phone && <div style={{ color: "#475569", marginTop: 4 }}>Ph: {customer.phone}</div>}
          {customer.custemailadd && <div style={{ color: "#475569" }}>{customer.custemailadd}</div>}
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "12px 14px", background: "#f8fafc" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: "0.06em" }}>Account Summary</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#64748b" }}>Customer ID:</span>
            <strong style={{ color: "#0f172a" }}>#{customer.customerid}</strong>
          </div>
          {type === "open" && <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Total Outstanding:</span>
              <strong style={{ color: totalOutstanding > 0 ? "#dc2626" : "#16a34a" }}>{fmt(totalOutstanding)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Credit Available:</span>
              <strong style={{ color: "#16a34a" }}>{fmt(customer.opencredit)}</strong>
            </div>
          </>}
          {type === "history" && <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Total Charges:</span>
              <strong>{fmt(totalDebits)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Total Payments:</span>
              <strong style={{ color: "#16a34a" }}>{fmt(totalCredits)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6, marginTop: 6 }}>
              <span style={{ color: "#64748b" }}>Closing Balance:</span>
              <strong style={{ color: closingBalance < 0 ? "#dc2626" : "#0f172a" }}>{fmt(closingBalance)}</strong>
            </div>
          </>}
          {type === "payments" && <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Total Payments:</span>
              <strong>{activePayments.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total Amount Paid:</span>
              <strong style={{ color: "#16a34a" }}>{fmt(totalPaid)}</strong>
            </div>
          </>}
        </div>
      </div>

      {/* ── Aging Summary (Open Invoices only) ── */}
      {showSummaryCard && type === "open" && showAging && (
        <div style={{ marginBottom: 18, border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", padding: "6px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.06em" }}>
            Aging Summary
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {([
              { label: "Current (0–30d)", value: aging.d0_30, warn: false },
              { label: "31–60 days", value: aging.d31_60, warn: aging.d31_60 > 0 },
              { label: "61–90 days", value: aging.d61_90, warn: aging.d61_90 > 0 },
              { label: "90+ days", value: aging.d90plus, warn: aging.d90plus > 0, danger: true },
              { label: "Total Outstanding", value: totalOutstanding, warn: false, bold: true },
            ] as { label: string; value: number; warn: boolean; danger?: boolean; bold?: boolean }[]).map((b, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRight: i < 4 ? "1px solid #e2e8f0" : undefined, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontSize: 15, fontWeight: b.bold ? 800 : 700, color: b.value === 0 ? "#94a3b8" : b.danger ? "#dc2626" : b.warn ? "#d97706" : "#16a34a" }}>
                  {fmt(b.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Open Invoices Table ── */}
      {type === "open" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Invoice #", "Invoice Date", "Original Amount", "Amount Paid", "Balance Due", "Days Outstanding"].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {openInvoices.length === 0 ? (
              <tr><td colSpan={6} style={{ ...TD, textAlign: "center", color: "#94a3b8", padding: 20 }}>No open invoices found.</td></tr>
            ) : openInvoices.map((inv, i) => {
              const age = ageInDays(inv.saledate);
              const ageColor = age > 90 ? "#dc2626" : age > 60 ? "#ea580c" : age > 30 ? "#d97706" : "#16a34a";
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={TD}>{inv.invoicenumber}</td>
                  <td style={TD}>{fmtDate(inv.saledate)}</td>
                  <td style={TDR}>{fmt(inv.totalamount)}</td>
                  <td style={TDR}>{fmt(inv.amountreceived)}</td>
                  <td style={{ ...TDR, fontWeight: 700, color: "#dc2626" }}>{fmt(inv.balancedue)}</td>
                  <td style={{ ...TDR, color: ageColor, fontWeight: 600 }}>{age}d</td>
                </tr>
              );
            })}
          </tbody>
          {openInvoices.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f1f5f9", fontWeight: 700, borderTop: "2px solid #94a3b8" }}>
                <td style={TD} colSpan={4}>TOTAL ({openInvoices.length} invoice{openInvoices.length !== 1 ? "s" : ""})</td>
                <td style={{ ...TDR, fontWeight: 800, color: totalOutstanding > 0 ? "#dc2626" : "#16a34a" }}>{fmt(totalOutstanding)}</td>
                <td style={TD} />
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {/* ── Transaction History Table ── */}
      {type === "history" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Date", "Activity", "Description", "Reference", "Debit", "Credit", "Balance"].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {fromDate && (
              <tr style={{ background: "#eef2ff", fontStyle: "italic" }}>
                <td style={TD} /><td style={TD} />
                <td style={{ ...TD, fontWeight: 700 }}>Opening Balance</td>
                <td style={TD} /><td style={TDR} /><td style={TDR} />
                <td style={{ ...TDR, fontWeight: 700 }}>{fmt(openingBalance)}</td>
              </tr>
            )}
            {ledgerRows.length === 0 ? (
              <tr><td colSpan={7} style={{ ...TD, textAlign: "center", color: "#94a3b8", padding: 20 }}>No transactions found.</td></tr>
            ) : ledgerRows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td style={{ ...TD, whiteSpace: "nowrap" }}>{fmtDate(row.ledgerdate)}</td>
                <td style={TD}>{row.ledgercode}</td>
                <td style={TD}>{row.ledgerdescription}</td>
                <td style={TD}>{row.ledgerreference}</td>
                <td style={TDR}>{row.ledamountdebit ? fmt(row.ledamountdebit) : ""}</td>
                <td style={TDR}>{row.ledamountcredit ? fmt(row.ledamountcredit) : ""}</td>
                <td style={{ ...TDR, color: (row.running_balance ?? 0) < 0 ? "#dc2626" : undefined }}>{fmt(row.running_balance)}</td>
              </tr>
            ))}
          </tbody>
          {ledgerRows.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f1f5f9", fontWeight: 700, borderTop: "2px solid #94a3b8" }}>
                <td style={TD} colSpan={4}>TOTAL</td>
                <td style={TDR}>{fmt(totalDebits)}</td>
                <td style={TDR}>{fmt(totalCredits)}</td>
                <td style={{ ...TDR, color: closingBalance < 0 ? "#dc2626" : undefined }}>{fmt(closingBalance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {/* ── Payment Summary Table ── */}
      {type === "payments" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Txn #", "Payment Date", "Invoice #", "Mode", "Reference", "Amount Paid", "Status"].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} style={{ ...TD, textAlign: "center", color: "#94a3b8", padding: 20 }}>No payments found.</td></tr>
            ) : payments.map((pay, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? "#fff" : "#f8fafc",
                textDecoration: pay.voidpayment ? "line-through" : undefined,
                color: pay.voidpayment ? "#94a3b8" : undefined,
              }}>
                <td style={TD}>{pay.transactionno}</td>
                <td style={TD}>{fmtDate(pay.paymentdate)}</td>
                <td style={TD}>{pay.invoiceno}</td>
                <td style={TD}>{pay.paymode}</td>
                <td style={TD}>{pay.paymentreference}</td>
                <td style={TDR}>{fmt(pay.amountpaid)}</td>
                <td style={TD}>{pay.paymentstatus}</td>
              </tr>
            ))}
          </tbody>
          {payments.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f1f5f9", fontWeight: 700, borderTop: "2px solid #94a3b8" }}>
                <td style={TD} colSpan={5}>TOTAL PAID ({activePayments.length} payment{activePayments.length !== 1 ? "s" : ""})</td>
                <td style={{ ...TDR, color: "#16a34a", fontWeight: 800 }}>{fmt(totalPaid)}</td>
                <td style={TD} />
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 28, paddingTop: 10, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 10 }}>
        <span>Generated by {storeName} · {today}</span>
        <span>This statement is for informational purposes only.</span>
      </div>
    </div>
  );
};

export default StatementPrintContent;
