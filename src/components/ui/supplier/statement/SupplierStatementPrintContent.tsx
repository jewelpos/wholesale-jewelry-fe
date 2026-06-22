"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { SupplierListType, SupplierLedgerListType } from "@/types/supplier";

export type SupplierStatementType = "open" | "history" | "payments";

export type SupplierBalanceDueInvoice = {
  supplierinvoiceid: number;
  supplierid: number;
  veninvoiceno: string;
  veninvoicedate: string;
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  warehouseid: number;
};

export type SupplierPaymentEntry = {
  paymentid: number;
  postingdate: string;
  reference: string;
  paymode: string;
  checkcardno: string;
  chk_description: string;
  amountpaid: number;
  bankname: string;
  warehousename: string;
};

export type StatementSupplier = Pick<
  SupplierListType,
  | "supplierid"
  | "companyname"
  | "contactname"
  | "address1"
  | "city"
  | "state"
  | "zipcode"
  | "phone1"
  | "emailaddress"
  | "balancedue"
  | "opencredit"
  | "totalpurchase"
  | "lastpurchasedate"
  | "lastpaymentdate"
>;

interface Props {
  type: SupplierStatementType;
  supplier: StatementSupplier;
  openInvoices: SupplierBalanceDueInvoice[];
  ledgerRows: SupplierLedgerListType[];
  payments: SupplierPaymentEntry[];
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  showSummaryCard: boolean;
  storeName: string;
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

const TH: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #ccc", textAlign: "left",
  fontSize: 10, textTransform: "uppercase", background: "#f0f4f8",
  color: "#555", fontWeight: 700, letterSpacing: "0.04em",
};
const TD: React.CSSProperties = { padding: "4px 8px", border: "1px solid #e8e8e8", fontSize: 11 };
const TDR: React.CSSProperties = { ...TD, textAlign: "right" };

