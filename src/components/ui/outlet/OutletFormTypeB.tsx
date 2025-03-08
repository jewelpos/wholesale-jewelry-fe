"use client";

import { CreateOutlet } from "@/types/outlet";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  register: UseFormRegister<CreateOutlet>;
  errors: FieldErrors<CreateOutlet>;
}

const OutletFormTypeB = ({ register, errors }: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body ">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Outlet name</h4>
            <p>
              Enter a name for your outlet. This helps differentiate multiple
              locations under the same store.
            </p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Outlet name</label>
              <input
                type="text"
                placeholder="Enter outlet name"
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
        </div>
      </div>
    </div>
  );
};

export default OutletFormTypeB;
