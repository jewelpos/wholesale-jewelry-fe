"use client";

import { AddUserFormType } from "@/types/user";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { SelectOption } from "@/types/form";
import Select from "react-select";
import { OutletsType } from "@/types/outlet";

interface Props {
  errors: FieldErrors<AddUserFormType>;
  control: Control<AddUserFormType>;
  outletsLoading: boolean;
  outlets: OutletsType;
}

const UserOutletInputs = ({
  errors,
  control,
  outletsLoading,
  outlets,
}: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mb-4 mt-4">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Outlets</h4>
            <p>Outlet assigned to this user that they can work at.</p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Outlets</label>
              <Controller
                name="outletid"
                control={control}
                rules={{ required: "Outlet is required" }}
                render={({ field }) => (
                  <Select<SelectOption>
                    {...field}
                    isLoading={outletsLoading}
                    options={outlets.map((outlet) => ({
                      value: outlet.outletid,
                      label: outlet.outletname,
                    }))}
                    placeholder="Select an outlet"
                    isClearable={outlets?.length > 1}
                    className={`${
                      errors.outletid && "is-invalid"
                    }  form-control p-0`}
                    value={
                      field.value
                        ? {
                            value: field.value,
                            label:
                              outlets.find(
                                (outlt) => outlt.outletid === field.value
                              )?.outletname || "",
                          }
                        : null
                    }
                    onChange={(option) => field.onChange(option?.value)}
                  />
                )}
              />
              {errors.outletid && (
                <div className="invalid-feedback">
                  {errors.outletid.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOutletInputs;
