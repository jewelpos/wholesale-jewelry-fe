"use client";

import React from "react";
import { GetStoreCategoryData, CreateStore } from "@/types/store";
import { useQuery } from "@apollo/client";
import Select from "react-select";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { GET_STORE_CATEGORY_QUERY } from "@/lib/graphql/query/store";
import { SelectOption } from "@/types/form";

interface Props {
  register: UseFormRegister<CreateStore>;
  errors: FieldErrors<CreateStore>;
  control: Control<CreateStore>;
}

const StoreInputs = ({ register, errors, control }: Props) => {
  const {
    data: storeCategoryData,
    loading: storeCategoryLoading,
    error: storeCategoryError,
  } = useQuery<GetStoreCategoryData>(GET_STORE_CATEGORY_QUERY);

  return (
    <div className="card-body">
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store name</label>
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
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store category</label>
            <Controller
              name="storetypeid"
              control={control}
              rules={{ required: "Store category is required" }}
              render={({ field }) => (
                <Select<SelectOption>
                  {...field}
                  isLoading={storeCategoryLoading}
                  options={storeCategoryData?.getStoreCategory.map(
                    (category) => ({
                      value: category.id,
                      label: category.name,
                    })
                  )}
                  placeholder="Select store category"
                  isClearable
                  className={`${
                    errors.storetypeid && "is-invalid"
                  }  form-control p-0`}
                  value={
                    field.value
                      ? {
                          value: field.value,
                          label:
                            storeCategoryData?.getStoreCategory.find(
                              (cat) => cat.id === field.value
                            )?.name || "",
                        }
                      : null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
            {errors.storetypeid && (
              <div className="invalid-feedback">
                {errors.storetypeid.message}
              </div>
            )}
            {storeCategoryError && (
              <div className="invalid-feedback">
                Store categories are not available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreInputs;
