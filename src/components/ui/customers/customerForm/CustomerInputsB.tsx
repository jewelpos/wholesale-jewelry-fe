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
      <div className="col-lg-6 col-md-6">
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
      <div className="col-lg-6 col-md-6">
        <div className="mb-3">
          <label className="form-label">Shipping mode</label>
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
      <div className="col-lg-3 col-md-6">
        <div className="mb-3">
          <label className="form-label">Credit limit</label>
          <input
            type="text"
            className={`${
              errors.custcreditlimit && "is-invalid"
            }  form-control`}
            {...register("custcreditlimit", {
              required: "Credit limit is required",
            })}
          />
          {errors.custcreditlimit && (
            <div className="invalid-feedback">
              {errors.custcreditlimit.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-3 col-md-6">
        <div className="mb-3">
          <label className="form-label">Discount %</label>
          <input
            type="text"
            className={`${errors.custdiscount && "is-invalid"}  form-control`}
            {...register("custdiscount", {
              required: "Discount is required",
            })}
          />
          {errors.custdiscount && (
            <div className="invalid-feedback">
              {errors.custdiscount.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-3 col-md-6">
        <div className="mb-3">
          <label className="form-label">Tax ID</label>
          <input
            type="text"
            className={`${errors.custtaxid && "is-invalid"}  form-control`}
            {...register("custtaxid")}
          />
          {errors.custtaxid && (
            <div className="invalid-feedback">{errors.custtaxid.message}</div>
          )}
        </div>
      </div>
      <div className="col-lg-3 col-md-6">
        <div className="mb-3">
          <label className="form-label">Sale tax</label>
          <input
            type="text"
            className={`${errors.custsalestax && "is-invalid"}  form-control`}
            {...register("custsalestax")}
          />
          {errors.custsalestax && (
            <div className="invalid-feedback">
              {errors.custsalestax.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Shipping to</label>
          <input
            type="text"
            className={`${errors.custshipto && "is-invalid"}  form-control`}
            {...register("custshipto")}
          />
          {errors.custshipto && (
            <div className="invalid-feedback">{errors.custshipto.message}</div>
          )}
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Billing to</label>
          <input
            type="text"
            className={`${errors.custbillto && "is-invalid"}  form-control`}
            {...register("custbillto")}
          />
          {errors.custbillto && (
            <div className="invalid-feedback">{errors.custbillto.message}</div>
          )}
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Status</label>
          <div className="form-check form-check-md form-switch">
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
          <label className="form-label">Alert remarks</label>
          <textarea
            className={`${
              errors.custalertremarks && "is-invalid"
            }  form-control`}
            {...register("custalertremarks")}
          />
          {errors.custalertremarks && (
            <div className="invalid-feedback">
              {errors.custalertremarks.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Remarks</label>
          <textarea
            className={`${errors.custremarks && "is-invalid"}  form-control`}
            {...register("custremarks")}
          />
          {errors.custremarks && (
            <div className="invalid-feedback">{errors.custremarks.message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInputsB;
