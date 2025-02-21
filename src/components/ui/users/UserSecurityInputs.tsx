"use client";

import { passwordValidation } from "@/lib/utils/validations/authValidations";
import { AddUserFormType } from "@/types/user";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  register: UseFormRegister<AddUserFormType>;
  errors: FieldErrors<AddUserFormType>;
  password: string;
}

const UserSecurityInputs = ({ register, errors, password }: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mt-4">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Security and ID</h4>
            <p>Use a secure password to make sure your account stays safe.</p>
          </div>
          <div className="col-md-7">
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`${
                      errors.password && "is-invalid"
                    }  form-control`}
                    {...register("password", passwordValidation)}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">
                      {errors.password.message}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Confirm password</label>
                  <input
                    type="password"
                    className={`${
                      errors.confirmpassword && "is-invalid"
                    }  form-control`}
                    {...register("confirmpassword", {
                      required: "Confirm password is required",
                      validate: (value) =>
                        value === password || "Passwords do not match",
                    })}
                  />

                  {errors.confirmpassword && (
                    <div className="invalid-feedback">
                      {errors.confirmpassword.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSecurityInputs;
