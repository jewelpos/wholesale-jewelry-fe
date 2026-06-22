"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { CreditCard, X } from "react-feather";
import { useDispatch } from "react-redux";
import Select from "react-select/base";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import { selectStyles } from "@/lib/styles/selectStyles";
import {
  GET_SUPPLIER_BY_OUTLET_ID_QUERY,
  GET_SUPPLIER_BALANCE_DUE_QUERY,
  GET_SUPPLIER_CREDIT_APPLY_SUMMARY_QUERY,
} from "@/lib/graphql/query/supplier";
import {
  CREATE_SUPPLIER_NEW_PAYMENT_MUTATION,
  CREATE_SUPPLIER_CREDIT_APPLY_MUTATION,
} from "@/lib/graphql/mutations/supplier";

export const PAY_SUPPLIER = "pay_supplier";

// ─── Types ─────────────────────────────────────────────────────────────────

type APDoc = {
  supplierinvoiceid: number;
  supplierid: number;
  veninvoiceno: string;
  veninvoicedate: string;
  veninvoicetotal: number;
  veninvamtpaid: number;
  veninvamtbalance: number;
  warehouseid: number;
  isCreditInvoice?: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const ageDays = (date: string) => dayjs().diff(dayjs(date), "day");

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

const SummaryRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
    <span>{label}</span>
    <span style={{ fontWeight: 600, color: valueColor ?? "#1e293b" }}>{value}</span>
  </div>
);

// ─── Snapshot Card ──────────────────────────────────────────────────────────

const SnapshotCard = ({ openInvoices, credits }: { openInvoices: APDoc[]; credits: APDoc[] }) => {
  const totalPayable = useMemo(
    () => openInvoices.reduce((s, d) => s + Math.abs(d.veninvamtbalance), 0),
    [openInvoices]
  );
  const overdue = useMemo(
    () => openInvoices.filter((d) => ageDays(d.veninvoicedate) > 30).reduce((s, d) => s + Math.abs(d.veninvamtbalance), 0),
    [openInvoices]
  );
  const totalCredits = useMemo(
    () => credits.reduce((s, d) => s + Math.abs(d.veninvamtbalance), 0),
    [credits]
  );
  const dpo = useMemo(() => {
    const totalBal = openInvoices.reduce((s, d) => s + Math.abs(d.veninvamtbalance), 0);
    if (!totalBal) return 0;
    const weighted = openInvoices.reduce((s, d) => s + Math.abs(d.veninvamtbalance) * ageDays(d.veninvoicedate), 0);
    return Math.round(weighted / totalBal);
  }, [openInvoices]);

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
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Total Payable</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: totalPayable > 0 ? "#b45309" : "#1e293b" }}>{fmt(totalPayable)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Overdue</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: overdue > 0 ? "#dc2626" : "#1e293b" }}>{fmt(overdue)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Credits</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: totalCredits > 0 ? "#16a34a" : "#1e293b" }}>{fmt(totalCredits)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>DPO</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{dpo}d</div>
      </div>
    </div>
  );
};

// ─── Open Items Table (string-keyed) ────────────────────────────────────────

const thStyle: React.CSSProperties = { padding: "5px 6px", fontWeight: 600, fontSize: 10, color: "#475569", textAlign: "left", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "5px 6px", verticalAlign: "middle" };

