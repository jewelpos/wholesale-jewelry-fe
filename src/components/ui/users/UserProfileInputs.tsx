"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { AddUserFormType } from "@/types/user";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  register: UseFormRegister<AddUserFormType>;
  errors: FieldErrors<AddUserFormType>;
}

const UserProfileInputs = ({ register, errors }: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mt-4">
        <div className="row">
          <div className="col-md-3 mb-3">
            <h4 className="mb-2">Profile</h4>
            <p>Personal and contact information for this user.</p>
          </div>
          <div className="col-md-1"></div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Display name</label>
              <input
                type="text"
                className={`${
                  errors.userfullname && "is-invalid"
                }  form-control`}
                {...register("userfullname", {
                  required: "Outlet name is required",
                })}
              />
              {errors.userfullname && (
                <div className="invalid-feedback">
                  {errors.userfullname.message}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Phone number</label>
              <input
                type="text"
                className={`${errors.userphone && "is-invalid"}  form-control`}
                {...register("userphone", phoneNumberValidation)}
              />
              {errors.userphone && (
                <div className="invalid-feedback">
                  {errors.userphone.message}
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="text"
                className={`${
                  errors.emailaddress && "is-invalid"
                }  form-control`}
                {...register("emailaddress", emailValidation)}
              />
              {errors.emailaddress && (
                <div className="invalid-feedback">
                  {errors.emailaddress.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInputs;
