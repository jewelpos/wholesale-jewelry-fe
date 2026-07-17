"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery } from "@apollo/client";
import dayjs, { Dayjs } from "dayjs";
import { Printer, Send, X, RefreshCw } from "react-feather";
import {
  GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY,
  GET_CUSTOMER_LEDGER_REPORT_QUERY,
  GET_CUSTOMER_PAYMENT_LIST_QUERY,
  GET_INVOICE_AGING_REPORT_QUERY,
} from "@/lib/graphql/query/customer";
import { useAppSelector } from "@/lib/store/hook";
import { useParams } from "next/navigation";
import { CustomersListType, CustomerBalanceAgingType, CustomerLedgerReportType, CustomerPaymentListType } from "@/types/customer";
import DOMPurify from "dompurify";
import StatementPrintContent, { StatementType, InvoiceBalanceDue, StatementCustomer } from "./StatementPrintContent";
import SendSMSModal from "./SendSMSModal";

interface Props {
  customer: CustomersListType;
  onClose: () => void;
}

type Preset = "open" | "mtd" | "lastmonth" | "lastquarter" | "ytd" | "custom";

const PRESETS: { label: string; value: Preset }[] = [
  { label: "All Time", value: "open" },
  { label: "This Month", value: "mtd" },
  { label: "Last Month", value: "lastmonth" },
  { label: "Last Quarter", value: "lastquarter" },
  { label: "Year to Date", value: "ytd" },
  { label: "Custom", value: "custom" },
];

function presetDates(preset: Preset): { from: Dayjs | null; to: Dayjs | null } {
  const today = dayjs();
  switch (preset) {
    case "mtd": return { from: today.startOf("month"), to: today };
    case "lastmonth": return { from: today.subtract(1, "month").startOf("month"), to: today.subtract(1, "month").endOf("month") };
    case "lastquarter": {
      const currentQStart = today.startOf("month").subtract((today.month() % 3), "month");
      const qStart = currentQStart.subtract(3, "month");
      return { from: qStart, to: qStart.add(2, "month").endOf("month") };
    }
    case "ytd": return { from: today.startOf("year"), to: today };
    default: return { from: null, to: null };
  }
}

const ControlLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
    {children}
  </div>
);

const DateInput: React.FC<{ value: Dayjs | null; onChange: (d: Dayjs | null) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input
    type="date"
    value={value ? value.format("YYYY-MM-DD") : ""}
    onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)}
    placeholder={placeholder}
    style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, boxSizing: "border-box", color: "#1e293b" }}
  />
);

