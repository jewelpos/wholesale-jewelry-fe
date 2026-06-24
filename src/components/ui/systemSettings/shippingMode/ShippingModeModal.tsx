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
import { ADD_SHIPPING_MODE_MUTATION, EDIT_SHIPPING_MODE_MUTATION } from "@/lib/graphql/mutations/shippingMode";

export interface ShippingModeRow {
  shippingid: number;
  shippingname: string;
  shippingdescription?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: ShippingModeRow | null;
}

const ShippingModeModal = ({ isOpen, onClose, onSuccess, editData }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    shippingname: string;
    shippingdescription: string;
  }>();

  const [addShippingMode] = useMutation(ADD_SHIPPING_MODE_MUTATION);
  const [editShippingMode] = useMutation(EDIT_SHIPPING_MODE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        shippingname: editData?.shippingname ?? "",
        shippingdescription: editData?.shippingdescription ?? "",
      });
    }
  }, [isOpen, editData, reset]);

  const onSubmit = async (values: { shippingname: string; shippingdescription: string }) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await editShippingMode({
          variables: {
            input: { storeid: storeId, shippingid: editData.shippingid, ...values },
          },
        });
        dispatch(showNotification({ message: "Shipping mode updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await addShippingMode({
          variables: { input: { storeid: storeId, ...values } },
        });
        dispatch(showNotification({ message: "Shipping mode added", type: NOTIFICATION_TYPES.SUCCESS }));
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
            <h5 className="modal-title">{editData ? "Edit Shipping Mode" : "Add Shipping Mode"}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Shipping Name <span className="text-danger">*</span></label>
                <input
                  className={`form-control ${errors.shippingname ? "is-invalid" : ""}`}
                  placeholder="e.g. Standard Shipping"
                  {...register("shippingname", { required: "Shipping name is required" })}
                />
                {errors.shippingname && <div className="invalid-feedback">{errors.shippingname.message}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  placeholder="Optional description"
                  {...register("shippingdescription")}
                />
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

export default ShippingModeModal;
