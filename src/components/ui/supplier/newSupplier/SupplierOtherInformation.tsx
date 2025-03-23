"use client";

import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectStatus from "@/components/forms/SelectStatus";
import SelectStore from "@/components/forms/SelectStore";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewCustomerFormType } from "@/types/customer";
import { NewSupplierFormType } from "@/types/supplier";
import { DatePicker } from "antd";
import React from "react";
import { Info, PlusCircle } from "react-feather";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";

interface Props {
  register: UseFormRegister<NewSupplierFormType>;
  errors: FieldErrors<NewSupplierFormType>;
  control: Control<NewSupplierFormType>;
  trigger: UseFormTrigger<NewSupplierFormType>;
  setValue: UseFormSetValue<NewSupplierFormType>;
  storeId: number;
  warehouseId: number;
  status: number;
}

const SupplierOtherInformation = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  storeId,
  warehouseId,
  status,
}: Props) => {
  return (
    <>
      <div className="card-title-head">
        <h6>
          <span>
            <Info className="feather-edit" />
          </span>
          Other Information
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-6">
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
                  {...field}
                />
              )}
            />
            {errors.storeid && (
              <div className="invalid-feedback">{errors.storeid.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-6">
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
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">Terms</label>
            <Controller
              name="termsid"
              control={control}
              rules={{ required: "Terms is required" }}
              render={({ field }) => (
                <SelectPaymentTerms
                  className={`${errors.termsid && "is-invalid"} `}
                  trigger={trigger}
                  setValue={setValue}
                  storeId={storeId}
                  {...field}
                />
              )}
            />
            {errors.termsid && (
              <div className="invalid-feedback">{errors.termsid.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">Shipping mode</label>
            <Controller
              name="shippimgmethod"
              control={control}
              rules={{ required: "Shipping mode is required" }}
              render={({ field }) => (
                <SelectShippingModes
                  className={`${errors.shippimgmethod && "is-invalid"} `}
                  trigger={trigger}
                  setValue={setValue}
                  storeId={storeId}
                  {...field}
                />
              )}
            />
            {errors.shippimgmethod && (
              <div className="invalid-feedback">
                {errors.shippimgmethod.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Account number</label>
            <input
              type="text"
              className={`${errors.accountno && "is-invalid"}  form-control`}
              {...register("accountno", {
                required: "Account is required",
              })}
            />
            {errors.accountno && (
              <div className="invalid-feedback">{errors.accountno.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="mb-3">
            <label className="form-label">Discount rate</label>
            <input
              type="text"
              className={`${errors.discountrate && "is-invalid"}  form-control`}
              {...register("discountrate", {
                required: "Discount is required",
              })}
            />
            {errors.discountrate && (
              <div className="invalid-feedback">
                {errors.discountrate.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
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
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Remarks</label>
            <textarea
              className={`${errors.remarks && "is-invalid"}  form-control`}
              {...register("remarks")}
            />
            {errors.remarks && (
              <div className="invalid-feedback">{errors.remarks.message}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierOtherInformation;
