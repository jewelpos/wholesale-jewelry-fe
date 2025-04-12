"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewSupplierFormType } from "@/types/supplier";
import React from "react";
import { Info } from "react-feather";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  register: UseFormRegister<NewSupplierFormType>;
  errors: FieldErrors<NewSupplierFormType>;
}

const SupplierInformationInputs = ({ register, errors }: Props) => {
  return (
    <>
      <div className="card-title-head">
        <h6>
          <span>
            <Info className="feather-edit" />
          </span>
          Supplier Information
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">First name</label>
            <input
              type="text"
              className={`${
                errors.supplierfname && "is-invalid"
              }  form-control`}
              {...register("supplierfname", {
                required: "First name is required",
              })}
            />
            {errors.supplierfname && (
              <div className="invalid-feedback">
                {errors.supplierfname.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Last name</label>
            <input
              type="text"
              className={`${
                errors.supplierlname && "is-invalid"
              }  form-control`}
              {...register("supplierlname", {
                required: "Last name is required",
              })}
            />
            {errors.supplierlname && (
              <div className="invalid-feedback">
                {errors.supplierlname.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className={`${errors.phone1 && "is-invalid"}  form-control`}
              {...register("phone1", phoneNumberValidation)}
            />
            {errors.phone1 && (
              <div className="invalid-feedback">{errors.phone1.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Cell phone</label>
            <input
              type="text"
              className={`${errors.cellphone && "is-invalid"}  form-control`}
              {...register("cellphone", {
                required: "Cell phone is required",
              })}
            />
            {errors.cellphone && (
              <div className="invalid-feedback">{errors.cellphone.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
              className={`${errors.emailaddress && "is-invalid"}  form-control`}
              {...register("emailaddress", emailValidation)}
            />
            {errors.emailaddress && (
              <div className="invalid-feedback">
                {errors.emailaddress.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Web</label>
            <input
              type="text"
              className={`${errors.webaddress && "is-invalid"}  form-control`}
              {...register("webaddress", {
                required: "Web address is required",
              })}
            />
            {errors.webaddress && (
              <div className="invalid-feedback">
                {errors.webaddress.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInformationInputs;
