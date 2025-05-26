"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useSupplier from "@/hooks/useSupplier";

const SelectSupplier = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchSuppliersByStoreId, suppliers, loading } = useSupplier();

  useEffect(() => {
    if (storeId && !disableField) {
      fetchSuppliersByStoreId(storeId);
    }
  }, [fetchSuppliersByStoreId, storeId, disableField]);

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
    <>
      {disableField ? (
        <input type="text" className="form-control" value={value} disabled />
      ) : (
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
      )}
    </>
  );
};

export default SelectSupplier;
