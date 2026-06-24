"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { X, Check, RefreshCw } from "react-feather";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { ADD_PAYMENT_MODE_MUTATION, EDIT_PAYMENT_MODE_MUTATION } from "@/lib/graphql/mutations/paymentMode";

export interface PaymentModeRow {
  paymentmodeid: number;
  paymode: string;
  paymodedescription: string;
  warehouseid: number;
  createddate: string;
  displayorder: number;
  status: string;
}

interface FormValues {
  paymode: string;
  paymodedescription: string;
  displayorder: number;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: PaymentModeRow | null;
  outletId: number;
}

const PaymentModeModal = ({ isOpen, onClose, onSuccess, editData, outletId }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const [addPaymentMode] = useMutation(ADD_PAYMENT_MODE_MUTATION);
  const [editPaymentMode] = useMutation(EDIT_PAYMENT_MODE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        paymode: editData?.paymode ?? "",
        paymodedescription: editData?.paymodedescription ?? "",
        displayorder: editData?.displayorder ?? 0,
        status: editData?.status ?? "Active",
      });
    }
  }, [isOpen, editData, reset]);

  const onSubmit = async (values: FormValues) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await editPaymentMode({
          variables: {
            input: {
              storeid: storeId,
              paymentmodeid: editData.paymentmodeid,
              paymode: values.paymode,
              paymodedescription: values.paymodedescription,
              displayorder: Number(values.displayorder),
              status: values.status,
            },
          },
        });
        dispatch(showNotification({ message: "Payment mode updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await addPaymentMode({
          variables: {
            input: {
              storeid: storeId,
              warehouseid: outletId,
              paymode: values.paymode,
              paymodedescription: values.paymodedescription,
              displayorder: Number(values.displayorder),
              status: values.status,
            },
          },
        });
        dispatch(showNotification({ message: "Payment mode added", type: NOTIFICATION_TYPES.SUCCESS }));
      }
      onSuccess();
      onClose();
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editData ? "Edit Payment Mode" : "Add Payment Mode"}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Payment Mode <span className="text-danger">*</span></label>
                <input
                  className={`form-control ${errors.paymode ? "is-invalid" : ""}`}
                  placeholder="e.g. Cash, Credit Card, Bank Transfer"
                  {...register("paymode", { required: "Payment mode name is required" })}
                />
                {errors.paymode && <div className="invalid-feedback">{errors.paymode.message}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  placeholder="Optional description shown in dropdown"
                  {...register("paymodedescription")}
                />
              </div>

              <div className="row g-3">
                <div className="col-5">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="1, 2, 3…"
                    {...register("displayorder", { valueAsNumber: true })}
                  />
                  <div className="form-text" style={{ fontSize: 11 }}>Lower number appears first</div>
                </div>
                <div className="col-7">
                  <label className="form-label">Status</label>
                  <select className="form-select" {...register("status")}>
                    <option value="Active">Active — shown in dropdowns</option>
                    <option value="Inactive">Inactive — hidden from dropdowns</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel me-2" onClick={onClose}>
                <X size={14} className="me-1" />Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {editData ? <><RefreshCw size={14} className="me-1" />Update</> : <><Check size={14} className="me-1" />Add</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModeModal;
