"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { CreateOutlet } from "@/types/outlet";
import React from "react";
import { Control, FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  register: UseFormRegister<CreateOutlet>;
  errors: FieldErrors<CreateOutlet>;
  control?: Control<CreateOutlet>;
  storesLoading?: boolean;
}

const OutletFormTypeC = ({ register, errors }: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Outlet contact information</h4>
            <p>
              Provide the details of the primary contact person for the store.
              This includes their full name, email address, and phone number to
              ensure smooth communication and support.
            </p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Outlet person</label>
              <input
                type="text"
                placeholder="Enter a outlet person name"
                className={`${
                  errors.contactperson && "is-invalid"
                }  form-control`}
                {...register("contactperson", {
                  required: "Outlet person name is required",
                })}
              />
              {errors.contactperson && (
                <div className="invalid-feedback">
                  {errors.contactperson.message}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Phone number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                className={`${errors.storephone && "is-invalid"}  form-control`}
                {...register("storephone", phoneNumberValidation)}
              />
              {errors.storephone && (
                <div className="invalid-feedback">
                  {errors.storephone.message}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="text"
                placeholder="Enter an email id"
                className={`${errors.storeemail && "is-invalid"}  form-control`}
                {...register("storeemail", emailValidation)}
              />
              {errors.storeemail && (
                <div className="invalid-feedback">
                  {errors.storeemail.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletFormTypeC;
