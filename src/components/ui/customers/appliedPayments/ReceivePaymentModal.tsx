"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useLazyQuery } from "@apollo/client";
import dayjs from "dayjs";
import { DollarSign, X } from "react-feather";
import { useDispatch } from "react-redux";

import Select from "react-select/base";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import { selectStyles } from "@/lib/styles/selectStyles";
import { GET_CUSTOMER_QUERY, GET_CUSTOMERS_WITH_BALANCE_QUERY } from "@/lib/graphql/query/customer";
import { GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY, GET_CUSTOMER_CREDIT_APPLY_SUMMARY_QUERY } from "@/lib/graphql/query/customer";
import { CREATE_CUSTOMER_PAYMENT_MUTATION, CREATE_CUSTOMER_CREDIT_APPLY_MUTATION } from "@/lib/graphql/mutations/customer";

// ─── Types ─────────────────────────────────────────────────────────────────

type ARDoc = {
  invoicenumber: number;
  customerid: number;
  saledate: string;
  totalamount: number;
  amountreceived: number;
  balancedue: number;
  warehouseid: number;
  salemodeid: number;
  isCreditInvoice?: boolean;
};

type CreditDoc = ARDoc & { isCreditInvoice: boolean };

// salemodeid: 2=Invoice, 5=Credit Invoice, 6=Memo, 8=Memo Credit
const SALEMODE_INVOICE = 2;
const SALEMODE_CREDIT_INVOICE = 5;
const SALEMODE_MEMO = 6;
const SALEMODE_MEMO_CREDIT = 8;

// ─── Helpers ────────────────────────────────────────────────────────────────

const ageDays = (saledate: string) =>
  dayjs().diff(dayjs(saledate), "day");

const AgeDot = ({ days }: { days: number }) => {
  if (days <= 30) return <span style={{ color: "#94a3b8", fontSize: 10 }}>●</span>;
  if (days <= 60) return <span style={{ color: "#d97706", fontSize: 10 }}>●</span>;
  if (days <= 90) return <span style={{ color: "#ea580c", fontSize: 10 }}>●</span>;
  return <span style={{ color: "#dc2626", fontSize: 10 }}>●</span>;
};

const AgeBadge = ({ days }: { days: number }) => {
  if (days <= 30) return <span style={{ fontSize: 10, color: "#64748b" }}>{days}d</span>;
  if (days <= 60) return <span style={{ fontSize: 10, color: "#d97706", fontWeight: 600 }}>{days}d</span>;
  if (days <= 90) return <span style={{ fontSize: 10, color: "#ea580c", fontWeight: 600 }}>{days}d</span>;
  return <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>{days}d</span>;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e2e8f0",
  }}>
    {children}
  </div>
);

// ─── Snapshot Card ──────────────────────────────────────────────────────────

const SnapshotCard = ({
  openInvoices,
  openMemos,
  invoiceCredits,
  memoCredits,
}: {
  openInvoices: ARDoc[];
  openMemos: ARDoc[];
  invoiceCredits: ARDoc[];
  memoCredits: ARDoc[];
}) => {
  const totalDue = useMemo(
    () =>
      [...openInvoices, ...openMemos].reduce(
        (s, d) => s + Math.abs(d.balancedue),
        0
      ),
    [openInvoices, openMemos]
  );
  const totalCredits = useMemo(
    () =>
      [...invoiceCredits, ...memoCredits].reduce(
        (s, d) => s + Math.abs(d.balancedue),
        0
      ),
    [invoiceCredits, memoCredits]
  );
  const overdue = useMemo(
    () =>
      [...openInvoices, ...openMemos]
        .filter((d) => ageDays(d.saledate) > 30)
        .reduce((s, d) => s + Math.abs(d.balancedue), 0),
    [openInvoices, openMemos]
  );
  const dso = useMemo(() => {
    const docs = [...openInvoices, ...openMemos];
    const totalBal = docs.reduce((s, d) => s + Math.abs(d.balancedue), 0);
    if (!totalBal) return 0;
    const weighted = docs.reduce(
      (s, d) => s + Math.abs(d.balancedue) * ageDays(d.saledate),
      0
    );
    return Math.round(weighted / totalBal);
  }, [openInvoices, openMemos]);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12,
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 8,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Total Due</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: totalDue > 0 ? "#dc2626" : "#1e293b" }}>{fmt(totalDue)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Overdue</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: overdue > 0 ? "#d97706" : "#1e293b" }}>{fmt(overdue)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Credits</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: totalCredits > 0 ? "#16a34a" : "#1e293b" }}>{fmt(totalCredits)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>DSO</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{dso}d</div>
      </div>
    </div>
  );
};

