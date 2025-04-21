"use client";

import { phoneNumberValidationCustomized } from "@/lib/utils/validations/formValidations";
import { SupplierFormType } from "@/types/supplier";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectStore from "@/components/forms/SelectStore";
import SelectWarehouse from "@/components/forms/SelectWarehouse";

interface Props {
  register: UseFormRegister<SupplierFormType>;
  errors: FieldErrors<SupplierFormType>;
  control: Control<SupplierFormType>;
  trigger: UseFormTrigger<SupplierFormType>;
  setValue: UseFormSetValue<SupplierFormType>;
  storeId: number;
  warehouseId: string;
  status: number;
  disableField?: boolean;
}

export const SupplierInputsB = ({
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
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Terms</label>
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
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Shipping mode</label>
          <Controller
            name="shippimgmethod"
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
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Account No</label>
          <input
            type="text"
            className={`${errors.accountno && "is-invalid"} form-control`}
            {...register("accountno")}
          />
          {errors.accountno && (
            <div className="invalid-feedback">{errors.accountno.message}</div>
          )}
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Status</label>
          <div className="form-check form-check-md form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              {...register("supplierstatus", { required: true })}
              onChange={(e) => {
                setValue("supplierstatus", e.target.checked ? 1 : 0);
                trigger("supplierstatus");
              }}
            />
            <label
              className="form-check-label"
              htmlFor="flexSwitchCheckDefault"
            >
              {status === 0 ? "Inactive" : "Active"}
            </label>
          </div>
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Remarks</label>
          <input
            type="text"
            className={`${errors.remarks && "is-invalid"} form-control`}
            {...register("remarks")}
          />
          {errors.remarks && (
            <div className="invalid-feedback">{errors.remarks.message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierInputsB;
