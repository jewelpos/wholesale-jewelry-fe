"use client";

import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { AlertTriangle, Calendar, X } from "react-feather";
import { useLazyQuery, useMutation } from "@apollo/client";

import LabelLoader from "../../LabelLoader";
import PlaceHolder from "../../PlaceHolder";
import ButtonLoader from "../../ButtonLoader";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { VOID_CUSTOMER_PAYMENT_MUTATION } from "@/lib/graphql/mutations/customer";
import { GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY } from "@/lib/graphql/query/customer";
import { CustomerCheckAppliedAmount } from "@/types/customer";

type VoidCustomerPaymentFormType = {
  postingdate: dayjs.Dayjs;
};

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ marginBottom: 0 }}>
    <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{value}</div>
  </div>
);

const VoidCustomerPaymentForm = ({
  storeId,
  closePaymentModal,
  customerpaymentid,
  transactionno,
  custcompanyname,
  amountpaid,
  paymode,
  paymentdate,
}: {
  storeId: number;
  closePaymentModal: () => void;
  customerpaymentid: number;
  transactionno: string;
  custcompanyname: string;
  amountpaid?: number;
  paymode?: string;
  paymentdate?: string | Date;
}) => {
  const dispatch = useAppDispatch();

  const [getAppliedAmounts, { data: appliedData, loading: appliedLoading }] =
    useLazyQuery(GET_CUSTOMER_APPLIED_AMOUNT_LIST_QUERY);

  const [voidCustomerPayment, { loading: saving }] = useMutation(VOID_CUSTOMER_PAYMENT_MUTATION);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<VoidCustomerPaymentFormType>({
    defaultValues: { postingdate: dayjs() },
    mode: "all",
  });

  const appliedAmounts: CustomerCheckAppliedAmount[] = useMemo(
    () => appliedData?.getCustomerAppliedAmountList || [],
    [appliedData]
  );

  const totalAppliedAmount = useMemo(
    () => appliedAmounts.reduce((sum, item) => sum + Number(item.appliedamount || 0), 0),
    [appliedAmounts]
  );

  const parsedCustomerPaymentsId = useMemo(() => {
    const v = parseInt(String(transactionno), 10);
    return Number.isFinite(v) ? v : 0;
  }, [transactionno]);

  useEffect(() => {
    if (parsedCustomerPaymentsId && storeId) {
      getAppliedAmounts({
        variables: { storeid: storeId, customerpaymentsid: parsedCustomerPaymentsId },
        fetchPolicy: "no-cache",
      });
    }
  }, [getAppliedAmounts, parsedCustomerPaymentsId, storeId]);

  const onSubmit = async (formData: VoidCustomerPaymentFormType) => {
    const result = await handleTryCatch(async () => {
      const response = await voidCustomerPayment({
        variables: {
          input: {
            storeid: storeId,
            customerpaymentid,
            postingdate: formData.postingdate.format("YYYY-MM-DD"),
          },
        },
      });
      const { data } = response;
      if (data?.voidCustomerPayment) {
        const successData = data.voidCustomerPayment;
        dispatch(showNotification({
          message: successData.message,
          type: successData.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
        }));
        if (successData.success) closePaymentModal();
      }
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 620 }}>
        <div className="modal-content" style={{ border: "none", borderRadius: 10, overflow: "hidden" }}>

          {/* Blue header — same design as Receive Payment */}
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
                <AlertTriangle size={16} color="#fff" />
              </div>
              <div>
                <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 15 }}>Void Payment</h5>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  Reverse a recorded payment — this action cannot be undone
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closePaymentModal}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <X size={18} color="rgba(255,255,255,0.8)" />
            </button>
          </div>

          <div style={{ padding: "20px 24px" }}>
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Warning banner */}
      <div
        className="d-flex align-items-center gap-2 mb-3 p-3 rounded"
        style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
      >
        <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#991b1b" }}>
          Voiding this payment will reverse all applied invoice amounts. <strong>This action cannot be undone.</strong>
        </span>
      </div>

      {/* Payment info panel */}
      <div
        className="p-3 rounded mb-3"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 600, marginBottom: 10 }}>
          Payment Being Voided
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <InfoField label="Customer" value={custcompanyname} />
          </div>
          <div className="col-6 col-md-3">
            <InfoField label="Transaction #" value={transactionno} />
          </div>
          <div className="col-6 col-md-3">
            <InfoField
              label="Payment Date"
              value={paymentdate ? dayjs(paymentdate).format("MM/DD/YYYY") : "—"}
            />
          </div>
          <div className="col-6 col-md-3">
            <InfoField label="Mode" value={paymode || "—"} />
          </div>
          <div className="col-6 col-md-3">
            <InfoField
              label="Amount Paid"
              value={
                <span style={{ color: "#166534" }}>${fmt(amountpaid ?? totalAppliedAmount)}</span>
              }
            />
          </div>
          <div className="col-6 col-md-3">
            <InfoField
              label="Total Applied"
              value={appliedLoading ? "Loading…" : <span style={{ color: "#166534" }}>${fmt(totalAppliedAmount)}</span>}
            />
          </div>
        </div>
      </div>

      {/* Posting date */}
      <div className="row mb-3">
        <div className="col-lg-4 col-md-6">
          <div className="input-blocks">
            <LabelLoader label="Void Posting Date" loading={false} required />
            <Controller
              control={control}
              name="postingdate"
              rules={{ required: "Posting date is required" }}
              render={({ field }) => (
                <DatePicker
                  suffixIcon={<Calendar size={14} />}
                  format="MM/DD/YYYY"
                  className="form-control"
                  {...field}
                />
              )}
            />
            {errors.postingdate && (
              <div className="invalid-feedback d-block">{errors.postingdate.message}</div>
            )}
          </div>
        </div>
      </div>

      {/* Applied invoices table */}
      {appliedLoading && [1, 2, 3].map((i) => <PlaceHolder key={i} />)}

      {!appliedLoading && appliedAmounts.length > 0 && (
        <div className="mb-3">
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>
            Applied Invoices
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Invoice #", "Applied Date", "Amount", "Type"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #cbd5e1",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "#475569",
                      textAlign: h === "Amount" ? "right" : "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appliedAmounts.map((item, i) => (
                <tr key={item.customercheckappliedamountid} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0" }}>{item.invoicenumber}</td>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    {item.applieddate ? dayjs(item.applieddate).format("MM/DD/YYYY") : ""}
                  </td>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0", textAlign: "right", color: "#166534", fontWeight: 600 }}>
                    {fmt(item.appliedamount)}
                  </td>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0" }}>
                    {item.iscreditinvoice ? (
                      <span style={{ fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                        Credit
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                        Payment
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f1f5f9" }}>
                <td colSpan={2} style={{ padding: "6px 10px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "#475569" }}>
                  Total
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #cbd5e1", textAlign: "right", fontWeight: 700, color: "#166534" }}>
                  {fmt(totalAppliedAmount)}
                </td>
                <td style={{ border: "1px solid #cbd5e1" }} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Footer */}
      {!appliedLoading && appliedAmounts.length > 0 && (
        <div className="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
          <button type="button" className="btn btn-secondary" onClick={closePaymentModal}>
            Cancel
          </button>
          <ButtonLoader
            loading={saving}
            btnText="Void Payment"
            loadingText="Voiding..."
            disabled={!isValid || saving}
            className="btn btn-danger"
          />
        </div>
      )}
    </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoidCustomerPaymentForm;