// ─── Open Items Table ────────────────────────────────────────────────────────

const OpenItemsTable = ({
  docs,
  title,
  selected,
  onToggle,
  onAmountChange,
  onSelectAll,
}: {
  docs: ARDoc[];
  title: string;
  selected: Map<number, number>;
  onToggle: (invoicenumber: number, balancedue: number) => void;
  onAmountChange: (invoicenumber: number, amount: number) => void;
  onSelectAll: (select: boolean) => void;
}) => {
  if (!docs.length) return null;

  const allSelected = docs.length > 0 && docs.every((d) => selected.has(d.invoicenumber));
  const someSelected = docs.some((d) => selected.has(d.invoicenumber));

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: "1px solid #e2e8f0",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
          {title}
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11, color: "#1d4ed8", fontWeight: 600, userSelect: "none" }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={(e) => onSelectAll(e.target.checked)}
            style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#1d4ed8" }}
          />
          Select All
        </label>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={thStyle}></th>
            <th style={thStyle}>Age</th>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Date</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Balance</th>
            <th style={{ ...thStyle, textAlign: "right", width: 80 }}>Apply</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const days = ageDays(doc.saledate);
            const isChecked = selected.has(doc.invoicenumber);
            const applyAmt = selected.get(doc.invoicenumber) ?? 0;
            return (
              <tr
                key={doc.invoicenumber}
                style={{
                  background: isChecked ? "#eff6ff" : "transparent",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(doc.invoicenumber, Math.abs(doc.balancedue))}
                    style={{ cursor: "pointer" }}
                  />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <AgeDot days={days} />
                    <AgeBadge days={days} />
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: "#1e40af" }}>#{doc.invoicenumber}</span>
                </td>
                <td style={tdStyle}>{dayjs(doc.saledate).format("MMM D, YY")}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(Math.abs(doc.totalamount))}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt(Math.abs(doc.balancedue))}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {isChecked ? (
                    <input
                      type="number"
                      min={0}
                      max={Math.abs(doc.balancedue)}
                      step="0.01"
                      value={applyAmt}
                      onChange={(e) =>
                        onAmountChange(
                          doc.invoicenumber,
                          Math.min(Number(e.target.value), Math.abs(doc.balancedue))
                        )
                      }
                      style={{
                        width: 72,
                        textAlign: "right",
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                        borderRadius: 4,
                        padding: "2px 4px",
                      }}
                    />
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Credit Row (right panel) ─────────────────────────────────────────────

const CreditRow = ({
  doc,
  label,
  checked,
  amount,
  maxAmount,
  onToggle,
  onAmountChange,
}: {
  doc: CreditDoc;
  label: string;
  checked: boolean;
  amount: number;
  maxAmount: number;
  onToggle: () => void;
  onAmountChange: (v: number) => void;
}) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 11,
  }}>
    <input type="checkbox" checked={checked} onChange={onToggle} style={{ cursor: "pointer" }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontWeight: 600, color: "#166534" }}>#{doc.invoicenumber}</span>
      <span style={{ color: "#64748b", marginLeft: 4 }}>{label}</span>
    </div>
    <span style={{ color: "#16a34a", fontWeight: 600, minWidth: 56, textAlign: "right" }}>
      {fmt(Math.abs(doc.balancedue))}
    </span>
    {checked ? (
      <input
        type="number"
        min={0}
        max={maxAmount}
        step="0.01"
        value={amount}
        onChange={(e) => onAmountChange(Math.min(Number(e.target.value), maxAmount))}
        style={{
          width: 68,
          textAlign: "right",
          fontSize: 11,
          border: "1px solid #86efac",
          borderRadius: 4,
          padding: "2px 4px",
          background: "#f0fdf4",
        }}
      />
    ) : (
      <span style={{ width: 68, textAlign: "right", color: "#94a3b8" }}>—</span>
    )}
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "5px 6px",
  fontWeight: 600,
  fontSize: 10,
  color: "#475569",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "5px 6px",
  verticalAlign: "middle",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface ReceivePaymentModalProps {
  storeId: number;
  outletId: number;
  closeModal: () => void;
  prefillCustomerId?: number;
  prefillInvoiceNumber?: number;
  prefillCreditNumber?: number;
}