const SupplierStatementPrintContent: React.FC<Props> = ({
  type, supplier, openInvoices, ledgerRows, payments,
  fromDate, toDate, showSummaryCard, storeName,
}) => {
  const today = dayjs().format("MM/DD/YYYY");
  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? fromDate.format("MM/DD/YYYY") : "Beginning"} — ${toDate ? toDate.format("MM/DD/YYYY") : "Present"}`
      : "All Time";

  const supplierName = supplier.companyname || supplier.contactname || `Supplier #${supplier.supplierid}`;

  /* ── Open Invoices totals ── */
  const totalOwed = openInvoices.reduce((s, r) => s + Number(r.veninvoicetotal ?? 0), 0);
  const totalPaid = openInvoices.reduce((s, r) => s + Number(r.veninvamtpaid ?? 0), 0);
  const totalBalance = openInvoices.reduce((s, r) => s + Number(r.veninvamtbalance ?? 0), 0);

  /* ── Ledger totals ── */
  const totalDebit = ledgerRows.reduce((s, r) => s + Number(r.ledamountdebit ?? 0), 0);
  const totalCredit = ledgerRows.reduce((s, r) => s + Number(r.ledamountcredit ?? 0), 0);
  const closingBal = ledgerRows.length > 0 ? Number(ledgerRows[ledgerRows.length - 1].running_balance ?? 0) : 0;

  /* ── Payment totals ── */
  const totalPayments = payments.reduce((s, r) => s + Number(r.amountpaid ?? 0), 0);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#1a1a1a" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: "2px solid #166534", paddingBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>{storeName}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>Vendor Statement</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {type === "open" ? "Open Payables" : type === "history" ? "Transaction History" : "Payment Summary"}
            {type !== "open" && ` · ${periodLabel}`}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#475569" }}>
          <div>Date: {today}</div>
          <div style={{ marginTop: 2, fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{supplierName}</div>
          {supplier.address1 && <div>{supplier.address1}</div>}
          {[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).length > 0 && (
            <div>{[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).join(", ")}</div>
          )}
          {supplier.phone1 && <div>{supplier.phone1}</div>}
          {supplier.emailaddress && <div>{supplier.emailaddress}</div>}
        </div>
      </div>

      {/* ── Account Summary Card ── */}
      {showSummaryCard && (
        <div style={{
          display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap",
        }}>
          {[
            { label: "Balance Due", value: fmt(supplier.balancedue), accent: "#dc2626" },
            { label: "Open Credits", value: fmt(supplier.opencredit), accent: "#16a34a" },
            { label: "Total Purchases", value: fmt(supplier.totalpurchase), accent: "#166534" },
            { label: "Last Purchase", value: fmtDate(supplier.lastpurchasedate) || "—", accent: "#475569" },
            { label: "Last Payment", value: fmtDate(supplier.lastpaymentdate) || "—", accent: "#475569" },
          ].map((item) => (
            <div key={item.label} style={{
              flex: "1 1 120px", border: "1px solid #e2e8f0", borderRadius: 6,
              padding: "10px 12px", background: "#f8fafc",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.accent, marginTop: 4 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Open Invoices ── */}
      {type === "open" && (
        openInvoices.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: 13 }}>
            No open payables for this supplier.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={TH}>Vendor Invoice #</th>
                <th style={TH}>Invoice Date</th>
                <th style={{ ...TH, textAlign: "right" }}>Invoice Amount</th>
                <th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
                <th style={{ ...TH, textAlign: "right" }}>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {openInvoices.map((inv) => (
                <tr key={inv.supplierinvoiceid}>
                  <td style={TD}>{inv.veninvoiceno}</td>
                  <td style={TD}>{fmtDate(inv.veninvoicedate)}</td>
                  <td style={TDR}>{fmt(inv.veninvoicetotal)}</td>
                  <td style={TDR}>{fmt(inv.veninvamtpaid)}</td>
                  <td style={{ ...TDR, color: Number(inv.veninvamtbalance) > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                    {fmt(inv.veninvamtbalance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f4f8" }}>
                <td colSpan={2} style={{ ...TD, fontWeight: 700, fontSize: 11 }}>Totals</td>
                <td style={{ ...TDR, fontWeight: 700 }}>{fmt(totalOwed)}</td>
                <td style={{ ...TDR, fontWeight: 700 }}>{fmt(totalPaid)}</td>
                <td style={{ ...TDR, fontWeight: 700, color: "#dc2626" }}>{fmt(totalBalance)}</td>
              </tr>
            </tfoot>
          </table>
        )
      )}

      {/* ── Transaction History ── */}
      {type === "history" && (
        ledgerRows.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: 13 }}>
            No transactions found for the selected period.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={TH}>Date</th>
                <th style={TH}>Code</th>
                <th style={TH}>Description</th>
                <th style={TH}>Reference</th>
                <th style={{ ...TH, textAlign: "right" }}>Debit</th>
                <th style={{ ...TH, textAlign: "right" }}>Credit</th>
                <th style={{ ...TH, textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row, i) => (
                <tr key={row.ledgerid ?? i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={TD}>{fmtDate(row.ledgerdate)}</td>
                  <td style={TD}>{row.ledgercode}</td>
                  <td style={TD}>{row.ledgerdescription}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{row.ledgerreference}</td>
                  <td style={{ ...TDR, color: Number(row.ledamountdebit) > 0 ? "#166534" : "#94a3b8" }}>
                    {Number(row.ledamountdebit) > 0 ? fmt(row.ledamountdebit) : "—"}
                  </td>
                  <td style={{ ...TDR, color: Number(row.ledamountcredit) > 0 ? "#dc2626" : "#94a3b8" }}>
                    {Number(row.ledamountcredit) > 0 ? fmt(row.ledamountcredit) : "—"}
                  </td>
                  <td style={{ ...TDR, fontWeight: 600 }}>{fmt(row.running_balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f4f8" }}>
                <td colSpan={4} style={{ ...TD, fontWeight: 700 }}>Totals</td>
                <td style={{ ...TDR, fontWeight: 700, color: "#166534" }}>{fmt(totalDebit)}</td>
                <td style={{ ...TDR, fontWeight: 700, color: "#dc2626" }}>{fmt(totalCredit)}</td>
                <td style={{ ...TDR, fontWeight: 700 }}>{fmt(closingBal)}</td>
              </tr>
            </tfoot>
          </table>
        )
      )}

      {/* ── Payment Summary ── */}
      {type === "payments" && (
        payments.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: 13 }}>
            No payments found for the selected period.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={TH}>Date</th>
                <th style={TH}>Reference</th>
                <th style={TH}>Payment Mode</th>
                <th style={TH}>Check / Card #</th>
                <th style={TH}>Bank</th>
                <th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.paymentid ?? i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={TD}>{fmtDate(p.postingdate)}</td>
                  <td style={TD}>{p.reference || "—"}</td>
                  <td style={TD}>{p.paymode}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{p.checkcardno || "—"}</td>
                  <td style={TD}>{p.bankname || "—"}</td>
                  <td style={{ ...TDR, fontWeight: 600, color: "#166534" }}>{fmt(p.amountpaid)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f4f8" }}>
                <td colSpan={5} style={{ ...TD, fontWeight: 700 }}>Total Payments</td>
                <td style={{ ...TDR, fontWeight: 700, color: "#166534" }}>{fmt(totalPayments)}</td>
              </tr>
            </tfoot>
          </table>
        )
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #e2e8f0", fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
        This statement is for informational purposes only. — Generated {today} — {storeName}
      </div>
    </div>
  );
};

export default SupplierStatementPrintContent;
