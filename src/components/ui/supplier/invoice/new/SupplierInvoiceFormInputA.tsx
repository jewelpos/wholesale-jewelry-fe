"use client";

import { SupplierInvoiceFormType } from "@/types/supplier";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";
import SelectStore from "@/components/forms/SelectStore";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import SelectSupplier from "@/components/forms/SelectSupplier";

interface Props {
  register: UseFormRegister<SupplierInvoiceFormType>;
  errors: FieldErrors<SupplierInvoiceFormType>;
  control: Control<SupplierInvoiceFormType>;
  trigger: UseFormTrigger<SupplierInvoiceFormType>;
  storeId: number;
  warehouseId: string;
  disableField?: boolean;
}

const SupplierInvoiceFormInputA = ({
  register,
  errors,
  control,
  trigger,
  storeId,
  warehouseId,
  disableField,
}: Props) => {
  return (
    <>
      <div className="row">
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Store</label>
            <Controller
              name="storeid"
              control={control}
              rules={{ required: "Store is required" }}
              render={({ field }) => (
                <SelectStore
                  className={`${errors.storeid && "is-invalid"} `}
                  trigger={trigger}
                  storeId={storeId}
                  isDisabled={disableField}
                  {...field}
                />
              )}
            />
            {errors.storeid && (
              <div className="invalid-feedback">{errors.storeid.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Vendor Invoice #</label>
            <input
              type="text"
              className={`${errors.veninvoiceno && "is-invalid"}  form-control`}
              {...register("veninvoiceno", {
                required: "Vendor invoice number is required",
              })}
            />
            {errors.veninvoiceno && (
              <div className="invalid-feedback">
                {errors.veninvoiceno.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Supplier</label>
            <Controller
              name="supplierid"
              control={control}
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier
                  className={`${errors.supplierid && "is-invalid"} `}
                  trigger={trigger}
                  storeId={storeId}
                  isDisabled={disableField}
                  {...field}
                />
              )}
            />
            {errors.supplierid && (
              <div className="invalid-feedback">
                {errors.supplierid.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Warehouse</label>
            <Controller
              name="warehouseid"
              control={control}
              rules={{ required: "Warehouse is required" }}
              render={({ field }) => (
                <SelectWarehouse
                  className={`${errors.warehouseid && "is-invalid"} `}
                  trigger={trigger}
                  warehouseId={warehouseId}
                  storeId={storeId}
                  isDisabled={disableField}
                  {...field}
                />
              )}
            />
            {errors.warehouseid && (
              <div className="invalid-feedback">
                {errors.warehouseid.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInvoiceFormInputA;
