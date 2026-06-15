"use client";

import { passwordValidation } from "@/lib/utils/validations/authValidations";
import { AddUserFormType } from "@/types/user";
import React, { useState } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  register: UseFormRegister<AddUserFormType>;
  errors: FieldErrors<AddUserFormType>;
  password: string;
}

const UserSecurityInputs = ({ register, errors, password }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${errors.password ? "is-invalid" : ""} form-control`}
                      {...register("password", passwordValidation)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Confirm password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`${errors.confirmpassword ? "is-invalid" : ""} form-control`}
                      {...register("confirmpassword", {
                        required: "Confirm password is required",
                        validate: (value) =>
                          value === password || "Passwords do not match",
                      })}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
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
    </div>
  );
};

export default UserSecurityInputs;
