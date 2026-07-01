"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "react-feather";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { useParams } from "next/navigation";
import { ADD_SUPPLIER_INVOICE_MUTATION } from "@/lib/graphql/mutations/supplier";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { SupplierInvoiceFormType } from "@/types/supplier";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import ButtonLoader from "@/components/ui/ButtonLoader";
import useWarehouse from "@/hooks/useWarehouse";

export interface POSupplierInvoiceInitialData {
  supplierid: number;
  supplierName: string;
  veninvoiceno: string;
  refponumber: string;
  veninvoicetotal: string;
  termsid: number;
}

interface Props {
  storeId: number;
  initialData: POSupplierInvoiceInitialData;
  onDone: () => void;
}

const LABEL: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#6b7280",
  marginBottom: 4,
  display: "block",
};

const POSupplierInvoiceModal = ({ storeId, initialData, onDone }: Props) => {
  const dispatch = useDispatch();
  const { outletId } = useParams();
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const systemWarehouse = warehouses.find((w) => w.issystem);

  const [createInvoice, { loading: saving }] = useMutation(ADD_SUPPLIER_INVOICE_MUTATION);

  const { register, handleSubmit, control, setValue, trigger, formState: { errors } } =
    useForm<SupplierInvoiceFormType>({
      defaultValues: {
        supplierid: String(initialData.supplierid),
        veninvoiceno: initialData.veninvoiceno,
        refponumber: initialData.refponumber,
        veninvoicetotal: initialData.veninvoicetotal,
        termsid: initialData.termsid || 1,
        veninvoicedate: dayjs(),
        warehouseid: "",
        storeid: storeId,
      },
      mode: "all",
    });

  useEffect(() => {
    if (outletId) fetchWarehouseByOutletId(Number(outletId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    if (systemWarehouse) setValue("warehouseid", String(systemWarehouse.warehouseid));
  }, [systemWarehouse, setValue]);

  const onSubmit = async (formData: SupplierInvoiceFormType) => {
    const result = await handleTryCatch(async () => {
      const payload = {
        storeid: storeId,
        supplierid: Number(formData.supplierid),
        warehouseid: Number(formData.warehouseid),
        veninvoiceno: formData.veninvoiceno,
        refponumber: formData.refponumber ? Number(formData.refponumber) : undefined,
        veninvoicedate: (formData.veninvoicedate as Dayjs).format("YYYY-MM-DD"),
        termsid: Number(formData.termsid),
        veninvoicetotal: Number(formData.veninvoicetotal),
      };

      const response = await createInvoice({ variables: { input: payload } });
      const successData = response.data?.createSupplierInvoice;
      if (successData) {
        dispatch(showNotification({
          message: successData.message,
          type: successData.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
        }));
        if (successData.success) {
          onDone();
        }
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050 }}
        onClick={onDone}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(560px, 96vw)",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
          color: "#fff",
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>New AP Invoice</div>
            <div style={{ fontSize: 11, color: "#bbf7d0", marginTop: 2 }}>Accounts Payable · Pre-filled from PO</div>
          </div>
          <button
            type="button"
            onClick={onDone}
            style={{ background: "none", border: "none", color: "#bbf7d0", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Supplier (read-only display) */}
            <div>
              <label style={LABEL}>Supplier</label>
              <input
                className="form-control"
                value={initialData.supplierName || `Supplier #${initialData.supplierid}`}
                readOnly
                style={{ background: "#f8f9fa" }}
              />
              <input type="hidden" {...register("supplierid")} />
            </div>

            <div className="row g-3">
              {/* Invoice # */}
              <div className="col-6">
                <label style={LABEL}>Invoice # *</label>
                <input
                  {...register("veninvoiceno", { required: "Invoice # is required" })}
                  className={`form-control ${errors.veninvoiceno ? "is-invalid" : ""}`}
                  placeholder="Invoice number"
                />
                {errors.veninvoiceno && (
                  <div className="invalid-feedback">{errors.veninvoiceno.message}</div>
                )}
              </div>

              {/* Ref PO # */}
              <div className="col-6">
                <label style={LABEL}>Ref PO #</label>
                <input
                  {...register("refponumber")}
                  className="form-control"
                  placeholder="PO reference"
                />
              </div>
            </div>

            <div className="row g-3">
              {/* Invoice Date */}
              <div className="col-6">
                <label style={LABEL}>Invoice Date *</label>
                <Controller
                  control={control}
                  name="veninvoicedate"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value as Dayjs || null}
                      onChange={(date) => field.onChange(date)}
                      className="filterdatepicker"
                      format="MM/DD/YYYY"
                      placeholder="Choose Date"
                      allowClear={false}
                      style={{ width: "100%" }}
                    />
                  )}
                />
              </div>

              {/* Amount */}
              <div className="col-6">
                <label style={LABEL}>Amount *</label>
                <input
                  {...register("veninvoicetotal", {
                    required: "Amount is required",
                    validate: (v) => Number(v) > 0 || "Must be > 0",
                  })}
                  type="number"
                  step="0.01"
                  min={0}
                  className={`form-control text-end ${errors.veninvoicetotal ? "is-invalid" : ""}`}
                  placeholder="0.00"
                />
                {errors.veninvoicetotal && (
                  <div className="invalid-feedback">{errors.veninvoicetotal.message}</div>
                )}
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label style={LABEL}>Payment Terms</label>
              <Controller
                control={control}
                name="termsid"
                render={({ field }) => (
                  <SelectPaymentTerms
                    storeId={storeId}
                    value={field.value}
                    onChange={(v: number) => { field.onChange(v); trigger("termsid"); }}
                    trigger={trigger}
                  />
                )}
              />
            </div>

            {/* hidden warehouseid */}
            <input type="hidden" {...register("warehouseid")} />
          </div>

          {/* Footer */}
          <div
            className="d-flex justify-content-end gap-2 px-4 py-3"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <button type="button" className="btn btn-light" onClick={onDone}>
              Skip
            </button>
            <ButtonLoader
              loading={saving}
              btnText="Save Invoice"
              loadingText="Saving..."
              className="btn btn-success"
            />
          </div>
        </form>
      </div>
    </>,
    document.body
  );
};

export default POSupplierInvoiceModal;
