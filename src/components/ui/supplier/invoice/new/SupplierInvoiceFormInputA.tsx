"use client";

import { SupplierInvoiceFormType, SupplierType } from "@/types/supplier";
import React, { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import useSupplier from "@/hooks/useSupplier";
import { Calendar } from "react-feather";
import { DatePicker } from "antd";
import dayjs from "dayjs";

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
}

const SupplierInvoiceFormInputA = ({
  register,
  errors,
  control,
  trigger,
  storeId,
  warehouseId,
  disableField,
  supplier,
  supplierLoading,
  savedAmount,
}: Props) => {
  return (
    <>
      <div className="row">
        <div className="col-lg-5 col-sm-12 col-md-6">
          <div className="mb-3">
            <label className="form-label">Vendor Invoice #</label>
            <input
              type="text"
              className={`${errors.veninvoiceno && "is-invalid"}  form-control`}
              {...register("veninvoiceno", {
                required: "Vendor invoice number is required",
              })}
              disabled={disableField}
            />
            {errors.veninvoiceno && (
              <div className="invalid-feedback">
                {errors.veninvoiceno.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-7 col-sm-12 col-md-6">
          <div className="row">
            <div className="col-lg-6 col-sm-12 col-md-6">
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
                      disableField={disableField}
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
            <div className="col-lg-6 col-sm-12 col-md-6">
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
                      disableField={disableField}
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
            <div className="col-lg-4 col-sm-12 col-md-6">
              <div className="mb-3">
                <label className="form-label">Invoice amount</label>
                <input
                  type="text"
                  className={`${
                    errors.veninvoicetotal && "is-invalid"
                  }  form-control`}
                  {...register("veninvoicetotal", {
                    required: "Invoice amount is required",
                    validate: (value) =>
                      disableField && savedAmount && Number(value) < savedAmount
                        ? "Invoice amount should be greater than saved amount"
                        : undefined,
                  })}
                />
                {errors.veninvoicetotal && (
                  <div className="invalid-feedback">
                    {errors.veninvoicetotal.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-sm-12 col-md-6">
              <div className="mb-3">
                <label className="form-label">Invoice Date</label>
                <div className="input-blocks">
                  <div className="input-groupicon calender-input">
                    <Calendar className="info-img" />
                    <Controller
                      name="veninvoicedate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          onChange={(date) => field.onChange(date)}
                          value={field.value}
                          format="YYYY-MM-DD"
                          allowClear={false}
                        />
                      )}
                    />
                  </div>
                </div>
                {errors.veninvoicedate && (
                  <div className="invalid-feedback">
                    {errors.veninvoicedate.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-sm-12 col-md-6">
              <div className="mb-3">
                <label className="form-label">Payment terms</label>
                <Controller
                  name="termsid"
                  control={control}
                  rules={{ required: "Payment terms is required" }}
                  render={({ field }) => (
                    <SelectPaymentTerms
                      className={`${errors.termsid && "is-invalid"} `}
                      trigger={trigger}
                      storeId={storeId}
                      {...field}
                    />
                  )}
                />
                {errors.termsid && (
                  <div className="invalid-feedback">
                    {errors.termsid.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-sm-12 col-md-6">
              <div className="mb-3">
                <label className="form-label">Reference PO #</label>
                <input
                  type="text"
                  className={`${
                    errors.refponumber && "is-invalid"
                  } form-control`}
                  {...register("refponumber", {
                    required: "Reference PO is required",
                    validate: (value) =>
                      !isNaN(Number(value)) || "Please enter a valid number",
                  })}
                />
                {errors.refponumber && (
                  <div className="invalid-feedback">
                    {errors.refponumber.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5 col-sm-12 col-md-6">
          <div className="border p-3 rounded shadow-sm">
            <div className="row">
              <div className="col-lg-8 col-md-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Company name</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={supplierLoading ? "" : supplier?.companyname || ""}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-8 col-md-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={supplierLoading ? "" : supplier?.address1 || ""}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4 col-md-4 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={supplierLoading ? "" : supplier?.city || ""}
                  />
                </div>
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={supplierLoading ? "" : supplier?.state || ""}
                  />
                </div>
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Zipcode</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={supplierLoading ? "" : supplier?.zipcode || ""}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInvoiceFormInputA;
