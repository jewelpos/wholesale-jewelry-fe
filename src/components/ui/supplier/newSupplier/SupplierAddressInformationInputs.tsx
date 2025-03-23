"use client";

import SelectCountry from "@/components/forms/SelectCountry";
import SelectState from "@/components/forms/SelectState";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewCustomerFormType } from "@/types/customer";
import { NewSupplierFormType } from "@/types/supplier";
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
  register: UseFormRegister<NewSupplierFormType>;
  errors: FieldErrors<NewSupplierFormType>;
  control: Control<NewSupplierFormType>;
  selectedCountry: string;
  trigger: UseFormTrigger<NewSupplierFormType>;
}

const SupplierAddressInformationInputs = ({
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
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Contact person</label>
            <input
              type="text"
              className={`${
                errors.contactperson1 && "is-invalid"
              }  form-control`}
              {...register("contactperson1", {
                required: "Contact person is required",
              })}
            />
            {errors.contactperson1 && (
              <div className="invalid-feedback">
                {errors.contactperson1.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className={`${errors.address1 && "is-invalid"}  form-control`}
              {...register("address1", {
                required: "Address is required",
              })}
            />
            {errors.address1 && errors.address2 && (
              <div className="invalid-feedback">
                {errors.address1.message || errors.address2.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-6">
          <div className="mb-3">
            <label className="form-label">&nbsp;</label>
            <input
              type="text"
              className={`${errors.address1 && "is-invalid"}  form-control`}
              {...register("address1", {
                required: "Address is required",
              })}
            />
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <Controller
              name="country"
              control={control}
              rules={{ required: "Country is required" }}
              render={({ field }) => (
                <SelectCountry
                  className={`${errors.country && "is-invalid"} `}
                  trigger={trigger}
                  {...field}
                />
              )}
            />
            {errors.country && (
              <div className="invalid-feedback">{errors.country.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">State</label>
            <Controller
              name="state"
              control={control}
              rules={{ required: "State is required" }}
              render={({ field }) => (
                <SelectState
                  className={`${errors.state && "is-invalid"} `}
                  selectedCountry={selectedCountry}
                  trigger={trigger}
                  {...field}
                />
              )}
            />
            {errors.state && (
              <div className="invalid-feedback">{errors.state.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              className={`${errors.city && "is-invalid"}  form-control`}
              {...register("city", {
                required: "City is required",
              })}
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Zip code</label>
            <input
              type="text"
              className={`${errors.zipcode && "is-invalid"}  form-control`}
              {...register("zipcode", {
                required: "Zip code is required",
              })}
            />
            {errors.zipcode && (
              <div className="invalid-feedback">{errors.zipcode.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className={`${errors.phone2 && "is-invalid"}  form-control`}
              {...register("phone2", phoneNumberValidation)}
            />
            {errors.phone2 && (
              <div className="invalid-feedback">{errors.phone2.message}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierAddressInformationInputs;
