"use client";

import React from "react";
import { CreateStore } from "@/types/store";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { CreateOutlet } from "@/types/outlet";
import { useParams } from "next/navigation";

interface Props {
  register: UseFormRegister<CreateStore | CreateOutlet>;
  errors: FieldErrors<CreateStore | CreateOutlet>;
}

const OutletContactInputs = ({ register, errors }: Props) => {
  const { storeId } = useParams();

  return (
    <div className="card-body">
      <div className="row">
        {storeId && (
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Outlet name</label>
              <input
                type="text"
                className={`${errors.outletname && "is-invalid"}  form-control`}
                {...register("outletname", {
                  required: "Outlet name is required",
                })}
              />
              {errors.outletname && (
                <div className="invalid-feedback">
                  {errors.outletname.message}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store person</label>
            <input
              type="text"
              className={`${
                errors.contactperson && "is-invalid"
              }  form-control`}
              {...register("contactperson", {
                required: "Store person name is required",
              })}
            />
            {errors.contactperson && (
              <div className="invalid-feedback">
                {errors.contactperson.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone number</label>
            <input
              type="text"
              className={`${errors.storephone && "is-invalid"}  form-control`}
              {...register("storephone", phoneNumberValidation)}
            />
            {errors.storephone && (
              <div className="invalid-feedback">
                {errors.storephone.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
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
  );
};

export default OutletContactInputs;
