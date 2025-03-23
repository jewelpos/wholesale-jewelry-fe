"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useWarehouse from "@/hooks/useWarehouse";

const SelectWarehouse = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchWarehouseByStoreId, warehouses, loading } = useWarehouse();

  useEffect(() => {
    if (storeId) {
      fetchWarehouseByStoreId(storeId);
    }
  }, [fetchWarehouseByStoreId, storeId]);

  const warehouseOptions: SelectOption[] = useMemo(
    () =>
      warehouses.map(
        (warehouse: { warehouseid: number; warehousename: string }) => ({
          value: warehouse.warehouseid,
          label: warehouse.warehousename,
        })
      ),
    [warehouses]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={warehouseOptions}
      placeholder="Select store category"
      isClearable
      className={`form-control p-0 ${className}`}
      value={
        value
          ? {
              value: value,
              label:
                warehouseOptions.find((warehouse) => warehouse.value === value)
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
  );
};

export default SelectWarehouse;