const ReceivePaymentModal = ({
  storeId,
  outletId,
  closeModal,
  prefillCustomerId,
  prefillInvoiceNumber,
  prefillCreditNumber,
}: ReceivePaymentModalProps) => {
  const dispatch = useDispatch();

  // ── Customer & warehouse ──────────────────────────────────────────────
  const [customerId, setCustomerId] = useState<number>(prefillCustomerId ?? 0);
  const [paymentModeid, setPaymentModeid] = useState<number>(0);
  const [paymentModeLabel, setPaymentModeLabel] = useState("");
  const [postingDate, setPostingDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [refNo, setRefNo] = useState("");
  const [reference, setReference] = useState("");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // selected open items: Map<invoicenumber, applyAmount>
  const [selectedInvoices, setSelectedInvoices] = useState<Map<number, number>>(new Map());
  const [selectedMemos, setSelectedMemos] = useState<Map<number, number>>(new Map());
  // selected credits: Map<invoicenumber, applyAmount>
  const [selectedInvCredits, setSelectedInvCredits] = useState<Map<number, number>>(new Map());
  const [selectedMemoCredits, setSelectedMemoCredits] = useState<Map<number, number>>(new Map());

  // ── Customer list from view (balance ≠ 0 only, includes last payment date) ──
  const [custMenuOpen, setCustMenuOpen] = useState(false);
  const [custInput, setCustInput] = useState("");

  const { data: custBalanceData, loading: customersLoading } = useQuery(GET_CUSTOMERS_WITH_BALANCE_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const customerOptions = useMemo(() => {
    return ((custBalanceData?.getCustomersWithBalance ?? []) as any[]).map((c) => ({
      value: c.customerid,
      label: c.companyname ?? c.customername ?? `Customer #${c.customerid}`,
      companyname: c.companyname ?? c.customername ?? `Customer #${c.customerid}`,
      customerid: c.customerid,
      total_due: Number(c.total_due ?? 0),
      last_sale_date: c.last_sale_date ?? null,
      last_payment_date: c.last_payment_date ?? null,
    }));
  }, [custBalanceData]);

  const selectedCustOption = useMemo(
    () => customerOptions.find((o) => o.value === customerId) ?? null,
    [customerOptions, customerId]
  );

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: storeId, customerid: customerId },
    skip: !storeId || !customerId,
  });
  const warehouseId: number = customerData?.getCustomer?.warehouseid ?? 0;

  const [fetchBalanceDue, { data: balanceData, loading: balanceLoading }] = useLazyQuery(
    GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY
  );
  const [fetchCreditSummary, { data: creditData, loading: creditLoading }] = useLazyQuery(
    GET_CUSTOMER_CREDIT_APPLY_SUMMARY_QUERY
  );

  useEffect(() => {
    if (!customerId || !warehouseId) return;
    fetchBalanceDue({
      variables: {
        storeid: storeId,
        outletid: outletId,
        warehouseid: warehouseId,
        customerid: customerId,
        isCredit: false,
      },
    });
    fetchCreditSummary({
      variables: { storeid: storeId, outletid: outletId, customerid: customerId },
    });
  }, [customerId, warehouseId, storeId, outletId, fetchBalanceDue, fetchCreditSummary]);

  // ── Derived AR data ───────────────────────────────────────────────────
  const allBalanceDue: ARDoc[] = useMemo(
    () => (balanceData?.getCustomerBalanceDueInvoices ?? []) as ARDoc[],
    [balanceData]
  );

  const openInvoices = useMemo(
    () => allBalanceDue.filter((d) => d.salemodeid === SALEMODE_INVOICE && d.balancedue > 0),
    [allBalanceDue]
  );
  const openMemos = useMemo(
    () => allBalanceDue.filter((d) => d.salemodeid === SALEMODE_MEMO && d.balancedue > 0),
    [allBalanceDue]
  );

  const allCredits: CreditDoc[] = useMemo(() => {
    const ci = (creditData?.getCustomerCreditApplySummary?.creditInvoices ?? []) as CreditDoc[];
    const bd = (creditData?.getCustomerCreditApplySummary?.balanceDueInvoices ?? []) as CreditDoc[];
    return [...ci, ...bd];
  }, [creditData]);

  const invoiceCredits = useMemo(
    () => allCredits.filter((d) => d.salemodeid === SALEMODE_CREDIT_INVOICE),
    [allCredits]
  );
  const memoCredits = useMemo(
    () => allCredits.filter((d) => d.salemodeid === SALEMODE_MEMO_CREDIT),
    [allCredits]
  );

  // ── Pre-fill on load ─────────────────────────────────────────────────
  useEffect(() => {
    if (prefillInvoiceNumber && openInvoices.some((d) => d.invoicenumber === prefillInvoiceNumber)) {
      setSelectedInvoices(new Map([[prefillInvoiceNumber, 0]]));
    }
  }, [openInvoices, prefillInvoiceNumber]);

  useEffect(() => {
    if (prefillCreditNumber) {
      const cr = invoiceCredits.find((d) => d.invoicenumber === prefillCreditNumber);
      if (cr) setSelectedInvCredits(new Map([[prefillCreditNumber, Math.abs(cr.balancedue)]]));
    }
  }, [invoiceCredits, prefillCreditNumber]);

  // ── Customer change ───────────────────────────────────────────────────
  const handleCustomerChange = useCallback((id: number) => {
    setCustomerId(id);
    setSelectedInvoices(new Map());
    setSelectedMemos(new Map());
    setSelectedInvCredits(new Map());
    setSelectedMemoCredits(new Map());
    setCashAmount(0);
  }, []);

  // ── Toggle helpers ────────────────────────────────────────────────────
  const toggleItem = (
    map: Map<number, number>,
    setMap: React.Dispatch<React.SetStateAction<Map<number, number>>>,
    key: number,
    defaultAmount: number
  ) => {
    setMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, defaultAmount);
      }
      return next;
    });
  };

  const updateAmount = (
    map: Map<number, number>,
    setMap: React.Dispatch<React.SetStateAction<Map<number, number>>>,
    key: number,
    amount: number
  ) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, amount);
      return next;
    });
  };

  // ── Live summary ──────────────────────────────────────────────────────
  const selectedTotal = useMemo(
    () =>
      [...selectedInvoices.values(), ...selectedMemos.values()].reduce((s, v) => s + v, 0),
    [selectedInvoices, selectedMemos]
  );
  const invCreditsTotal = useMemo(
    () => [...selectedInvCredits.values()].reduce((s, v) => s + v, 0),
    [selectedInvCredits]
  );
  const memoCreditsTotal = useMemo(
    () => [...selectedMemoCredits.values()].reduce((s, v) => s + v, 0),
    [selectedMemoCredits]
  );
  const remaining = useMemo(
    () => selectedTotal - invCreditsTotal - memoCreditsTotal - cashAmount,
    [selectedTotal, invCreditsTotal, memoCreditsTotal, cashAmount]
  );

  // Max button: fill cash to cover remaining after credits
  const handleMax = () => {
    const afterCredits = Math.max(0, selectedTotal - invCreditsTotal - memoCreditsTotal);
    setCashAmount(Math.round(afterCredits * 100) / 100);
  };

  // ── Mutations ──────────────────────────────────────────────────────────
  const [createCreditApply] = useMutation(CREATE_CUSTOMER_CREDIT_APPLY_MUTATION);
  const [createPayment] = useMutation(CREATE_CUSTOMER_PAYMENT_MUTATION);

  const canSave =
    customerId > 0 &&
    warehouseId > 0 &&
    (selectedInvoices.size > 0 || selectedMemos.size > 0) &&
    (invCreditsTotal > 0 || memoCreditsTotal > 0 || cashAmount > 0) &&
    remaining >= 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const result = await handleTryCatch(async () => {
      // 1. Apply invoice credits to selected invoices
      for (const [creditNo, amount] of selectedInvCredits.entries()) {
        if (amount <= 0) continue;
        await createCreditApply({
          variables: {
            input: {
              storeid: storeId,
              customerid: customerId,
              outletid: outletId,
              postingdate: postingDate,
              creditInvoiceNumber: String(creditNo),
              amountToApply: amount,
              targetInvoiceNumbers: [...selectedInvoices.keys()].map(String),
              reference: reference || undefined,
            },
          },
        });
      }

      // 2. Apply memo credits to selected memos
      for (const [creditNo, amount] of selectedMemoCredits.entries()) {
        if (amount <= 0) continue;
        await createCreditApply({
          variables: {
            input: {
              storeid: storeId,
              customerid: customerId,
              outletid: outletId,
              postingdate: postingDate,
              creditInvoiceNumber: String(creditNo),
              amountToApply: amount,
              targetInvoiceNumbers: [...selectedMemos.keys()].map(String),
              reference: reference || undefined,
            },
          },
        });
      }

      // 3. Cash payment if any
      if (cashAmount > 0 && paymentModeid > 0) {
        const allSelectedNos = [
          ...[...selectedInvoices.keys()].map(String),
          ...[...selectedMemos.keys()].map(String),
        ];
        await createPayment({
          variables: {
            input: {
              storeid: storeId,
              customerid: customerId,
              outletid: outletId,
              warehouseid: warehouseId,
              postingdate: postingDate,
              paymentmodeid: paymentModeid,
              amount: cashAmount,
              checkcardno: refNo || undefined,
              invoicenumbers: allSelectedNos,
              reference: reference || undefined,
            },
          },
        });
      }

      return true;
    });

    setSaving(false);

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      dispatch(showNotification({ message: "Payment recorded successfully", type: NOTIFICATION_TYPES.SUCCESS }));
      closeModal();
    }
  };

  const dataLoading = balanceLoading || creditLoading;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: 1100 }}>
        <div className="modal-content" style={{ border: "none", borderRadius: 10, overflow: "hidden" }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
              }}>
                <DollarSign size={16} color="#fff" />
              </div>
              <div>
                <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 15 }}>Receive Payment</h5>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  Apply credits and record cash payments against open invoices &amp; memos
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={18} color="rgba(255,255,255,0.8)" />
            </button>
          </div>

          {/* Two-panel body */}
          <div style={{ display: "flex", minHeight: 500, maxHeight: "75vh" }}>

            {/* ─── LEFT PANEL ──────────────────────────────────────────── */}
            <div style={{
              flex: "0 0 58%",
              overflowY: "auto",
              padding: "16px 18px",
              background: "#f8fafc",
              borderRight: "1px solid #e2e8f0",
            }}>
              {/* Customer select / selected card */}
              <div style={{ marginBottom: 12 }}>
                {!selectedCustOption ? (
                  <>
                    <SectionLabel>Customer — only showing accounts with open balance</SectionLabel>
                    <Select
                      isLoading={customersLoading}
                      options={customerOptions}
                      placeholder="Search by name or ID…"
                      isClearable
                      value={null}
                      onChange={(opt: any) => handleCustomerChange(opt?.value ? Number(opt.value) : 0)}
                      menuIsOpen={custMenuOpen}
                      onMenuOpen={() => setCustMenuOpen(true)}
                      onMenuClose={() => setCustMenuOpen(false)}
                      inputValue={custInput}
                      onInputChange={setCustInput}
                      filterOption={(candidate: any, raw: string) => {
                        const q = (raw || "").toLowerCase();
                        if (!q) return true;
                        return (
                          String(candidate.label || "").toLowerCase().includes(q) ||
                          String(candidate.value || "").includes(q)
                        );
                      }}
                      formatOptionLabel={(opt: any) => (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#94a3b8", fontSize: 10, minWidth: 36 }}>#{opt.customerid}</span>
                            <span>{opt.companyname}</span>
                          </div>
                          <span style={{
                            fontWeight: 700,
                            fontSize: 11,
                            color: opt.total_due > 0 ? "#dc2626" : "#16a34a",
                            marginLeft: 12,
                            whiteSpace: "nowrap",
                          }}>
                            {opt.total_due > 0 ? `Due $${opt.total_due.toFixed(2)}` : `Cr $${Math.abs(opt.total_due).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      menuPosition="fixed"
                      styles={selectStyles}
                      className="form-control p-0 select-form-custom"
                    />
                  </>
                ) : (
                  <div style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "baseline", gap: 6 }}>
                        {selectedCustOption.companyname}
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>#{selectedCustOption.customerid}</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: selectedCustOption.total_due > 0 ? "#dc2626" : "#16a34a" }}>
                          {selectedCustOption.total_due > 0
                            ? `Balance Due: $${selectedCustOption.total_due.toFixed(2)}`
                            : `Credit: $${Math.abs(selectedCustOption.total_due).toFixed(2)}`}
                        </span>
                        {selectedCustOption.last_payment_date && (
                          <span style={{ fontSize: 11, color: "#475569" }}>
                            Last payment: <strong>{dayjs(selectedCustOption.last_payment_date).format("MMM D, YYYY")}</strong>
                          </span>
                        )}
                        {selectedCustOption.last_sale_date && (
                          <span style={{ fontSize: 11, color: "#475569" }}>
                            Last sale: <strong>{dayjs(selectedCustOption.last_sale_date).format("MMM D, YYYY")}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCustomerChange(0)}
                      style={{
                        background: "#dbeafe",
                        border: "1px solid #93c5fd",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        color: "#1d4ed8",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Snapshot */}
              {customerId > 0 && !dataLoading && (
                <SnapshotCard
                  openInvoices={openInvoices}
                  openMemos={openMemos}
                  invoiceCredits={invoiceCredits}
                  memoCredits={memoCredits}
                />
              )}

              {dataLoading && (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>
                  Loading AR data…
                </div>
              )}

              {/* Open Invoices */}
              {customerId > 0 && !dataLoading && (
                <>
                  <OpenItemsTable
                    docs={openInvoices}
                    title="Open Invoices"
                    selected={selectedInvoices}
                    onToggle={(no, bal) =>
                      toggleItem(selectedInvoices, setSelectedInvoices, no, bal)
                    }
                    onAmountChange={(no, amt) =>
                      updateAmount(selectedInvoices, setSelectedInvoices, no, amt)
                    }
                    onSelectAll={(select) => {
                      if (select) {
                        setSelectedInvoices(new Map(openInvoices.map((d) => [d.invoicenumber, Math.abs(d.balancedue)])));
                      } else {
                        setSelectedInvoices(new Map());
                      }
                    }}
                  />
                  <OpenItemsTable
                    docs={openMemos}
                    title="Open Memos"
                    selected={selectedMemos}
                    onToggle={(no, bal) =>
                      toggleItem(selectedMemos, setSelectedMemos, no, bal)
                    }
                    onAmountChange={(no, amt) =>
                      updateAmount(selectedMemos, setSelectedMemos, no, amt)
                    }
                    onSelectAll={(select) => {
                      if (select) {
                        setSelectedMemos(new Map(openMemos.map((d) => [d.invoicenumber, Math.abs(d.balancedue)])));
                      } else {
                        setSelectedMemos(new Map());
                      }
                    }}
                  />
                  {openInvoices.length === 0 && openMemos.length === 0 && (
                    <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>
                      No open invoices or memos for this customer
                    </div>
                  )}
                </>
              )}

              {!customerId && (
                <div style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}>
                  Select a customer to view open items
                </div>
              )}
            </div>

            {/* ─── RIGHT PANEL ─────────────────────────────────────────── */}
            <div style={{
              flex: "0 0 42%",
              padding: "16px 18px",
              background: "#fff",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}>

              {/* Payment details */}
              <div>
                <SectionLabel>Payment Details</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>
                      Payment Mode
                    </label>
                    <SelectPaymentMode
                      storeId={storeId}
                      value={paymentModeid}
                      setPaymentMode={setPaymentModeLabel}
                      trigger={() => {}}
                      onChange={(v: number) => setPaymentModeid(v)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>
                      Posting Date
                    </label>
                    <input
                      type="date"
                      value={postingDate}
                      onChange={(e) => setPostingDate(e.target.value)}
                      className="form-control"
                      style={{ fontSize: 12, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>
                      Check / Ref No
                    </label>
                    <input
                      type="text"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      placeholder={paymentModeLabel && paymentModeLabel !== "Cash" ? "Required" : "Optional"}
                      className="form-control"
                      style={{ fontSize: 12, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>
                      Memo / Notes
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="form-control"
                      style={{ fontSize: 12, height: 36 }}
                    />
                  </div>
                </div>
              </div>

              {/* Apply Credits */}
              {(invoiceCredits.length > 0 || memoCredits.length > 0) && (
                <div>
                  <SectionLabel>Apply Credits</SectionLabel>

                  {invoiceCredits.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 600, marginBottom: 4 }}>
                        Invoice Credits → applied to invoices
                      </div>
                      {invoiceCredits.map((cr) => {
                        const maxAmt = Math.min(
                          Math.abs(cr.balancedue),
                          [...selectedInvoices.values()].reduce((s, v) => s + v, 0)
                        );
                        return (
                          <CreditRow
                            key={cr.invoicenumber}
                            doc={cr}
                            label="Cr.Inv"
                            checked={selectedInvCredits.has(cr.invoicenumber)}
                            amount={selectedInvCredits.get(cr.invoicenumber) ?? 0}
                            maxAmount={Math.max(0, maxAmt) || Math.abs(cr.balancedue)}
                            onToggle={() =>
                              toggleItem(
                                selectedInvCredits,
                                setSelectedInvCredits,
                                cr.invoicenumber,
                                Math.min(Math.abs(cr.balancedue), [...selectedInvoices.values()].reduce((s, v) => s + v, 0) || Math.abs(cr.balancedue))
                              )
                            }
                            onAmountChange={(v) =>
                              updateAmount(selectedInvCredits, setSelectedInvCredits, cr.invoicenumber, v)
                            }
                          />
                        );
                      })}
                    </div>
                  )}

                  {memoCredits.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "#166534", fontWeight: 600, marginBottom: 4 }}>
                        Memo Credits → applied to memos
                      </div>
                      {memoCredits.map((cr) => {
                        const memoSelected = [...selectedMemos.values()].reduce((s, v) => s + v, 0);
                        const maxAmt = Math.min(Math.abs(cr.balancedue), memoSelected || Math.abs(cr.balancedue));
                        return (
                          <CreditRow
                            key={cr.invoicenumber}
                            doc={cr}
                            label="Cr.Memo"
                            checked={selectedMemoCredits.has(cr.invoicenumber)}
                            amount={selectedMemoCredits.get(cr.invoicenumber) ?? 0}
                            maxAmount={maxAmt}
                            onToggle={() =>
                              toggleItem(
                                selectedMemoCredits,
                                setSelectedMemoCredits,
                                cr.invoicenumber,
                                maxAmt
                              )
                            }
                            onAmountChange={(v) =>
                              updateAmount(selectedMemoCredits, setSelectedMemoCredits, cr.invoicenumber, v)
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Cash Amount */}
              <div>
                <SectionLabel>Amount</SectionLabel>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cashAmount || ""}
                    placeholder="0.00"
                    onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value)))}
                    className="form-control"
                    style={{ fontSize: 13, height: 36, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleMax}
                    disabled={selectedTotal === 0}
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1d4ed8",
                      cursor: selectedTotal === 0 ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Live Summary */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}>
                  <SectionLabel>Summary</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                    <SummaryRow label="Items Selected" value={fmt(selectedTotal)} />
                    {invCreditsTotal > 0 && (
                      <SummaryRow label="Invoice Credits" value={`– ${fmt(invCreditsTotal)}`} valueColor="#16a34a" />
                    )}
                    {memoCreditsTotal > 0 && (
                      <SummaryRow label="Memo Credits" value={`– ${fmt(memoCreditsTotal)}`} valueColor="#16a34a" />
                    )}
                    {cashAmount > 0 && (
                      <SummaryRow
                        label={paymentModeLabel && paymentModeLabel !== "Cash" ? `${paymentModeLabel} Amount` : "Cash Payment"}
                        value={`– ${fmt(cashAmount)}`}
                        valueColor="#1d4ed8"
                      />
                    )}
                    <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 4, paddingTop: 6 }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 700,
                        fontSize: 13,
                        color: remaining === 0 && selectedTotal > 0 ? "#16a34a" : remaining < 0 ? "#dc2626" : "#92400e",
                      }}>
                        <span>{remaining < 0 ? "Over-applied" : "Remaining"}</span>
                        <span>
                          {remaining < 0 ? `–${fmt(Math.abs(remaining))}` : fmt(remaining)}
                          {remaining === 0 && selectedTotal > 0 ? " ✓" : ""}
                        </span>
                      </div>
                      {remaining < 0 && (
                        <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>
                          Reduce payment amount or deselect an item
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={closeModal}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-submit"
                    disabled={!canSave}
                    onClick={handleSave}
                    style={{ flex: 2, background: canSave ? "#1d4ed8" : undefined }}
                  >
                    {saving ? "Saving…" : "Save Payment →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
    <span>{label}</span>
    <span style={{ fontWeight: 600, color: valueColor ?? "#1e293b" }}>{value}</span>
  </div>
);

export default ReceivePaymentModal;
