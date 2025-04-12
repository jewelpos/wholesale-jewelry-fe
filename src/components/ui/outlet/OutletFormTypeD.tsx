"use client";

import SelectCountry from "@/components/forms/SelectCountry";
import SelectState from "@/components/forms/SelectState";
import { CreateOutlet } from "@/types/outlet";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";

interface Props {
  register: UseFormRegister<CreateOutlet>;
  errors: FieldErrors<CreateOutlet>;
  control?: Control<CreateOutlet>;
  selectedCountry: string;
  trigger: UseFormTrigger<CreateOutlet>;
}

const OutletFormTypeD = ({
  register,
  errors,
  control,
  selectedCountry,
  trigger,
}: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body ">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Outlet location details</h4>
            <p>
              Enter the complete address of the outlet, including city, state,
              country, and zip code. Accurate location details help in
              deliveries, customer visits, and store management.
            </p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Address</label>
              <input
                type="text"
                placeholder="Add address"
                className={`${errors.address && "is-invalid"}  form-control`}
                {...register("address", {
                  required: "Address is required",
                })}
              />
              {errors.address && (
                <div className="invalid-feedback">{errors.address.message}</div>
              )}
            </div>
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
            <div className="mb-3">
              <label className="form-label">City</label>
              <input
                type="text"
                placeholder="Enter outlet's city"
                className={`${errors.city && "is-invalid"}  form-control`}
                {...register("city", {
                  required: "City is required",
                })}
              />
              {errors.city && (
                <div className="invalid-feedback">{errors.city.message}</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Postal code</label>
              <input
                type="text"
                placeholder="Enter outlet's zipcode"
                className={`${errors.zipcode && "is-invalid"}  form-control`}
                {...register("zipcode", {
                  required: "Postal code is required",
                })}
              />
              {errors.zipcode && (
                <div className="invalid-feedback">{errors.zipcode.message}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletFormTypeD;
