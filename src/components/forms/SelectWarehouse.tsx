"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useWarehouse from "@/hooks/useWarehouse";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectWarehouse = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  outletId,
  disableField,
  isSystemOnly,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchWarehouseByStoreId, fetchWarehouseByOutletId, warehouses, loading } = useWarehouse();

  useEffect(() => {
    if (outletId) {
      fetchWarehouseByOutletId(outletId);
    } else if (storeId) {
      fetchWarehouseByStoreId(storeId);
    }
  }, [fetchWarehouseByStoreId, fetchWarehouseByOutletId, storeId, outletId]);

  const warehouseOptions: SelectOption[] = useMemo(() => {
    let warehousesFiltered = warehouses;
    if (isSystemOnly) {
      warehousesFiltered = warehousesFiltered.filter(
        (warehouse: { issystem: boolean }) => warehouse.issystem
      );
    }
    return warehousesFiltered.map(
      (warehouse: { warehouseid: number; warehousename: string }) => ({
        value: warehouse.warehouseid,
        label: warehouse.warehousename,
      })
    );
  }, [warehouses]);

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={warehouseOptions}
      placeholder="Select warehouse"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value != null && value !== "" && value !== 0
          ? {
              value: value,
              label:
                warehouseOptions.find(
                  (warehouse) => String(warehouse.value) === String(value)
                )?.label || "",
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
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectWarehouse;
