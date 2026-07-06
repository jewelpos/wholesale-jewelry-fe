"use client";

import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar, AlertTriangle } from "react-feather";
import ButtonLoader from "../../ButtonLoader";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import useSupplierPayment from "@/hooks/useSupplierPayment";
import SelectPayment from "@/components/forms/SelectPayment";
import SelectSupplier from "@/components/forms/SelectSupplier";
import { VoidPaymentFormType } from "@/types/supplier";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CREATE_SUPPLIER_VOIDED_PAYMENT_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useMutation } from "@apollo/client";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const fmt = (n: number) => formatCurrency(n);

const VoidPaymentForm = ({
  storeId,
  closePaymentModal,
  supplierid: supplierIdProp,
  paymentid: paymentIdProp,
}: {
  storeId: number;
  closePaymentModal: () => void;
  supplierid?: number;
  paymentid?: number;
}) => {
  const dispatch = useAppDispatch();
  const {
    fetchNonVoidedSupplierPaymentTransactionList,
    payments,
    loading: paymentLoading,
    fetchAppliedAmountListBySupplierPaymentId,
    appliedAmounts,
    appliedAmountsLoading,
  } = useSupplierPayment();

  const {
    handleSubmit, control, trigger,
    formState: { errors, isValid },
    watch,
  } = useForm<VoidPaymentFormType>({
    defaultValues: {
      supplierid: supplierIdProp ?? 0,
      postingdate: dayjs(),
      paymentid: paymentIdProp ?? 0,
    },
    mode: "all",
  });

  const [createSupplierVoidedPayment, { loading: saving }] = useMutation(CREATE_SUPPLIER_VOIDED_PAYMENT_MUTATION);

  const supplierId = watch("supplierid");
  const paymentId = watch("paymentid");

  const totalAppliedAmount = useMemo(
    () => appliedAmounts.reduce((sum, item) => sum + item.appliedamount, 0),
    [appliedAmounts]
  );

  useEffect(() => {
    if (paymentId) fetchAppliedAmountListBySupplierPaymentId(storeId, paymentId);
  }, [paymentId, fetchAppliedAmountListBySupplierPaymentId, storeId]);

  const onSubmit = async (formData: VoidPaymentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      paymentid: formData.paymentid.toString(),
    };

    const result = await handleTryCatch(async () => {
      const { data } = await createSupplierVoidedPayment({ variables: { input: payload } });
      if (data?.createSupplierVoidedPayment) {
        dispatch(showNotification({ message: data.createSupplierVoidedPayment.message, type: NOTIFICATION_TYPES.SUCCESS }));
        closePaymentModal();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const hasApplied = !paymentLoading && supplierId && (!!payments.length || !!paymentIdProp);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* ── Warning Banner ─────────────────────────────────────── */}
      <div className="d-flex align-items-start gap-2 p-3 rounded-3 mb-4"
        style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
        <AlertTriangle size={16} style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#b91c1c", lineHeight: 1.5 }}>
          <strong>This action cannot be undone.</strong> Voiding this payment will reverse all invoice allocations and restore the original balances.
        </div>
      </div>

      {/* ── Section 1: Payment Details ─────────────────────────── */}
      <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 14 }}>
          Payment to Void
        </div>
        <div className="row g-3">
          <div className="col-md-4 col-sm-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Supplier {!supplierIdProp && <span className="text-danger">*</span>}</label>
            {!supplierIdProp ? (
              <>
                <Controller
                  control={control}
                  name="supplierid"
                  rules={{ required: "Supplier is required" }}
                  render={({ field }) => (
                    <SelectSupplier
                      trigger={trigger}
                      storeId={storeId}
                      {...field}
                      onChangeAdditional={(value: number) => {
                        field.onChange(value);
                        if (value) fetchNonVoidedSupplierPaymentTransactionList(storeId, value);
                      }}
                    />
                  )}
                />
                {errors.supplierid && <div className="invalid-feedback d-block">{errors.supplierid.message}</div>}
              </>
            ) : (
              <input type="text" className="form-control" value={appliedAmounts[0]?.companyname || ""} disabled />
            )}
          </div>

          <div className={`col-md-4 col-sm-6 ${!hasApplied ? "opacity-50 pe-none" : ""}`}>
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Void Date <span className="text-danger">*</span></label>
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

          <div className={`col-md-4 col-sm-6 ${!hasApplied ? "opacity-50 pe-none" : ""}`}>
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Transaction # <span className="text-danger">*</span></label>
            {paymentIdProp ? (
              <input type="text" className="form-control" value={paymentIdProp} disabled />
            ) : (
              <>
                <Controller
                  control={control}
                  name="paymentid"
                  rules={{ required: "Payment is required" }}
                  render={({ field }) => (
                    <SelectPayment
                      trigger={trigger}
                      storeId={storeId}
                      supplierId={supplierId}
                      hasPayments={true}
                      propsPayments={payments}
                      {...field}
                    />
                  )}
                />
                {errors.paymentid && <div className="invalid-feedback d-block">{errors.paymentid.message}</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Applied Invoices ─────────────────────────── */}
      {!appliedAmountsLoading && !!paymentId && !!appliedAmounts.length && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Applied Invoices
            </div>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 12px" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.4px" }}>Total </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>{fmt(totalAppliedAmount)}</span>
            </div>
          </div>

          <div style={{ border: "1px solid #fecaca", borderRadius: 8, overflow: "hidden" }}>
            <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#dc2626", border: "none" }}>Invoice #</th>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#dc2626", border: "none" }}>Applied Date</th>
                  <th className="py-2 px-3 text-end" style={{ fontWeight: 600, color: "#dc2626", border: "none" }}>Applied Amount</th>
                  <th className="py-2 px-3" style={{ fontWeight: 600, color: "#dc2626", border: "none" }}>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {appliedAmounts.map((item) => (
                  <tr key={item.appliedamountid} style={{ borderBottom: "1px solid #fef2f2" }}>
                    <td className="py-2 px-3" style={{ border: "none", fontWeight: 500 }}>{item.invoicenumber}</td>
                    <td className="py-2 px-3" style={{ border: "none", color: "#64748b" }}>{dayjs(Number(item.applieddate)).format(TIME_FORMAT)}</td>
                    <td className="py-2 px-3 text-end" style={{ border: "none", fontWeight: 600, color: "#dc2626" }}>{fmt(item.appliedamount)}</td>
                    <td className="py-2 px-3" style={{ border: "none" }}>
                      <span style={{ background: "#f1f5f9", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#64748b" }}>
                        {item.paymode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {appliedAmountsLoading && (
        <div className="d-flex flex-column gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 36, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", borderRadius: 6, animation: "shimmer 1.4s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      {!paymentLoading && !!supplierId && !!appliedAmounts.length && (
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button type="button" className="btn btn-cancel me-2" onClick={closePaymentModal}>
            Cancel
          </button>
          <ButtonLoader
            loading={saving}
            btnText="Void Payment"
            loadingText="Voiding…"
            disabled={!isValid || saving}
            className="btn btn-submit"
          />
        </div>
      )}
    </form>
  );
};

export default VoidPaymentForm;
