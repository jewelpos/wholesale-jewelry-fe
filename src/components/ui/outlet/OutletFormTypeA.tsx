"use client";

import { useAppSelector } from "@/lib/store/hook";
import { SelectOption } from "@/types/form";
import { CreateOutlet } from "@/types/outlet";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import Select from "react-select";

interface Props {
  errors: FieldErrors<CreateOutlet>;
  control?: Control<CreateOutlet>;
  storesLoading?: boolean;
}

const OutletFormTypeA = ({ errors, control, storesLoading }: Props) => {
  const stores = useAppSelector((state) => state.stores.data);

  return (
    <div className="card table-list-card">
      <div className="card-body">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Store</h4>
            <p>Choose a store from the list to manage outlet.</p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Store</label>
              <Controller
                name="storeid"
                control={control}
                rules={{ required: "Store is required" }}
                render={({ field }) => (
                  <Select<SelectOption>
                    {...field}
                    isLoading={storesLoading}
                    options={stores.map((stores) => ({
                      value: stores.storeid,
                      label: stores.storename,
                    }))}
                    placeholder="Select store"
                    isClearable={stores?.length > 1}
                    className={`${
                      errors.storeid && "is-invalid"
                    }  form-control p-0`}
                    value={
                      field.value
                        ? {
                            value: field.value,
                            label:
                              stores.find((str) => str.storeid === field.value)
                                ?.storename || "",
                          }
                        : null
                    }
                    onChange={(option) => field.onChange(option?.value)}
                  />
                )}
              />
              {errors.storeid && (
                <div className="invalid-feedback">{errors.storeid.message}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletFormTypeA;
