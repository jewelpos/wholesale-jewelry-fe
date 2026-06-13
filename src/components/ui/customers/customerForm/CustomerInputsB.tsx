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
import {
  Landmark,
  FileText,
  CreditCard,
  Activity,
  Bell,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

interface Props {
  register: UseFormRegister<CustomerFormType>;
  errors: FieldErrors<CustomerFormType>;
  control: Control<CustomerFormType>;
  trigger: UseFormTrigger<CustomerFormType>;
  setValue: UseFormSetValue<CustomerFormType>;
  storeId: number;
  warehouseId: string;
  status: number;
  custalert: number;
  disableField?: boolean;
}

const SectionLabel = ({ label, icon: Icon }: { label: string; icon: LucideIcon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "20px 0 14px" }}>
    <Icon size={13} strokeWidth={2} color="#6c757d" />
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6c757d", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#dee2e6" }} />
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
  custalert,
  disableField,
}: Props) => {
  return (
    <>
      {/* Warehouse */}
      <SectionLabel label="Warehouse" icon={Landmark} />
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
      <SectionLabel label="Terms" icon={FileText} />
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
      <SectionLabel label="Financials" icon={CreditCard} />
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
      <SectionLabel label="Status" icon={Activity} />
      <div className="row">
        <div className="col-12 mb-3">
          <div
            style={{
              background: status === 1 ? "#f0fdf4" : "#f8f9fa",
              border: `1px solid ${status === 1 ? "#bbf7d0" : "#dee2e6"}`,
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: status === 1 ? "#15803d" : "#6c757d",
                }}
              >
                {status === 1 ? "Active" : "Inactive"}
              </div>
              <div style={{ fontSize: 11, color: status === 1 ? "#4ade80" : "#adb5bd", marginTop: 1 }}>
                {status === 1
                  ? "Customer can place orders"
                  : "Customer account is disabled"}
              </div>
            </div>
            <div className="form-check form-switch mb-0">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    style={{ width: 42, height: 22, cursor: "pointer" }}
                    checked={Number(field.value) === 1}
                    onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <SectionLabel label="Alerts" icon={Bell} />
      <div className="row">
        <div className="col-12 mb-3">
          <div
            style={{
              background: custalert === 1 ? "#f0fdf4" : "#f8f9fa",
              border: `1px solid ${custalert === 1 ? "#bbf7d0" : "#dee2e6"}`,
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: custalert === 1 ? "#15803d" : "#6c757d",
                }}
              >
                {custalert === 1 ? "Alert Enabled" : "Alert Disabled"}
              </div>
              <div style={{ fontSize: 11, color: custalert === 1 ? "#4ade80" : "#adb5bd", marginTop: 1 }}>
                {custalert === 1
                  ? "Warning shown on customer transactions"
                  : "No alert active"}
              </div>
            </div>
            <div className="form-check form-switch mb-0">
              <Controller
                name="custalert"
                control={control}
                render={({ field }) => (
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    style={{ width: 42, height: 22, cursor: "pointer" }}
                    checked={Number(field.value) === 1}
                    onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                  />
                )}
              />
            </div>
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
      <SectionLabel label="Notes" icon={StickyNote} />
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
