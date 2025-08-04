"use client";

import { AddUserFormType } from "@/types/user";
import React, { useMemo } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormTrigger,
} from "react-hook-form";
import { SelectOption } from "@/types/form";
import Select from "react-select";
import { OutletsType } from "@/types/outlet";

interface Props {
  errors: FieldErrors<AddUserFormType>;
  control: Control<AddUserFormType>;
  outletsLoading: boolean;
  outlets: OutletsType;
  selectedOutlets: SelectOption[];
  trigger: UseFormTrigger<AddUserFormType>;
}

type OutletSelectOption = SelectOption;

const UserOutletInputs = ({
  errors,
  control,
  outletsLoading,
  outlets,
  selectedOutlets,
  trigger,
}: Props) => {
  const outletsOptions: OutletSelectOption[] = useMemo(
    () =>
      outlets.map((outlet) => ({
        value: outlet.outletid,
        label: outlet.outletname,
      })),

    [outlets]
  );

  const defaultOutletOptions: OutletSelectOption[] = useMemo(
    () =>
      selectedOutlets.map((outlet) => ({
        value: outlet.value,
        label: outlet.label,
      })),

    [selectedOutlets]
  );

  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mb-4 mt-4">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Outlets</h4>
            <p>Outlet assigned to this user that they can work at.</p>
          </div>
          <div className="col-md-7">
            <div className="row">
              <div className="col-sm-12 col-md-12 col-lg-12">
                <div className="mb-3">
                  <label className="form-label">Outlets</label>
                  <Controller
                    name="outlets"
                    control={control}
                    rules={{ required: "Outlets is required" }}
                    render={({ field }) => (
                      <Select<SelectOption, true>
                        {...field}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption);
                          trigger("outlets");
                        }}
                        isMulti
                        isLoading={outletsLoading}
                        options={outletsOptions}
                        placeholder="Select an outlet"
                        className={`${
                          errors.outlets && "is-invalid"
                        }  form-control p-0`}
                      />
                    )}
                  />
                  {errors.outlets && (
                    <div className="invalid-feedback">
                      {errors.outlets.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {defaultOutletOptions.length > 0 && (
              <div className="row">
                <div className="col-sm-12 col-md-12 col-lg-12">
                  <div className="mb-3">
                    <label className="form-label">Default Outlet</label>
                    <Controller
                      name="defaultoutletid"
                      control={control}
                      rules={{ required: "Default Outlet is required" }}
                      render={({ field }) => (
                        <Select<SelectOption>
                          {...field}
                          value={
                            defaultOutletOptions.find(
                              (option) => option.value === field.value
                            ) || null
                          }
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value);
                            trigger("defaultoutletid");
                          }}
                          isLoading={outletsLoading}
                          options={defaultOutletOptions}
                          placeholder="Select an outlet"
                          className={`${
                            errors.defaultoutletid && "is-invalid"
                          } form-control p-0`}
                        />
                      )}
                    />
                    {errors.defaultoutletid && (
                      <div className="invalid-feedback">
                        {errors.defaultoutletid.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOutletInputs;
