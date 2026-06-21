"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    paymode: string;
    paymodedescription: string;
  }>();

  const [addPaymentMode] = useMutation(ADD_PAYMENT_MODE_MUTATION);
  const [editPaymentMode] = useMutation(EDIT_PAYMENT_MODE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        paymode: editData?.paymode ?? "",
        paymodedescription: editData?.paymodedescription ?? "",
      });
    }
  }, [isOpen, editData, reset]);

  const onSubmit = async (values: { paymode: string; paymodedescription: string }) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await editPaymentMode({
          variables: {
            input: { storeid: storeId, paymentmodeid: editData.paymentmodeid, ...values },
          },
        });
        dispatch(showNotification({ message: "Payment mode updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await addPaymentMode({
          variables: {
            input: { storeid: storeId, warehouseid: outletId, ...values },
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
                  placeholder="Optional description"
                  {...register("paymodedescription")}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editData ? "Update" : "Add"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModeModal;
