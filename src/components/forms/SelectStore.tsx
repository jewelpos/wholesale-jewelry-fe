"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";
import useStores from "@/hooks/useStores";

const SelectStore = ({
  value,
  onChange,
  className,
  trigger,
  setValue,
  storeId,
  disableField,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const allStores = useAppSelector((state) => state.stores.data);
  const { fetchStoresData, loading: storesLoading } = useStores();

  const storeOptions: SelectOption[] = useMemo(
    () =>
      allStores.map((stores) => ({
        value: stores.storeid,
        label: stores.storename,
      })),
    [allStores]
  );

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

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
    <Select<SelectOption>
      isLoading={storesLoading}
      options={storeOptions}
      placeholder="Select store category"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                storeOptions.find((store) => store.value === value)?.label ||
                "",
            }
          : null
      }
      onChange={(option) => {
        onChange(option?.value);
        trigger(field.name);
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      {...field}
    />
  );
};

export default SelectStore;