const CustomerStatementModal: React.FC<Props> = ({ customer, onClose }) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const storeName = useAppSelector((state) => state.store.data?.storename ?? "");

  const [type, setType] = useState<StatementType>("open");
  const [preset, setPreset] = useState<Preset>("open");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [showAging, setShowAging] = useState(true);
  const [showSummaryCard, setShowSummaryCard] = useState(true);
  const [smsOpen, setSmsOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // ── Queries ──
  const [fetchOpenInvoices, { data: openInvoicesData, loading: loadingOpen }] =
    useLazyQuery(GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY, { fetchPolicy: "network-only" });

  const [fetchLedger, { data: ledgerData, loading: loadingLedger }] =
    useLazyQuery(GET_CUSTOMER_LEDGER_REPORT_QUERY, { fetchPolicy: "network-only" });

  const [fetchPayments, { data: paymentsData, loading: loadingPayments }] =
    useLazyQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY, { fetchPolicy: "network-only" });

  const [fetchAging, { data: agingQueryData }] =
    useLazyQuery(GET_INVOICE_AGING_REPORT_QUERY, { fetchPolicy: "network-only" });

  const customerIdNum = parseInt(customer.customerid, 10);

  const load = (t: StatementType, from: Dayjs | null, to: Dayjs | null) => {
    if (t === "open") {
      fetchOpenInvoices({
        variables: {
          storeid: parsedStoreId,
          customerid: customerIdNum,
          outletid: parsedOutletId,
          warehouseid: 0,
          isCredit: false,
        },
      });
      fetchAging({
        variables: {
          outletid: parsedOutletId,
          page: 1,
          perpage: 1,
          filters: [{ key: "customerid", value: { filterType: "number", type: "equals", filter: customerIdNum } }],
          sortModel: [],
        },
      });
    } else if (t === "history") {
      fetchLedger({
        variables: {
          outletid: parsedOutletId,
          customerid: customerIdNum,
          fromdate: from ? from.format("YYYY-MM-DD") : null,
          todate: to ? to.format("YYYY-MM-DD") : null,
          page: 1,
          perpage: 10000,
          filters: [],
          sortModel: [],
          excludeInternalEntries: true,
        },
      });
    } else {
      fetchPayments({
        variables: {
          outletid: parsedOutletId,
          page: 1,
          perpage: 10000,
          filters: [{ key: "customerid", value: { filterType: "number", type: "equals", filter: customerIdNum } }],
          sortModel: [],
        },
      });
    }
  };

  useEffect(() => {
    load(type, fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, fromDate, toDate]);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      const { from, to } = presetDates(p);
      setFromDate(from);
      setToDate(to);
    }
  };

  const handleTypeChange = (t: StatementType) => {
    setType(t);
    if (t === "open") {
      setPreset("open");
      setFromDate(null);
      setToDate(null);
    }
  };

  // ── Derived data ──
  const openInvoices: InvoiceBalanceDue[] = openInvoicesData?.getCustomerBalanceDueInvoices ?? [];
  const ledgerRows: CustomerLedgerReportType[] = ledgerData?.getCustomerLedgerReport?.data ?? [];
  const openingBalance: number = ledgerData?.getCustomerLedgerReport?.openingBalance ?? 0;
  const payments: CustomerPaymentListType[] = paymentsData?.getCustomerPaymentList?.data ?? [];
  const agingData: CustomerBalanceAgingType | null = agingQueryData?.getInvoiceAgingReport?.data?.[0] ?? null;

  const isLoading = loadingOpen || loadingLedger || loadingPayments;

  const statementCustomer: StatementCustomer = {
    customerid: customer.customerid,
    custcompanyname: customer.custcompanyname,
    fullname: customer.fullname,
    custaddress: customer.custaddress,
    custcity: customer.custcity,
    custstate: customer.custstate,
    custzip: customer.custzip,
    phone: customer.phone || customer.mobile,
    custemailadd: customer.custemailadd,
    opencredit: customer.opencredit,
  };

  // ── Print ──
  const handlePrint = () => {
    if (!previewRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const safeBody = DOMPurify.sanitize(previewRef.current.innerHTML);
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement — ${(customer.custcompanyname || customer.fullname || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px 32px; }
    table { width: 100%; border-collapse: collapse; }
    @media print {
      body { padding: 0; }
      @page { margin: 18mm 14mm; }
    }
  </style>
</head>
<body>
${safeBody}
</body>
</html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const customerName = customer.custcompanyname || customer.fullname;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(1100px, 96vw)", height: "min(90vh, 800px)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Customer Statement</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{customerName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body (two panels) ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left — Controls */}
          <div style={{
            width: 290, flexShrink: 0, borderRight: "1px solid #e2e8f0",
            background: "#f8fafc", display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}>
            <div style={{ padding: "16px 16px 0" }}>
              {/* Statement Type */}
              <div style={{ marginBottom: 18 }}>
                <ControlLabel>Statement Type</ControlLabel>
                {([
                  { value: "open", label: "Open Invoices" },
                  { value: "history", label: "Transaction History" },
                  { value: "payments", label: "Payment Summary" },
                ] as { value: StatementType; label: string }[]).map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                    <input
                      type="radio"
                      name="statementType"
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={() => handleTypeChange(opt.value)}
                      style={{ accentColor: "#0f172a" }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Period — only for history/payments */}
              {type !== "open" && (
                <div style={{ marginBottom: 18 }}>
                  <ControlLabel>Period</ControlLabel>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => handlePreset(p.value)}
                        style={{
                          padding: "3px 9px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                          border: preset === p.value ? "none" : "1px solid #cbd5e1",
                          background: preset === p.value ? "#0f172a" : "#fff",
                          color: preset === p.value ? "#fff" : "#374151",
                          fontWeight: preset === p.value ? 600 : 400,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>From</div>
                      <DateInput value={fromDate} onChange={(d) => { setFromDate(d); setPreset("custom"); }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>To</div>
                      <DateInput value={toDate} onChange={(d) => { setToDate(d); setPreset("custom"); }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Display Options */}
              <div style={{ marginBottom: 18 }}>
                <ControlLabel>Display Options</ControlLabel>
                {[
                  { key: "showSummaryCard", label: "Show account summary", value: showSummaryCard, set: setShowSummaryCard },
                  ...(type === "open" ? [{ key: "showAging", label: "Show aging breakdown", value: showAging, set: setShowAging }] : []),
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                    <input
                      type="checkbox"
                      checked={opt.value}
                      onChange={(e) => opt.set(e.target.checked)}
                      style={{ accentColor: "#0f172a" }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Action Buttons */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handlePrint}
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 12px", border: "none", borderRadius: 7,
                  background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Printer size={14} />
                Print Statement
              </button>
              <button
                onClick={() => setSmsOpen(true)}
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 7,
                  background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600,
                  cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                Send via SMS
              </button>
            </div>
          </div>

          {/* Right — Live Preview */}
          <div style={{ flex: 1, overflowY: "auto", background: "#e8edf3", padding: 20, position: "relative" }}>
            {isLoading && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(232,237,243,0.8)", zIndex: 10,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} style={{ color: "#64748b", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Loading statement...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            <div
              style={{
                background: "#fff", borderRadius: 8, padding: "28px 32px",
                minHeight: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div ref={previewRef}>
                <StatementPrintContent
                  type={type}
                  customer={statementCustomer}
                  openInvoices={openInvoices}
                  ledgerRows={ledgerRows}
                  openingBalance={openingBalance}
                  payments={payments}
                  fromDate={type !== "open" ? fromDate : null}
                  toDate={type !== "open" ? toDate : null}
                  showAging={showAging}
                  showSummaryCard={showSummaryCard}
                  storeName={storeName}
                  agingData={agingData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS sub-modal */}
      {smsOpen && (
        <SendSMSModal
          customerName={customerName}
          defaultPhone={customer.phone || customer.mobile || ""}
          storeName={storeName}
          storeid={parsedStoreId}
          customerid={customerIdNum}
          outletid={parsedOutletId}
          previewHtml={previewRef.current?.innerHTML ?? ""}
          onClose={() => setSmsOpen(false)}
          onSent={() => { setSmsOpen(false); }}
        />
      )}
    </>,
    document.body
  );
};

export default CustomerStatementModal;
