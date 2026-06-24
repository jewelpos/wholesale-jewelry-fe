"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { X, Check, RefreshCw } from "react-feather";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { CREATE_WAREHOUSE_MUTATION, UPDATE_WAREHOUSE_MUTATION } from "@/lib/graphql/mutations/warehouseSettings";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";

export interface WarehouseRow {
  warehouseid: number;
  outletid: number;
  warehousename: string;
  warehouseaddress: string | null;
  warehousephone: string | null;
  issystem: boolean;
  isdeletedat: string | null;
}

interface FormValues {
  outletid: number;
  warehousename: string;
  warehouseaddress: string;
  warehousephone: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: WarehouseRow | null;
}

const WarehouseModal = ({ isOpen, onClose, onSuccess, editData }: Props) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data: outletData } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: parsedOutletId },
    skip: !parsedOutletId || !!editData,
  });

  const [createWarehouse] = useMutation(CREATE_WAREHOUSE_MUTATION);
  const [updateWarehouse] = useMutation(UPDATE_WAREHOUSE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        outletid: editData?.outletid ?? parsedOutletId,
        warehousename: editData?.warehousename ?? "",
        warehouseaddress: editData?.warehouseaddress ?? "",
        warehousephone: editData?.warehousephone ?? "",
      });
    }
  }, [isOpen, editData, reset, parsedOutletId]);

  const onSubmit = async (values: FormValues) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await updateWarehouse({
          variables: {
            storeid: storeId,
            input: {
              warehouseid: editData.warehouseid,
              warehousename: values.warehousename,
              warehouseaddress: values.warehouseaddress || null,
              warehousephone: values.warehousephone || null,
            },
          },
        });
        dispatch(showNotification({ message: "Warehouse updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await createWarehouse({
          variables: {
            storeid: storeId,
            input: {
              outletid: Number(values.outletid),
              warehousename: values.warehousename,
              warehouseaddress: values.warehouseaddress || null,
              warehousephone: values.warehousephone || null,
            },
          },
        });
        dispatch(showNotification({ message: "Warehouse created", type: NOTIFICATION_TYPES.SUCCESS }));
      }
      onSuccess();
      onClose();
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  if (!isOpen) return null;

  const outletWarehouses: { warehouseid: number; warehousename: string }[] = outletData?.getWarehousesByOutletId ?? [];

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editData ? "Edit Warehouse" : "Add Warehouse"}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Warehouse Name <span className="text-danger">*</span></label>
                <input
                  className={`form-control ${errors.warehousename ? "is-invalid" : ""}`}
                  placeholder="e.g. Main Warehouse"
                  {...register("warehousename", { required: "Warehouse name is required" })}
                />
                {errors.warehousename && <div className="invalid-feedback">{errors.warehousename.message}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Address</label>
                <input
                  className="form-control"
                  placeholder="Optional warehouse address"
                  {...register("warehouseaddress")}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  placeholder="Optional phone number"
                  {...register("warehousephone")}
                />
              </div>

              {editData && (
                <div className="mb-1">
                  <span className="badge bg-secondary" style={{ fontSize: 11 }}>
                    {editData.issystem ? "System Warehouse" : "User Warehouse"}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-cancel me-2" onClick={onClose}>
                <X size={14} className="me-1" />Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {editData ? <><RefreshCw size={14} className="me-1" />Update</> : <><Check size={14} className="me-1" />Add Warehouse</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WarehouseModal;
