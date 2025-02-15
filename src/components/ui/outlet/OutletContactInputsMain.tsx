"use client";

import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import Select from "react-select";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { CreateOutlet } from "@/types/outlet";
import { useAppSelector } from "@/lib/store/hook";
import { SelectOption } from "@/types/form";

interface Props {
  register: UseFormRegister<CreateOutlet>;
  errors: FieldErrors<CreateOutlet>;
  control?: Control<CreateOutlet>;
  storesLoading?: boolean;
}

const OutletContactInputsMain = ({
  register,
  errors,
  control,
  storesLoading,
}: Props) => {
  const stores = useAppSelector((state) => state.stores.data);

  return (
    <div className="card-body">
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store category</label>
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

export default OutletContactInputsMain;
