"use client";

import { SupplierInvoiceFormType, SupplierType } from "@/types/supplier";
import React, { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import useWarehouse from "@/hooks/useWarehouse";
import { useParams } from "next/navigation";
import { DatePicker } from "antd";

interface Props {
  register: UseFormRegister<SupplierInvoiceFormType>;
  errors: FieldErrors<SupplierInvoiceFormType>;
  control: Control<SupplierInvoiceFormType>;
  trigger: UseFormTrigger<SupplierInvoiceFormType>;
  storeId: number;
  warehouseId: string;
  disableField?: boolean;
  supplier?: SupplierType | null;
  supplierLoading: boolean;
  savedAmount?: number;
  setValue: UseFormSetValue<SupplierInvoiceFormType>;
}

const sectionLabel = {
  fontSize: "0.65rem",
  letterSpacing: "0.06em",
} as const;

const SupplierInvoiceFormInputA = ({
  register,
  errors,
  control,
  trigger,
  storeId,
  disableField,
  supplier,
  supplierLoading,
  savedAmount,
  setValue,
}: Props) => {
  const { outletId } = useParams();
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const warehouse = warehouses.find((w) => w.issystem);

  useEffect(() => {
    if (outletId) {
      fetchWarehouseByOutletId(Number(outletId));
    }
  }, [fetchWarehouseByOutletId, outletId]);

  useEffect(() => {
    if (warehouse) {
      setValue("warehouseid", warehouse.warehouseid.toString());
    }
  }, [warehouse, setValue]);

  return (
    <>
      {/* ── HEADER STRIP ──────────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-4 align-items-start">

            {/* Invoice Date */}
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>
                Invoice Date
              </div>
              <Controller
                name="veninvoicedate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    format="DD-MM-YYYY"
                    allowClear={false}
                    disabled={disableField}
                    style={{ width: 140 }}
                  />
                )}
              />
            </div>
            <div className="vr align-self-stretch" />

            {/* Warehouse */}
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>
                Warehouse
              </div>
              <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6 }}>
                {warehouse?.warehousename || "—"}
              </div>
              <input type="hidden" {...register("warehouseid", { required: "Warehouse is required" })} />
            </div>
            <div className="vr align-self-stretch" />

            {/* Vendor Invoice # */}
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>
                Vendor Invoice #
              </div>
              <input
                type="text"
                className={`form-control form-control-sm${errors.veninvoiceno ? " is-invalid" : ""}`}
                style={{ width: 150 }}
                {...register("veninvoiceno", { required: "Vendor invoice number is required" })}
                disabled={disableField}
              />
              {errors.veninvoiceno && (
                <div className="invalid-feedback">{errors.veninvoiceno.message}</div>
              )}
            </div>
            <div className="vr align-self-stretch" />

            {/* Ref PO # */}
            <div>
              <div className="text-uppercase fw-semibold text-muted mb-1" style={sectionLabel}>
                Ref PO #
              </div>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: 120 }}
                {...register("refponumber")}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── SUPPLIER + ADDRESS ────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">

            {/* Left: supplier selector + financial fields */}
            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <div
                  className="text-uppercase fw-semibold text-muted mb-2"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}
                >
                  Supplier
                </div>

                <Controller
                  name="supplierid"
                  control={control}
                  rules={{ required: "Supplier is required" }}
                  render={({ field }) => (
                    <SelectSupplier
                      className={errors.supplierid ? "is-invalid" : ""}
                      trigger={trigger}
                      storeId={storeId}
                      disableField={disableField}
                      {...field}
                    />
                  )}
                />
                {errors.supplierid && (
                  <div className="invalid-feedback d-block">{errors.supplierid.message}</div>
                )}

                <div className="row g-2 mt-2">
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Invoice Amount *</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm${errors.veninvoicetotal ? " is-invalid" : ""}`}
                      {...register("veninvoicetotal", {
                        required: "Invoice amount is required",
                        validate: (value) =>
                          disableField && savedAmount && Number(value) < savedAmount
                            ? "Amount must be ≥ saved amount"
                            : undefined,
                      })}
                    />
                    {errors.veninvoicetotal && (
                      <div className="invalid-feedback">{errors.veninvoicetotal.message}</div>
                    )}
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted mb-1">Payment Terms</label>
                    <Controller
                      name="termsid"
                      control={control}
                      rules={{ required: "Payment terms is required" }}
                      render={({ field }) => (
                        <SelectPaymentTerms
                          className={errors.termsid ? "is-invalid" : ""}
                          trigger={trigger}
                          storeId={storeId}
                          {...field}
                        />
                      )}
                    />
                    {errors.termsid && (
                      <div className="invalid-feedback d-block">{errors.termsid.message}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: supplier address (auto-populated) */}
            <div className="col-lg-6 col-md-12">
              <div className="border rounded p-3 h-100">
                <div
                  className="text-uppercase fw-semibold text-muted mb-2"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}
                >
                  Supplier Details
                </div>
                {supplierLoading ? (
                  <div className="text-muted small fst-italic">Loading…</div>
                ) : supplier ? (
                  <div className="text-muted small lh-lg">
                    {supplier.companyname && (
                      <div className="fw-semibold text-dark">{supplier.companyname}</div>
                    )}
                    {supplier.address1 && <div>{supplier.address1}</div>}
                    {[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).length > 0 && (
                      <div>
                        {[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted small fst-italic">Select a supplier to see details</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInvoiceFormInputA;
