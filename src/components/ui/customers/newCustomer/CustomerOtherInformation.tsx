"use client";

import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import SelectShippingModes from "@/components/forms/SelectShippingModes";
import SelectStatus from "@/components/forms/SelectStatus";
import SelectStore from "@/components/forms/SelectStore";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewCustomerFormType } from "@/types/customer";
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
  register: UseFormRegister<NewCustomerFormType>;
  errors: FieldErrors<NewCustomerFormType>;
  control: Control<NewCustomerFormType>;
  trigger: UseFormTrigger<NewCustomerFormType>;
  setValue: UseFormSetValue<NewCustomerFormType>;
  storeId: number;
  warehouseId: number;
  status: number;
}

const CustomerOtherInformation = ({
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
              name="custshippingmethod"
              control={control}
              rules={{ required: "Shipping mode is required" }}
              render={({ field }) => (
                <SelectShippingModes
                  className={`${errors.custshippingmethod && "is-invalid"} `}
                  trigger={trigger}
                  setValue={setValue}
                  storeId={storeId}
                  {...field}
                />
              )}
            />
            {errors.custshippingmethod && (
              <div className="invalid-feedback">
                {errors.custshippingmethod.message}
              </div>
            )}
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
            <label className="form-label">DL #</label>
            <input
              type="text"
              className={`${errors.custdlno && "is-invalid"}  form-control`}
              {...register("custdlno")}
            />
            {errors.custdlno && (
              <div className="invalid-feedback">{errors.custdlno.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="mb-3">
            <label className="form-label">SS #</label>
            <input
              type="text"
              className={`${errors.custssno && "is-invalid"}  form-control`}
              {...register("custssno")}
            />
            {errors.custssno && (
              <div className="invalid-feedback">{errors.custssno.message}</div>
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
        <div className="col-lg-3 col-md-6">
          <div className="mb-3">
            <label className="form-label">Tax exempt id</label>
            <input
              type="text"
              className={`${
                errors.custtaxexemptid && "is-invalid"
              }  form-control`}
              {...register("custtaxexemptid")}
            />
            {errors.custtaxexemptid && (
              <div className="invalid-feedback">
                {errors.custtaxexemptid.message}
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
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Shipping to</label>
            <input
              type="text"
              className={`${errors.custshipto && "is-invalid"}  form-control`}
              {...register("custshipto")}
            />
            {errors.custshipto && (
              <div className="invalid-feedback">
                {errors.custshipto.message}
              </div>
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
              <div className="invalid-feedback">
                {errors.custbillto.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6"></div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Credit card number</label>
            <input
              type="text"
              className={`${
                errors.custcreditcardno && "is-invalid"
              }  form-control`}
              {...register("custcreditcardno")}
            />
            {errors.custcreditcardno && (
              <div className="invalid-feedback">
                {errors.custcreditcardno.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="input-blocks">
            <label>Credit card expiry</label>
            <div className="input-groupicon calender-input">
              <Controller
                name="custcardexpiry"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    type="date"
                    className="filterdatepicker"
                    onChange={(date) => field.onChange(date)}
                    placeholder="Choose Date"
                    status={errors.custcardexpiry ? "error" : ""}
                  />
                )}
              />
              {errors.custcardexpiry && (
                <div className="invalid-feedback">
                  {errors.custcardexpiry.message}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Auth. name</label>
            <input
              type="text"
              className={`${
                errors.custauthorizedname && "is-invalid"
              }  form-control`}
              {...register("custauthorizedname")}
            />
            {errors.custauthorizedname && (
              <div className="invalid-feedback">
                {errors.custauthorizedname.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Alert warning</label>
            <div className="form-check form-check-md form-switch">
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
          </div>
        </div>
      </div>
      <div className="row mt-3">
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
              <div className="invalid-feedback">
                {errors.custremarks.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerOtherInformation;
