"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLazyQuery } from "@apollo/client";
import dayjs, { Dayjs } from "dayjs";
import { Printer, X, RefreshCw } from "react-feather";
import {
  GET_SUPPLIER_BALANCE_DUE_QUERY,
  GET_SUPPLIER_LEDGER_LIST_QUERY,
  GET_NON_VOIDED_SUPPLIER_PAYMENT_TRANSACTION_LIST_QUERY,
} from "@/lib/graphql/query/supplier";
import { useAppSelector } from "@/lib/store/hook";
import { useParams } from "next/navigation";
import { SupplierListType } from "@/types/supplier";
import SupplierStatementPrintContent, {
  SupplierStatementType,
  SupplierBalanceDueInvoice,
  SupplierPaymentEntry,
  StatementSupplier,
} from "./SupplierStatementPrintContent";
import { SupplierLedgerListType } from "@/types/supplier";

interface Props {
  supplier: SupplierListType;
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

const DateInput: React.FC<{ value: Dayjs | null; onChange: (d: Dayjs | null) => void }> = ({ value, onChange }) => (
  <input
    type="date"
    value={value ? value.format("YYYY-MM-DD") : ""}
    onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)}
    style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, boxSizing: "border-box", color: "#1e293b" }}
  />
);

const SupplierStatementModal: React.FC<Props> = ({ supplier, onClose }) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const storeName = useAppSelector((state) => state.store.data?.storename ?? "");

  const [type, setType] = useState<SupplierStatementType>("open");
  const [preset, setPreset] = useState<Preset>("open");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  const previewRef = useRef<HTMLDivElement>(null);

  const [fetchOpenInvoices, { data: openInvoicesData, loading: loadingOpen }] =
    useLazyQuery(GET_SUPPLIER_BALANCE_DUE_QUERY, { fetchPolicy: "network-only" });

  const [fetchLedger, { data: ledgerData, loading: loadingLedger }] =
    useLazyQuery(GET_SUPPLIER_LEDGER_LIST_QUERY, { fetchPolicy: "network-only" });

  const [fetchPayments, { data: paymentsData, loading: loadingPayments }] =
    useLazyQuery(GET_NON_VOIDED_SUPPLIER_PAYMENT_TRANSACTION_LIST_QUERY, { fetchPolicy: "network-only" });

  const supplierId = supplier.supplierid;

  const load = (t: SupplierStatementType, from: Dayjs | null, to: Dayjs | null) => {
    if (t === "open") {
      fetchOpenInvoices({
        variables: {
          storeid: parsedStoreId,
          outletid: parsedOutletId,
          supplierid: supplierId,
        },
      });
    } else if (t === "history") {
      const filters: object[] = [
        { key: "supplierid", value: { filterType: "number", type: "equals", filter: String(supplierId) } },
      ];
      if (from && to) {
        filters.push({ key: "ledgerdate", value: { filterType: "date", type: "inRange", dateFrom: from.format("YYYY-MM-DD"), dateTo: to.format("YYYY-MM-DD") } });
      } else if (from) {
        filters.push({ key: "ledgerdate", value: { filterType: "date", type: "greaterThanOrEqual", dateFrom: from.format("YYYY-MM-DD") } });
      } else if (to) {
        filters.push({ key: "ledgerdate", value: { filterType: "date", type: "lessThanOrEqual", dateTo: to.format("YYYY-MM-DD") } });
      }
      fetchLedger({
        variables: {
          outletid: parsedOutletId,
          page: 1,
          perpage: 10000,
          filters,
          sortModel: [{ colId: "ledgerdate", sort: "asc" }],
          rowGroupCols: [],
          groupKeys: [],
        },
      });
    } else {
      fetchPayments({
        variables: {
          storeid: parsedStoreId,
          supplierid: supplierId,
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

  const handleTypeChange = (t: SupplierStatementType) => {
    setType(t);
    if (t === "open") {
      setPreset("open");
      setFromDate(null);
      setToDate(null);
    }
  };

  /* ── Derived data ── */
  const openInvoices: SupplierBalanceDueInvoice[] = openInvoicesData?.getSupplierBalanceDue ?? [];

  /* Payments — filter by date client-side if range selected */
  const rawPayments: SupplierPaymentEntry[] = paymentsData?.getNonVoidedSupplierPaymentTransactionList ?? [];
  const payments = rawPayments.filter((p) => {
    if (!fromDate && !toDate) return true;
    const d = dayjs(p.postingdate);
    if (fromDate && d.isBefore(fromDate, "day")) return false;
    if (toDate && d.isAfter(toDate, "day")) return false;
    return true;
  });

  const ledgerRows: SupplierLedgerListType[] = ledgerData?.getSupplierLedgerList?.data ?? [];

  const isLoading = loadingOpen || loadingLedger || loadingPayments;

  const statementSupplier: StatementSupplier = {
    supplierid: supplier.supplierid,
    companyname: supplier.companyname,
    contactname: supplier.contactname,
    address1: supplier.address1,
    city: supplier.city,
    state: supplier.state,
    zipcode: supplier.zipcode,
    phone1: supplier.phone1,
    emailaddress: supplier.emailaddress,
    balancedue: supplier.balancedue,
    opencredit: supplier.opencredit,
    totalpurchase: supplier.totalpurchase,
    lastpurchasedate: supplier.lastpurchasedate,
    lastpaymentdate: supplier.lastpaymentdate,
  };

  const handlePrint = () => {
    if (!previewRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement — ${supplier.companyname}</title>
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
${previewRef.current.innerHTML}
</body>
</html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const supplierName = supplier.companyname || supplier.contactname;

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
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px",
          background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
          color: "#fff", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Vendor Statement</div>
            <div style={{ fontSize: 12, color: "#bbf7d0", marginTop: 2 }}>{supplierName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#bbf7d0", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left — Controls */}
          <div style={{
            width: 270, flexShrink: 0, borderRight: "1px solid #e2e8f0",
            background: "#f8fafc", display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}>
            <div style={{ padding: "16px 16px 0" }}>
              {/* Statement Type */}
              <div style={{ marginBottom: 18 }}>
                <ControlLabel>Statement Type</ControlLabel>
                {([
                  { value: "open", label: "Open Payables" },
                  { value: "history", label: "Transaction History" },
                  { value: "payments", label: "Payment Summary" },
                ] as { value: SupplierStatementType; label: string }[]).map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                    <input
                      type="radio"
                      name="supplierStatementType"
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={() => handleTypeChange(opt.value)}
                      style={{ accentColor: "#15803d" }}
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
                          background: preset === p.value ? "#15803d" : "#fff",
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
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={showSummaryCard}
                    onChange={(e) => setShowSummaryCard(e.target.checked)}
                    style={{ accentColor: "#15803d" }}
                  />
                  Show account summary
                </label>
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Action Buttons */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={handlePrint}
                disabled={isLoading}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 12px", border: "none", borderRadius: 7,
                  background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Printer size={14} />
                Print Statement
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
            <div style={{ background: "#fff", borderRadius: 8, padding: "28px 32px", minHeight: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              <div ref={previewRef}>
                <SupplierStatementPrintContent
                  type={type}
                  supplier={statementSupplier}
                  openInvoices={openInvoices}
                  ledgerRows={ledgerRows}
                  payments={payments}
                  fromDate={type !== "open" ? fromDate : null}
                  toDate={type !== "open" ? toDate : null}
                  showSummaryCard={showSummaryCard}
                  storeName={storeName}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default SupplierStatementModal;
