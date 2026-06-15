"use client";

import { AddUserFormType } from "@/types/user";
import React, { useEffect, useMemo } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  Path,
  PathValue,
} from "react-hook-form";
import Select, { MultiValue } from "react-select";
import { useAppSelector } from "@/lib/store/hook";
import { SelectOption } from "@/types/form";
import { useParams } from "next/navigation";

type UseFormSetValue<TFieldValues> = (
  name: Path<TFieldValues>,
  value: PathValue<TFieldValues, Path<TFieldValues>>,
  options?: {
    shouldValidate?: boolean;
    shouldDirty?: boolean;
    shouldTouch?: boolean;
  }
) => void;

interface Props {
  errors: FieldErrors<AddUserFormType>;
  control: Control<AddUserFormType>;
  storesLoading: boolean;
  setValue: UseFormSetValue<AddUserFormType>;
  storeId: number;
}

const UserStoreInputs = ({
  errors,
  control,
  storesLoading,
  setValue,
  storeId,
}: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const allStores = useAppSelector((state) => state.stores.data);

  const storeOptions: SelectOption[] = useMemo(
    () =>
      allStores.map((stores) => ({
        value: stores.storeid,
        label: stores.storename,
      })),
    [allStores]
  );

  useEffect(() => {
    if (!storeId && storeOptions.length) {
      const storeOption: SelectOption | undefined = storeOptions.find(
        (store) => store.value === parsedStoreId
      );
      if (storeOption) {
        setValue("storeid", storeOption.value, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [storeOptions, parsedStoreId, storeId, setValue]);

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
              <label className="form-label">Stores <span className="text-danger">*</span></label>
              <Controller
                name="storeid"
                control={control}
                rules={{ required: "Store is required" }}
                render={({ field: { value, onChange } }) => (
                  <Select<SelectOption>
                    isLoading={storesLoading}
                    options={storeOptions}
                    placeholder="Select a store"
                    className={`${
                      errors.storeid && "is-invalid"
                    }  form-control p-0`}
                    value={
                      value
                        ? {
                            value: value,
                            label:
                              storeOptions.find(
                                (store) => store.value === value
                              )?.label || "",
                          }
                        : null
                    }
                    onChange={(option) => {
                      onChange(option?.value);
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
