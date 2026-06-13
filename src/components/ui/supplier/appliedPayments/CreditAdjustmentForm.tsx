"use client";

import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useMutation } from "@apollo/client";
import { CreditAdjustmentFormType, SupplierCreditInfo } from "@/types/supplier";
import useSupplier from "@/hooks/useSupplier";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectSupplierInvoice from "@/components/forms/SelectSupplierInvoice";
import ButtonLoader from "../../ButtonLoader";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CREATE_SUPPLIER_CREDIT_APPLY_MUTATION } from "@/lib/graphql/mutations/supplier";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const CreditAdjustmentForm = ({
  storeId,
  outletId,
  closePaymentModal,
}: {
  storeId: number;
  outletId: number;
  closePaymentModal: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    handleSubmit, control,
    formState: { errors, isValid },
    watch, setValue, trigger, register, getValues,
  } = useForm<CreditAdjustmentFormType>({
    defaultValues: {
      supplierid: 0, postingdate: dayjs(), paymentmodeid: 6,
      checkcardno: "", amount: "", invoicenumber: "", reference: "",
    },
    mode: "all",
  });

  const { fetchSupplierCreditApplySummary, supplierCreditInfo, supplierBalanceDue, loading } = useSupplier();
  const [autoApply, setAutoApply] = useState(false);
  const [createCreditApply, { loading: saving }] = useMutation(CREATE_SUPPLIER_CREDIT_APPLY_MUTATION);

  const supplierId = watch("supplierid");
  const selectedCreditInvoiceNo = watch("checkcardno");
  const selectedTargetInvoiceNo = watch("invoicenumber");
  const amountValue = Number(watch("amount") || 0);

  const onSupplierChangeFetch = async (value: string) => {
    const parsed = parseInt(value);
    setValue("supplierid", parsed as unknown as never);
    if (parsed) await fetchSupplierCreditApplySummary(storeId, outletId, parsed);
  };

  const creditInvoices = (supplierCreditInfo?.creditInvoices || []) as SupplierCreditInfo["creditInvoices"];
  const balanceDueInvoices = supplierCreditInfo?.balanceDueInvoices || [];

  const selectedCreditInvoice = useMemo(
    () => creditInvoices.find((c) => c.veninvoiceno === selectedCreditInvoiceNo),
    [creditInvoices, selectedCreditInvoiceNo]
  );

  React.useEffect(() => {
    if (selectedCreditInvoice) {
      setValue("amount", String(Math.abs(Number(selectedCreditInvoice.veninvamtbalance ?? 0))));
    } else {
      setValue("amount", "");
    }
  }, [selectedCreditInvoice, setValue]);

  const { allocations, unappliedAmount, allocatedAmount } = useMemo(() => {
    let remaining = amountValue;
    const allocArr: number[] = [];
    if (autoApply && amountValue > 0) {
      if (selectedTargetInvoiceNo) {
        balanceDueInvoices.forEach((row) => {
          if (row.veninvoiceno === selectedTargetInvoiceNo && remaining > 0) {
            const applied = Math.min(Number(row.veninvamtbalance), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        balanceDueInvoices.forEach((row) => {
          if (remaining > 0) {
            const applied = Math.min(Number(row.veninvamtbalance), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      }
    } else {
      balanceDueInvoices.forEach(() => allocArr.push(0));
    }
    const allocated = amountValue - remaining;
    return { allocations: allocArr, unappliedAmount: autoApply ? remaining : amountValue, allocatedAmount: autoApply ? allocated : 0 };
  }, [autoApply, amountValue, balanceDueInvoices, selectedTargetInvoiceNo]);

  const allocPct = amountValue > 0 ? Math.min(100, (allocatedAmount / amountValue) * 100) : 0;

  const onSubmit = async (formData: CreditAdjustmentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      outletid: outletId,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      creditInvoiceNumber: formData.checkcardno,
      amountToApply: Number(formData.amount),
      targetInvoiceNumbers: formData.invoicenumber ? [formData.invoicenumber] : [],
      reference: formData.reference,
    };

    const result = await handleTryCatch(async () => {
      const { data } = await createCreditApply({ variables: { input: payload } });
      if (data?.createSupplierCreditApply) {
        dispatch(showNotification({ message: data.createSupplierCreditApply.message, type: NOTIFICATION_TYPES.SUCCESS }));
        closePaymentModal();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const hasInvoices = !loading && supplierId && !!balanceDueInvoices.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* ── Section 1: Credit Details ──────────────────────────── */}
      <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 14 }}>
          Credit Details
        </div>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Supplier <span className="text-danger">*</span></label>
            <Controller
              control={control}
              name="supplierid"
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier trigger={trigger} storeId={storeId} {...field} onChangeAdditional={onSupplierChangeFetch} />
              )}
            />
            {errors.supplierid && <div className="invalid-feedback d-block">{errors.supplierid.message}</div>}
          </div>

          <div className={`col-12 ${!supplierId || loading ? "opacity-50 pe-none" : ""}`}>
            <div className="row g-3">
              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Posting Date <span className="text-danger">*</span></label>
                <Controller
                  control={control}
                  name="postingdate"
                  rules={{ required: "Posting date is required" }}
                  render={({ field }) => (
                    <DatePicker {...field} suffixIcon={<Calendar size={13} />} format="YYYY-MM-DD" className="form-control" />
                  )}
                />
                {errors.postingdate && <div className="invalid-feedback d-block">{errors.postingdate.message}</div>}
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Credit Invoice <span className="text-danger">*</span></label>
                <Controller
                  control={control}
                  name="checkcardno"
                  rules={{ required: "Credit invoice is required" }}
                  render={({ field }) => (
                    <SelectSupplierInvoice
                      trigger={trigger}
                      storeId={storeId}
                      supplierId={supplierId}
                      invoices={creditInvoices as unknown as any}
                      hasInvoices={true}
                      {...field}
                    />
                  )}
                />
                {errors.checkcardno && <div className="invalid-feedback d-block">{errors.checkcardno.message}</div>}
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Credit Amount</label>
                <div className="input-group">
                  <span className="input-group-text" style={{ fontSize: 13, color: "#64748b" }}>$</span>
                  <input
                    type="text"
                    className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                    {...register("amount", {
                      required: "Amount is required",
                      validate: (value) => {
                        if (!supplierCreditInfo) return true;
                        const val = Number(value);
                        const creditAmt = Math.abs(Number(selectedCreditInvoice?.veninvamtbalance ?? 0));
                        if (val > creditAmt) return "Amount exceeds credit invoice balance";
                        if (balanceDueInvoices.length > 0) {
                          if (getValues("invoicenumber")) {
                            const inv = balanceDueInvoices.find((i) => i.veninvoiceno === getValues("invoicenumber"));
                            if (inv && val > Number(inv.veninvamtbalance)) return "Amount exceeds selected invoice balance";
                          } else {
                            const total = balanceDueInvoices.reduce((a, c) => a + Number(c.veninvamtbalance), 0);
                            if (val > total) return "Amount exceeds total outstanding balance";
                          }
                        }
                        return true;
                      },
                    })}
                    disabled
                  />
                  {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
                </div>
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Apply to Invoice <span className="text-muted fw-normal">(optional)</span></label>
                <Controller
                  name="invoicenumber"
                  control={control}
                  render={({ field }) => (
                    <SelectSupplierInvoice
                      trigger={trigger}
                      storeId={storeId}
                      supplierId={supplierId}
                      invoices={balanceDueInvoices as unknown as any}
                      hasInvoices
                      onChangeAdditional={() => trigger()}
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Reference</label>
                <input type="text" className="form-control" {...register("reference")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Invoice Allocation ──────────────────────── */}
      {hasInvoices && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 14 }}>
            Invoice Allocation
          </div>

          {/* Allocation summary strip */}
          <div className="d-flex align-items-center justify-content-between gap-3 p-3 rounded-3 mb-3"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="d-flex align-items-center gap-2">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="creditAutoApplyToggle"
                  style={{ cursor: "pointer" }}
                  checked={autoApply}
                  onChange={async (e) => {
                    if (!e.target.checked) { setAutoApply(false); return; }
                    const valid = await trigger("amount");
                    if (valid) setAutoApply(true);
                  }}
                />
                <label className="form-check-label" htmlFor="creditAutoApplyToggle" style={{ fontSize: 13, cursor: "pointer" }}>
                  Auto-apply
                </label>
              </div>
            </div>
            <div className="d-flex gap-4">
              <div className="text-center">
                <div style={{ fontSize: 10, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.4px" }}>Allocated</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#d97706" }}>{fmt(allocatedAmount)}</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: 10, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.4px" }}>Unapplied</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: unappliedAmount > 0 ? "#b45309" : "#22c55e" }}>{fmt(unappliedAmount)}</div>
              </div>
            </div>
          </div>

          {amountValue > 0 && (
            <div className="mb-3" style={{ height: 4, background: "#fde68a", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${allocPct}%`, height: "100%", background: "#f59e0b", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          )}

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Invoice #</th>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Date</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Total</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Paid</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Balance</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#d97706", border: "none", background: "#fffbeb" }}>Applying</th>
                </tr>
              </thead>
              <tbody>
                {balanceDueInvoices.map((inv, idx) => {
                  const applying = allocations[idx] ?? 0;
                  return (
                    <tr key={inv.veninvoiceno} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="py-2 px-3" style={{ border: "none", fontWeight: 500 }}>{inv.veninvoiceno}</td>
                      <td className="py-2 px-3" style={{ border: "none", color: "#64748b" }}>{dayjs(inv.veninvoicedate).format(TIME_FORMAT)}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none" }}>{fmt(Number(inv.veninvoicetotal))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", color: "#64748b" }}>{fmt(Number(inv.veninvamtpaid))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", color: "#ef4444", fontWeight: 500 }}>{fmt(Number(inv.veninvamtbalance))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", background: applying > 0 ? "#fffbeb" : undefined, color: applying > 0 ? "#d97706" : "#94a3b8", fontWeight: applying > 0 ? 700 : 400 }}>
                        {fmt(applying)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="d-flex flex-column gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 36, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", borderRadius: 6, animation: "shimmer 1.4s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      {!!supplierId && !loading && (
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button type="button" className="btn btn-cancel me-2" onClick={closePaymentModal}>
            Cancel
          </button>
          <ButtonLoader
            loading={saving}
            btnText="Apply Credit"
            loadingText="Applying…"
            disabled={!isValid || saving}
            className="btn btn-submit"
          />
        </div>
      )}
    </form>
  );
};

export default CreditAdjustmentForm;
