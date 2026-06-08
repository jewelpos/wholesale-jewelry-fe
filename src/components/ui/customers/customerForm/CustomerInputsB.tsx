"use client";

import { CustomerFormType } from "@/types/customer";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
  UseFormSetValue,
} from "react-hook-form";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectStore from "@/components/forms/SelectStore";
import SelectWarehouse from "@/components/forms/SelectWarehouse";

interface Props {
  register: UseFormRegister<CustomerFormType>;
  errors: FieldErrors<CustomerFormType>;
  control: Control<CustomerFormType>;
  trigger: UseFormTrigger<CustomerFormType>;
  setValue: UseFormSetValue<CustomerFormType>;
  storeId: number;
  warehouseId: string;
  status: number;
  disableField?: boolean;
}

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 14px" }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#adb5bd", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
  </div>
);

const CustomerInputsB = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  storeId,
  warehouseId,
  status,
  disableField,
}: Props) => {
  return (
    <>
      {/* Warehouse */}
      <SectionLabel label="Warehouse" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Store</label>
          <Controller
            name="storeid"
            control={control}
            rules={{ required: "Store is required" }}
            render={({ field }) => (
              <SelectStore
                className={errors.storeid ? "is-invalid" : ""}
                trigger={trigger}
                setValue={setValue}
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
        <div className="col-6 mb-3">
          <label className="form-label">Warehouse</label>
          <Controller
            name="warehouseid"
            control={control}
            rules={{ required: "Warehouse is required" }}
            render={({ field }) => (
              <SelectWarehouse
                className={errors.warehouseid ? "is-invalid" : ""}
                trigger={trigger}
                setValue={setValue}
                warehouseId={warehouseId}
                storeId={storeId}
                isDisabled={disableField}
                {...field}
              />
            )}
          />
          {errors.warehouseid && (
            <div className="invalid-feedback">{errors.warehouseid.message}</div>
          )}
        </div>
      </div>

      {/* Terms */}
      <SectionLabel label="Terms" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Payment Terms</label>
          <Controller
            name="termsid"
            control={control}
            render={({ field }) => (
              <SelectPaymentTerms
                className=""
                trigger={trigger}
                setValue={setValue}
                storeId={storeId}
                isDisabled={disableField}
                {...field}
              />
            )}
          />
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Shipping Mode</label>
          <Controller
            name="custshippingmethod"
            control={control}
            render={({ field }) => (
              <SelectShippingModes
                className=""
                trigger={trigger}
                setValue={setValue}
                storeId={storeId}
                isDisabled={disableField}
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Financials */}
      <SectionLabel label="Financials" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Credit Limit</label>
          <input
            type="text"
            className={`form-control${errors.custcreditlimit ? " is-invalid" : ""}`}
            {...register("custcreditlimit", { required: "Credit limit is required" })}
          />
          {errors.custcreditlimit && (
            <div className="invalid-feedback">{errors.custcreditlimit.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Discount %</label>
          <input
            type="text"
            className={`form-control${errors.custdiscount ? " is-invalid" : ""}`}
            {...register("custdiscount", { required: "Discount is required" })}
          />
          {errors.custdiscount && (
            <div className="invalid-feedback">{errors.custdiscount.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Tax ID</label>
          <input
            type="text"
            className={`form-control${errors.custtaxid ? " is-invalid" : ""}`}
            {...register("custtaxid")}
          />
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Sales Tax %</label>
          <input
            type="text"
            className={`form-control${errors.custsalestax ? " is-invalid" : ""}`}
            {...register("custsalestax")}
          />
        </div>
      </div>

      {/* Status */}
      <SectionLabel label="Status" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label d-block">Account Status</label>
          <div className="d-flex align-items-center gap-3">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                {...register("status", { required: true })}
                onChange={(e) => {
                  setValue("status", e.target.checked ? 1 : 0);
                  trigger("status");
                }}
              />
            </div>
            <span
              className={`badge ${status === 1 ? "bg-success" : "bg-secondary"}`}
              style={{ fontSize: 12 }}
            >
              {status === 1 ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <SectionLabel label="Alerts" />
      <div className="row">
        <div className="col-12 mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                {...register("custalert")}
                onChange={(e) => {
                  setValue("custalert", e.target.checked ? 1 : 0);
                  trigger("custalert");
                }}
              />
            </div>
            <label className="form-label mb-0">Enable Alert Warning</label>
          </div>
        </div>
        <div className="col-12 mb-3">
          <label className="form-label">Alert Message</label>
          <textarea
            rows={2}
            className={`form-control${errors.custalertremarks ? " is-invalid" : ""}`}
            placeholder="Warning message shown on this customer's transactions..."
            {...register("custalertremarks")}
          />
          {errors.custalertremarks && (
            <div className="invalid-feedback">{errors.custalertremarks.message}</div>
          )}
        </div>
      </div>

      {/* Notes */}
      <SectionLabel label="Notes" />
      <div className="row">
        <div className="col-12 mb-3">
          <label className="form-label">Remarks</label>
          <textarea
            rows={3}
            className={`form-control${errors.custremarks ? " is-invalid" : ""}`}
            placeholder="Internal notes about this customer..."
            {...register("custremarks")}
          />
          {errors.custremarks && (
            <div className="invalid-feedback">{errors.custremarks.message}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerInputsB;