const OpenItemsTable = ({
  docs,
  selected,
  onToggle,
  onAmountChange,
  onSelectAll,
}: {
  docs: APDoc[];
  selected: Map<string, number>;
  onToggle: (veninvoiceno: string, balance: number) => void;
  onAmountChange: (veninvoiceno: string, amount: number) => void;
  onSelectAll: (select: boolean) => void;
}) => {
  if (!docs.length) return null;

  const allSelected = docs.every((d) => selected.has(d.veninvoiceno));
  const someSelected = docs.some((d) => selected.has(d.veninvoiceno));

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
          Open AP Invoices
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11, color: "#166534", fontWeight: 600, userSelect: "none" }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={(e) => onSelectAll(e.target.checked)}
            style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#166534" }}
          />
          Select All
        </label>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={thStyle}></th>
            <th style={thStyle}>Age</th>
            <th style={thStyle}>Invoice #</th>
            <th style={thStyle}>Date</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Balance</th>
            <th style={{ ...thStyle, textAlign: "right", width: 80 }}>Apply</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const days = ageDays(doc.veninvoicedate);
            const isChecked = selected.has(doc.veninvoiceno);
            const applyAmt = selected.get(doc.veninvoiceno) ?? 0;
            return (
              <tr key={doc.veninvoiceno} style={{ background: isChecked ? "#f0fdf4" : "transparent", borderBottom: "1px solid #f1f5f9" }}>
                <td style={tdStyle}>
                  <input type="checkbox" checked={isChecked} onChange={() => onToggle(doc.veninvoiceno, Math.abs(doc.veninvamtbalance))} style={{ cursor: "pointer" }} />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <AgeDot days={days} />
                    <AgeBadge days={days} />
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: "#166534" }}>{doc.veninvoiceno}</span>
                </td>
                <td style={tdStyle}>{dayjs(doc.veninvoicedate).format("MMM D, YY")}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(Math.abs(doc.veninvoicetotal))}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt(Math.abs(doc.veninvamtbalance))}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {isChecked ? (
                    <input
                      type="number"
                      min={0}
                      max={Math.abs(doc.veninvamtbalance)}
                      step="0.01"
                      value={applyAmt}
                      onChange={(e) => onAmountChange(doc.veninvoiceno, Math.min(Number(e.target.value), Math.abs(doc.veninvamtbalance)))}
                      style={{ width: 72, textAlign: "right", fontSize: 11, border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 4px" }}
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

// ─── Credit Row ──────────────────────────────────────────────────────────────

const CreditRow = ({
  doc,
  checked,
  amount,
  maxAmount,
  onToggle,
  onAmountChange,
}: {
  doc: APDoc;
  checked: boolean;
  amount: number;
  maxAmount: number;
  onToggle: () => void;
  onAmountChange: (v: number) => void;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>
    <input type="checkbox" checked={checked} onChange={onToggle} style={{ cursor: "pointer" }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontWeight: 600, color: "#166534" }}>{doc.veninvoiceno}</span>
      <span style={{ color: "#64748b", marginLeft: 4 }}>Vendor Credit</span>
    </div>
    <span style={{ color: "#16a34a", fontWeight: 600, minWidth: 56, textAlign: "right" }}>
      {fmt(Math.abs(doc.veninvamtbalance))}
    </span>
    {checked ? (
      <input
        type="number"
        min={0}
        max={maxAmount}
        step="0.01"
        value={amount}
        onChange={(e) => onAmountChange(Math.min(Number(e.target.value), maxAmount))}
        style={{ width: 68, textAlign: "right", fontSize: 11, border: "1px solid #86efac", borderRadius: 4, padding: "2px 4px", background: "#f0fdf4" }}
      />
    ) : (
      <span style={{ width: 68, textAlign: "right", color: "#94a3b8" }}>—</span>
    )}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface PaySupplierModalProps {
  storeId: number;
  outletId: number;
  closeModal: () => void;
}

const PaySupplierModal = ({ storeId, outletId, closeModal }: PaySupplierModalProps) => {
  const dispatch = useDispatch();

  const [supplierId, setSupplierId] = useState<number>(0);
  const [paymentModeid, setPaymentModeid] = useState<number>(0);
  const [paymentModeLabel, setPaymentModeLabel] = useState("");
  const [postingDate, setPostingDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [refNo, setRefNo] = useState("");
  const [reference, setReference] = useState("");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // string-keyed maps (veninvoiceno is a string)
  const [selectedInvoices, setSelectedInvoices] = useState<Map<string, number>>(new Map());
  const [selectedCredits, setSelectedCredits] = useState<Map<string, number>>(new Map());

  const [supplierMenuOpen, setSupplierMenuOpen] = useState(false);
  const [supplierInput, setSupplierInput] = useState("");

  // ── Supplier list ─────────────────────────────────────────────────────
  const { data: supplierListData, loading: suppliersLoading } = useQuery(GET_SUPPLIER_BY_OUTLET_ID_QUERY, {
    variables: { storeid: storeId, outletid: outletId },
    skip: !storeId || !outletId,
  });

  const supplierOptions = useMemo(() => {
    const all = (supplierListData?.getSupplierByOutletId ?? []) as any[];
    return all
      .filter((s) => Number(s.balancedue ?? 0) > 0 || Number(s.opencredit ?? 0) > 0)
      .map((s) => ({
        value: s.supplierid,
        label: s.companyname ?? `Supplier #${s.supplierid}`,
        companyname: s.companyname ?? `Supplier #${s.supplierid}`,
        supplierid: s.supplierid,
        balancedue: Number(s.balancedue ?? 0),
        opencredit: Number(s.opencredit ?? 0),
        lastpaymentdate: s.lastpaymentdate ?? null,
        lastpurchasedate: s.lastpurchasedate ?? null,
      }));
  }, [supplierListData]);

  const selectedSupplierOption = useMemo(
    () => supplierOptions.find((o) => o.value === supplierId) ?? null,
    [supplierOptions, supplierId]
  );

  // ── AP data queries ───────────────────────────────────────────────────
  const [fetchBalanceDue, { data: balanceData, loading: balanceLoading }] = useLazyQuery(GET_SUPPLIER_BALANCE_DUE_QUERY);
  const [fetchCreditSummary, { data: creditData, loading: creditLoading }] = useLazyQuery(GET_SUPPLIER_CREDIT_APPLY_SUMMARY_QUERY);

  useEffect(() => {
    if (!supplierId) return;
    fetchBalanceDue({ variables: { storeid: storeId, outletid: outletId, supplierid: supplierId } });
    fetchCreditSummary({ variables: { storeid: storeId, outletid: outletId, supplierid: supplierId } });
  }, [supplierId, storeId, outletId, fetchBalanceDue, fetchCreditSummary]);

  const openInvoices: APDoc[] = useMemo(
    () => ((balanceData?.getSupplierBalanceDue ?? []) as APDoc[]).filter((d) => (d.veninvamtbalance ?? 0) > 0),
    [balanceData]
  );
  const creditInvoices: APDoc[] = useMemo(
    () => (creditData?.getSupplierCreditApplySummary?.creditInvoices ?? []) as APDoc[],
    [creditData]
  );

  // ── Supplier change ───────────────────────────────────────────────────
  const handleSupplierChange = useCallback((id: number) => {
    setSupplierId(id);
    setSelectedInvoices(new Map());
    setSelectedCredits(new Map());
    setCashAmount(0);
    setRefNo("");
  }, []);

  // ── Toggle helpers ────────────────────────────────────────────────────
  const toggleItem = (map: Map<string, number>, setMap: React.Dispatch<React.SetStateAction<Map<string, number>>>, key: string, defaultAmount: number) => {
    setMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, defaultAmount);
      return next;
    });
  };

  const updateAmount = (map: Map<string, number>, setMap: React.Dispatch<React.SetStateAction<Map<string, number>>>, key: string, amount: number) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, amount);
      return next;
    });
  };

  // ── Live summary ──────────────────────────────────────────────────────
  const selectedTotal = useMemo(() => [...selectedInvoices.values()].reduce((s, v) => s + v, 0), [selectedInvoices]);
  const creditsTotal = useMemo(() => [...selectedCredits.values()].reduce((s, v) => s + v, 0), [selectedCredits]);
  const remaining = useMemo(() => selectedTotal - creditsTotal - cashAmount, [selectedTotal, creditsTotal, cashAmount]);

  const handleMax = () => {
    const afterCredits = Math.max(0, selectedTotal - creditsTotal);
    setCashAmount(Math.round(afterCredits * 100) / 100);
  };

  const isWriteOff = paymentModeLabel.toLowerCase().includes("write off") || paymentModeLabel.toLowerCase().includes("writeoff");

  // ── Mutations ─────────────────────────────────────────────────────────
  const [createCreditApply] = useMutation(CREATE_SUPPLIER_CREDIT_APPLY_MUTATION);
  const [createPayment] = useMutation(CREATE_SUPPLIER_NEW_PAYMENT_MUTATION);

  const canSave =
    supplierId > 0 &&
    selectedInvoices.size > 0 &&
    (creditsTotal > 0 || cashAmount > 0) &&
    remaining >= 0 &&
    (!isWriteOff || reference.trim().length > 0) &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const result = await handleTryCatch(async () => {
      for (const [creditNo, amount] of selectedCredits.entries()) {
        if (amount <= 0) continue;
        await createCreditApply({
          variables: {
            input: {
              storeid: storeId,
              supplierid: supplierId,
              outletid: outletId,
              postingdate: postingDate,
              creditInvoiceNumber: creditNo,
              amountToApply: amount,
              targetInvoiceNumbers: [...selectedInvoices.keys()],
              reference: reference || undefined,
            },
          },
        });
      }

      if (cashAmount > 0 && paymentModeid > 0) {
        await createPayment({
          variables: {
            input: {
              storeid: storeId,
              supplierid: supplierId,
              outletid: outletId,
              postingdate: postingDate,
              paymentmodeid: paymentModeid,
              chequeamount: cashAmount,
              chequecardno: refNo || undefined,
              invoicenumbers: [...selectedInvoices.keys()],
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

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: 1100 }}>
        <div className="modal-content" style={{ border: "none", borderRadius: 10, overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 8px", display: "flex", alignItems: "center" }}>
                <CreditCard size={16} color="#fff" />
              </div>
              <div>
                <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 15 }}>Pay Supplier</h5>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  Apply vendor credits and record payments against open AP invoices
                </div>
              </div>
            </div>
            <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={18} color="rgba(255,255,255,0.8)" />
            </button>
          </div>

          {/* Two-panel body */}
          <div style={{ display: "flex", minHeight: 500, maxHeight: "75vh" }}>

            {/* ─── LEFT PANEL ──────────────────────────────────────────── */}
            <div style={{ flex: "0 0 58%", overflowY: "auto", padding: "16px 18px", background: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>

              {/* Supplier select / selected card */}
              <div style={{ marginBottom: 12 }}>
                {!selectedSupplierOption ? (
                  <>
                    <SectionLabel>Supplier — showing accounts with open balance</SectionLabel>
                    <Select
                      isLoading={suppliersLoading}
                      options={supplierOptions}
                      placeholder="Search by name…"
                      isClearable
                      value={null}
                      onChange={(opt: any) => handleSupplierChange(opt?.value ? Number(opt.value) : 0)}
                      menuIsOpen={supplierMenuOpen}
                      onMenuOpen={() => setSupplierMenuOpen(true)}
                      onMenuClose={() => setSupplierMenuOpen(false)}
                      inputValue={supplierInput}
                      onInputChange={setSupplierInput}
                      filterOption={(candidate: any, raw: string) => {
                        const q = (raw || "").toLowerCase();
                        if (!q) return true;
                        return String(candidate.label || "").toLowerCase().includes(q) || String(candidate.value || "").includes(q);
                      }}
                      formatOptionLabel={(opt: any) => (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#94a3b8", fontSize: 10, minWidth: 36 }}>#{opt.supplierid}</span>
                            <span>{opt.companyname}</span>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 11, color: "#b45309", marginLeft: 12, whiteSpace: "nowrap" }}>
                            Owes ${opt.balancedue.toFixed(2)}
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
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "baseline", gap: 6 }}>
                        {selectedSupplierOption.companyname}
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>#{selectedSupplierOption.supplierid}</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309" }}>
                          Balance Payable: ${selectedSupplierOption.balancedue.toFixed(2)}
                        </span>
                        {selectedSupplierOption.lastpaymentdate && (
                          <span style={{ fontSize: 11, color: "#475569" }}>
                            Last payment: <strong>{dayjs(selectedSupplierOption.lastpaymentdate).format("MMM D, YYYY")}</strong>
                          </span>
                        )}
                        {selectedSupplierOption.lastpurchasedate && (
                          <span style={{ fontSize: 11, color: "#475569" }}>
                            Last purchase: <strong>{dayjs(selectedSupplierOption.lastpurchasedate).format("MMM D, YYYY")}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSupplierChange(0)}
                      style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#15803d", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Snapshot */}
              {supplierId > 0 && !dataLoading && (
                <SnapshotCard openInvoices={openInvoices} credits={creditInvoices} />
              )}

              {dataLoading && (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>Loading AP data…</div>
              )}

              {/* Open AP Invoices */}
              {supplierId > 0 && !dataLoading && (
                <>
                  <OpenItemsTable
                    docs={openInvoices}
                    selected={selectedInvoices}
                    onToggle={(no, bal) => toggleItem(selectedInvoices, setSelectedInvoices, no, bal)}
                    onAmountChange={(no, amt) => updateAmount(selectedInvoices, setSelectedInvoices, no, amt)}
                    onSelectAll={(select) => {
                      if (select) setSelectedInvoices(new Map(openInvoices.map((d) => [d.veninvoiceno, Math.abs(d.veninvamtbalance)])));
                      else setSelectedInvoices(new Map());
                    }}
                  />
                  {openInvoices.length === 0 && (
                    <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>
                      No open AP invoices for this supplier
                    </div>
                  )}
                </>
              )}

              {!supplierId && (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "#94a3b8", fontSize: 12 }}>
                  Select a supplier to view open AP invoices
                </div>
              )}
            </div>

            {/* ─── RIGHT PANEL ─────────────────────────────────────────── */}
            <div style={{ flex: "0 0 42%", padding: "16px 18px", background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Payment Details */}
              <div>
                <SectionLabel>Payment Details</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>Payment Mode</label>
                    <SelectPaymentMode
                      storeId={storeId}
                      value={paymentModeid}
                      setPaymentMode={setPaymentModeLabel}
                      trigger={() => {}}
                      onChange={(v: number) => setPaymentModeid(v)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>Posting Date</label>
                    <input
                      type="date"
                      value={postingDate}
                      onChange={(e) => setPostingDate(e.target.value)}
                      className="form-control"
                      style={{ fontSize: 12, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 3 }}>Check / Ref No</label>
                    <input
                      type="text"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      placeholder="Optional"
                      className="form-control"
                      style={{ fontSize: 12, height: 36 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: isWriteOff ? "#dc2626" : "#475569", display: "block", marginBottom: 3, fontWeight: isWriteOff ? 600 : 400 }}>
                      Memo / Notes{isWriteOff && <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>}
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={isWriteOff ? "Required for write-off" : "Optional"}
                      className="form-control"
                      style={{ fontSize: 12, height: 36, borderColor: isWriteOff && !reference.trim() ? "#dc2626" : undefined, outline: isWriteOff && !reference.trim() ? "1px solid #dc2626" : undefined }}
                    />
                    {isWriteOff && !reference.trim() && (
                      <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>Required when payment mode is Write Off</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Apply Vendor Credits */}
              {creditInvoices.length > 0 && (
                <div>
                  <SectionLabel>Apply Vendor Credits</SectionLabel>
                  <div style={{ fontSize: 10, color: "#166534", fontWeight: 600, marginBottom: 6 }}>
                    Vendor credit invoices — reduces amount payable to supplier
                  </div>
                  {creditInvoices.map((cr) => {
                    const invSelected = [...selectedInvoices.values()].reduce((s, v) => s + v, 0);
                    const maxAmt = Math.min(Math.abs(cr.veninvamtbalance), invSelected || Math.abs(cr.veninvamtbalance));
                    return (
                      <CreditRow
                        key={cr.veninvoiceno}
                        doc={cr}
                        checked={selectedCredits.has(cr.veninvoiceno)}
                        amount={selectedCredits.get(cr.veninvoiceno) ?? 0}
                        maxAmount={Math.max(0, maxAmt)}
                        onToggle={() => toggleItem(selectedCredits, setSelectedCredits, cr.veninvoiceno, Math.min(Math.abs(cr.veninvamtbalance), invSelected || Math.abs(cr.veninvamtbalance)))}
                        onAmountChange={(v) => updateAmount(selectedCredits, setSelectedCredits, cr.veninvoiceno, v)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <SectionLabel>Payment Amount</SectionLabel>
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
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#15803d", cursor: selectedTotal === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Live Summary */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
                  <SectionLabel>Summary</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                    <SummaryRow label="Invoices Selected" value={fmt(selectedTotal)} />
                    {creditsTotal > 0 && (
                      <SummaryRow label="Vendor Credits" value={`– ${fmt(creditsTotal)}`} valueColor="#16a34a" />
                    )}
                    {cashAmount > 0 && (
                      <SummaryRow
                        label={paymentModeLabel && paymentModeLabel !== "Cash" ? `${paymentModeLabel} Payment` : "Cash Payment"}
                        value={`– ${fmt(cashAmount)}`}
                        valueColor="#15803d"
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
                          Reduce payment amount or deselect an invoice
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button type="button" className="btn btn-cancel" onClick={closeModal} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-submit"
                    disabled={!canSave}
                    onClick={handleSave}
                    style={{ flex: 2, background: canSave ? "#15803d" : undefined }}
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

export default PaySupplierModal;
