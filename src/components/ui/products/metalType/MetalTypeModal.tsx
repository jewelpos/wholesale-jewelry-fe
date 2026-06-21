"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { Modal, Form } from "react-bootstrap";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  ADD_METAL_TYPE_MUTATION,
  EDIT_METAL_TYPE_MUTATION,
} from "@/lib/graphql/mutations/metalType";
import ButtonLoader from "../../ButtonLoader";
import { Layers } from "lucide-react";

export interface MetalTypeRow {
  metaltypeid: number;
  metalname: string;
  metalpercent?: number | null;
  metalstatus: string;
}

interface MetalTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: MetalTypeRow | null;
}

interface MetalTypeFormData {
  metalname: string;
  metalpercent: string;
  metalstatus: string;
}

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
    {children}{required && <span className="text-danger ms-1">*</span>}
  </label>
);

const MetalTypeModal: React.FC<MetalTypeModalProps> = ({ isOpen, onClose, onSuccess, editData }) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [addMetalType] = useMutation(ADD_METAL_TYPE_MUTATION);
  const [editMetalType] = useMutation(EDIT_METAL_TYPE_MUTATION);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MetalTypeFormData>({
    defaultValues: { metalname: "", metalpercent: "", metalstatus: "Active" },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setValue("metalname", editData.metalname || "");
      setValue("metalpercent", editData.metalpercent != null ? String(editData.metalpercent) : "");
      setValue("metalstatus", editData.metalstatus || "Active");
    } else {
      reset({ metalname: "", metalpercent: "", metalstatus: "Active" });
    }
  }, [isOpen, editData, setValue, reset]);

  const onSubmit: SubmitHandler<MetalTypeFormData> = async (formData) => {
    setLoading(true);
    const result = await handleTryCatch(async () => {
      const payload = {
        storeid: parsedStoreId,
        metalname: formData.metalname.trim(),
        metalpercent: formData.metalpercent ? parseFloat(formData.metalpercent) : null,
        metalstatus: formData.metalstatus,
      };
      if (editData) {
        const { data } = await editMetalType({ variables: { input: { ...payload, metaltypeid: editData.metaltypeid } } });
        if (data?.editMetalType?.success) {
          dispatch(showNotification({ message: data.editMetalType.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
      } else {
        const { data } = await addMetalType({ variables: { input: payload } });
        if (data?.addMetalType?.success) {
          dispatch(showNotification({ message: data.addMetalType.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
      }
      return true;
    });
    setLoading(false);
    if (result.error) dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 24px" }}>
        <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          {editData ? "Edit Metal Type" : "Add Metal Type"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body style={{ padding: "20px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "4px 0 16px" }}>
            <Layers size={13} strokeWidth={2} color="#6c757d" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6c757d", textTransform: "uppercase" }}>Metal Details</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#dee2e6" }} />
          </div>

          <div className="mb-3">
            <FieldLabel required>Metal Name</FieldLabel>
            <input
              type="text"
              className={`form-control form-control-sm ${errors.metalname ? "is-invalid" : ""}`}
              placeholder="e.g. 14Kt, 18Kt, Platinum"
              {...register("metalname", { required: "Metal name is required" })}
            />
            {errors.metalname && <div className="invalid-feedback">{errors.metalname.message}</div>}
          </div>

          <div className="mb-3">
            <FieldLabel>Default Metal %</FieldLabel>
            <div className="input-group input-group-sm">
              <input
                type="number"
                step="0.0001"
                min="0"
                max="100"
                className="form-control form-control-sm"
                placeholder="e.g. 75.0"
                {...register("metalpercent")}
              />
              <span className="input-group-text">%</span>
            </div>
            <small className="text-muted" style={{ fontSize: 11 }}>Optional — auto-fills Metal % field when this metal type is selected</small>
          </div>

          <div className="mb-2">
            <FieldLabel required>Status</FieldLabel>
            <select
              className="form-select form-select-sm"
              {...register("metalstatus", { required: true })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #f1f5f9", padding: "12px 24px" }}>
          <button type="button" className="btn btn-cancel me-2" onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <ButtonLoader
            loading={loading}
            btnText={editData ? "Update" : "Add Metal Type"}
            loadingText={editData ? "Updating..." : "Adding..."}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MetalTypeModal;
