"use client";

import React, { useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import useSupplier from "@/hooks/useSupplier";
import { NewPaymentFormType } from "@/types/supplier";
import { CREATE_SUPPLIER_NEW_PAYMENT_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import SelectSupplier from "@/components/forms/SelectSupplier";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import SelectSupplierInvoice from "@/components/forms/SelectSupplierInvoice";
import ButtonLoader from "../../ButtonLoader";
import { handleKeyDownAllowNumberOnly } from "@/lib/utils/utils";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmt = (n: number) => formatCurrency(n);

const NewPaymentForm = ({
  storeId,
  closePaymentModal,
  outletId,
}: {
  storeId: number;
  closePaymentModal: () => void;
  outletId: number;
}) => {
  const { fetchSupplierBalanceDue, supplierBalanceDue, loading: invoiceLoading } = useSupplier();
  const {
    handleSubmit, control, trigger,
    formState: { errors, isValid },
    register, getValues, watch,
  } = useForm<NewPaymentFormType>({
    defaultValues: {
      supplierid: 0, postingdate: dayjs(), paymentmodeid: 0,
      checkcardno: "", amount: "", invoicenumber: "", reference: "",
    },
    mode: "all",
  });

  const supplierId = getValues("supplierid");
  const [autoApply, setAutoApply] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const dispatch = useDispatch();
  const [createPayment, { loading: saving }] = useMutation(CREATE_SUPPLIER_NEW_PAYMENT_MUTATION);

  const amountValue = Number(watch("amount") || 0);
  const selectedInvoiceNo = watch("invoicenumber");

  const { allocations, unappliedAmount, allocatedAmount } = useMemo(() => {
    let remaining = amountValue;
    const allocArr: number[] = [];

    if (autoApply && amountValue > 0) {
      if (selectedInvoiceNo) {
        supplierBalanceDue.forEach((row) => {
          if (row.veninvoiceno === selectedInvoiceNo && remaining > 0) {
            const applied = Math.min(row.veninvamtbalance, remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        supplierBalanceDue.forEach((row) => {
          if (remaining > 0) {
            const applied = Math.min(row.veninvamtbalance, remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      }
    } else {
      supplierBalanceDue.forEach(() => allocArr.push(0));
    }

    const allocated = amountValue - remaining;
    return { allocations: allocArr, unappliedAmount: autoApply ? remaining : amountValue, allocatedAmount: autoApply ? allocated : 0 };
  }, [autoApply, amountValue, supplierBalanceDue, selectedInvoiceNo]);

  const allocPct = amountValue > 0 ? Math.min(100, (allocatedAmount / amountValue) * 100) : 0;

  const onSubmit = async (formData: NewPaymentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      paymentmodeid: formData.paymentmodeid,
      chequecardno: formData.checkcardno,
      chequeamount: Number(formData.amount),
      invoicenumbers: formData.invoicenumber ? [formData.invoicenumber] : [],
      reference: formData.reference,
    };

    const result = await handleTryCatch(async () => {
      const { data } = await createPayment({ variables: { input: payload } });
      if (data?.createSupplierNewPayment) {
        dispatch(showNotification({ message: data.createSupplierNewPayment.message, type: NOTIFICATION_TYPES.SUCCESS }));
        closePaymentModal();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const hasInvoices = !invoiceLoading && supplierId && !!supplierBalanceDue.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* ── Section 1: Payment Details ─────────────────────────── */}
      <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 14 }}>
          Payment Details
        </div>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Supplier <span className="text-danger">*</span></label>
            <Controller
              name="supplierid"
              control={control}
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier
                  className={errors.supplierid ? "is-invalid" : ""}
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                  onChangeAdditional={(value: string) => {
                    field.onChange(value);
                    if (value) fetchSupplierBalanceDue(storeId, outletId, parseInt(value));
                  }}
                />
              )}
            />
            {errors.supplierid && <div className="invalid-feedback d-block">{errors.supplierid.message}</div>}
          </div>

          <div className={`col-12 ${!hasInvoices ? "opacity-50 pe-none" : ""}`}>
            <div className="row g-3">
              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Posting Date</label>
                <Controller
                  name="postingdate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker {...field} suffixIcon={<Calendar size={13} />} format="YYYY-MM-DD" className="form-control" allowClear={false} />
                  )}
                />
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Payment Mode <span className="text-danger">*</span></label>
                <Controller
                  name="paymentmodeid"
                  control={control}
                  rules={{ required: "Payment Mode is required" }}
                  render={({ field }) => (
                    <SelectPaymentMode
                      className={errors.paymentmodeid ? "is-invalid" : ""}
                      trigger={trigger}
                      storeId={storeId}
                      setPaymentMode={setPaymentMode}
                      {...field}
                    />
                  )}
                />
                {errors.paymentmodeid && <div className="invalid-feedback d-block">{errors.paymentmodeid.message}</div>}
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Check / Card No {paymentMode !== "Cash" && <span className="text-danger">*</span>}
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.checkcardno ? "is-invalid" : ""}`}
                  {...register("checkcardno", { required: paymentMode !== "Cash" ? "Check/Card No is required" : false })}
                />
                {errors.checkcardno && <div className="invalid-feedback">{errors.checkcardno.message}</div>}
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Amount <span className="text-danger">*</span></label>
                <Controller
                  name="amount"
                  control={control}
                  rules={{
                    required: "Amount is required",
                    validate: (value) => {
                      if (!supplierBalanceDue.length) return true;
                      if (selectedInvoiceNo) {
                        const inv = supplierBalanceDue.find((i) => i.veninvoiceno === selectedInvoiceNo);
                        if (inv && Number(value) > Number(inv.veninvamtbalance)) return "Amount exceeds selected invoice balance";
                      } else {
                        const total = supplierBalanceDue.reduce((a, c) => a + Number(c.veninvamtbalance), 0);
                        if (Number(value) > total) return "Amount exceeds total outstanding balance";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                      {...field}
                      onChange={(e) => { field.onChange(e.target.value); setAutoApply(false); }}
                      onKeyDown={handleKeyDownAllowNumberOnly}
                    />
                  )}
                />
                {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
              </div>

              <div className="col-md-4 col-sm-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Invoice # <span className="text-muted fw-normal">(optional)</span></label>
                <Controller
                  name="invoicenumber"
                  control={control}
                  render={({ field }) => (
                    <SelectSupplierInvoice
                      storeId={storeId}
                      supplierId={supplierId}
                      trigger={trigger}
                      invoices={supplierBalanceDue}
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
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="d-flex align-items-center gap-2">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoApplyToggle"
                  style={{ cursor: "pointer" }}
                  checked={autoApply}
                  onChange={async (e) => {
                    if (!e.target.checked) { setAutoApply(false); return; }
                    const valid = await trigger("amount");
                    if (valid) setAutoApply(true);
                  }}
                />
                <label className="form-check-label" htmlFor="autoApplyToggle" style={{ fontSize: 13, cursor: "pointer" }}>
                  Auto-apply
                </label>
              </div>
            </div>
            <div className="d-flex gap-4">
              <div className="text-center">
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>Allocated</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6" }}>{fmt(allocatedAmount)}</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px" }}>Unapplied</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: unappliedAmount > 0 ? "#f59e0b" : "#22c55e" }}>{fmt(unappliedAmount)}</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {amountValue > 0 && (
            <div className="mb-3" style={{ height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${allocPct}%`, height: "100%", background: "#3b82f6", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          )}

          {/* Invoice table */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Invoice #</th>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Date</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Total</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Paid</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#64748b", border: "none" }}>Balance</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#3b82f6", border: "none", background: "#eff6ff" }}>Applying</th>
                </tr>
              </thead>
              <tbody>
                {supplierBalanceDue.map((item, idx) => {
                  const applying = allocations[idx] ?? 0;
                  return (
                    <tr key={item.veninvoiceno} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="py-2 px-3" style={{ border: "none", fontWeight: 500 }}>{item.veninvoiceno}</td>
                      <td className="py-2 px-3" style={{ border: "none", color: "#64748b" }}>{dayjs(Number(item.veninvoicedate)).format(TIME_FORMAT)}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none" }}>{fmt(Number(item.veninvoicetotal))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", color: "#64748b" }}>{fmt(Number(item.veninvamtpaid))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", color: "#ef4444", fontWeight: 500 }}>{fmt(Number(item.veninvamtbalance))}</td>
                      <td className="py-2 px-3 text-end" style={{ border: "none", background: applying > 0 ? "#eff6ff" : undefined, color: applying > 0 ? "#3b82f6" : "#94a3b8", fontWeight: applying > 0 ? 700 : 400 }}>
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

      {invoiceLoading && (
        <div className="d-flex flex-column gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 36, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", borderRadius: 6, animation: "shimmer 1.4s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      {hasInvoices && (
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button type="button" className="btn btn-cancel me-2" onClick={closePaymentModal}>
            Cancel
          </button>
          <ButtonLoader
            loading={saving}
            btnText="Apply Payment"
            loadingText="Applying…"
            disabled={!isValid || saving}
            className="btn btn-submit"
          />
        </div>
      )}
    </form>
  );
};

export default NewPaymentForm;
