"use client";

import SelectCountry from "@/components/forms/SelectCountry";
import SelectState from "@/components/forms/SelectState";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewCustomerFormType } from "@/types/customer";
import React from "react";
import { Info } from "react-feather";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";

interface Props {
  register: UseFormRegister<NewCustomerFormType>;
  errors: FieldErrors<NewCustomerFormType>;
  control: Control<NewCustomerFormType>;
  selectedCountry: string;
  trigger: UseFormTrigger<NewCustomerFormType>;
}

const CustomerAddressInformationInputs = ({
  register,
  errors,
  control,
  selectedCountry,
  trigger,
}: Props) => {
  return (
    <>
      <div className="card-title-head">
        <h6>
          <span>
            <Info className="feather-edit" />
          </span>
          Address Information
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className={`${errors.custadd1 && "is-invalid"}  form-control`}
              {...register("custadd1", {
                required: "Address is required",
              })}
            />
            {errors.custadd1 && errors.custadd2 && (
              <div className="invalid-feedback">
                {errors.custadd1.message || errors.custadd2.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">&nbsp;</label>
            <input
              type="text"
              className={`${errors.custadd2 && "is-invalid"}  form-control`}
              {...register("custadd2", {
                required: "Address is required",
              })}
            />
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <Controller
              name="custcountry"
              control={control}
              rules={{ required: "Country is required" }}
              render={({ field }) => (
                <SelectCountry
                  className={`${errors.custcountry && "is-invalid"} `}
                  trigger={trigger}
                  {...field}
                />
              )}
            />
            {errors.custcountry && (
              <div className="invalid-feedback">
                {errors.custcountry.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">State</label>
            <Controller
              name="custstate"
              control={control}
              rules={{ required: "State is required" }}
              render={({ field }) => (
                <SelectState
                  className={`${errors.custstate && "is-invalid"} `}
                  selectedCountry={selectedCountry}
                  trigger={trigger}
                  {...field}
                />
              )}
            />
            {errors.custstate && (
              <div className="invalid-feedback">{errors.custstate.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              className={`${errors.custcity && "is-invalid"}  form-control`}
              {...register("custcity", {
                required: "City is required",
              })}
            />
            {errors.custcity && (
              <div className="invalid-feedback">{errors.custcity.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Zip code</label>
            <input
              type="text"
              className={`${errors.custzip && "is-invalid"}  form-control`}
              {...register("custzip", {
                required: "Zip code is required",
              })}
            />
            {errors.custzip && (
              <div className="invalid-feedback">{errors.custzip.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className={`${errors.custphone2 && "is-invalid"}  form-control`}
              {...register("custphone2", phoneNumberValidation)}
            />
            {errors.custphone2 && (
              <div className="invalid-feedback">
                {errors.custphone2.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Alternative phone number</label>
            <input
              type="text"
              className={`${errors.custphone3 && "is-invalid"}  form-control`}
              {...register("custphone3", phoneNumberValidation)}
            />
            {errors.custphone3 && (
              <div className="invalid-feedback">
                {errors.custphone3.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerAddressInformationInputs;
