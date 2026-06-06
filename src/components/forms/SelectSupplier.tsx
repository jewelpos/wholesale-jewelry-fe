"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useSupplier from "@/hooks/useSupplier";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectSupplier = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  onChangeAdditional,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchSuppliersByStoreId, suppliers, loading } = useSupplier();

  useEffect(() => {
    if (storeId) {
      fetchSuppliersByStoreId(storeId);
    }
  }, [fetchSuppliersByStoreId, storeId]);

  const supplierOptions: SelectOption[] = useMemo(
    () =>
      suppliers.map(
        (supplier: { supplierid: number; companyname: string }) => ({
          value: supplier.supplierid,
          label: supplier.companyname,
        })
      ),
    [suppliers]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={supplierOptions}
      placeholder="Select supplier"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                supplierOptions.find((supplier) => supplier.value === value)
                  ?.label || "",
            }
          : null
      }
      onChange={(option) => {
        if (onChangeAdditional) onChangeAdditional(option?.value);
        else {
          onChange(option?.value);
          trigger(field.name);
        }
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectSupplier;
