"use client";

import { AddUserFormType } from "@/types/user";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormTrigger,
} from "react-hook-form";
import { SelectOption } from "@/types/form";
import Select from "react-select";
import { useAppSelector } from "@/lib/store/hook";

interface Props {
  errors: FieldErrors<AddUserFormType>;
  control: Control<AddUserFormType>;
  storesLoading: boolean;
  fetchOutletsList: (storeId: number) => Promise<void>;
  trigger: UseFormTrigger<AddUserFormType>;
}

const UserStoreInputs = ({
  errors,
  control,
  storesLoading,
  fetchOutletsList,
  trigger,
}: Props) => {
  const stores = useAppSelector((state) => state.stores.data);
  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mb-4 mt-4">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Stores</h4>
            <p>
              Store for selecting the outlet, assigned to this user that they
              can work at.
            </p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Stores</label>
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
                    placeholder="Select a store"
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
                    onChange={(option) => {
                      field.onChange(option?.value);
                      const parsedStoreId = parseInt(
                        option?.value as string,
                        10
                      );
                      trigger("storeid");
                      fetchOutletsList(parsedStoreId);
                    }}
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

export default UserStoreInputs;
