import React, { Dispatch, SetStateAction, useEffect } from "react";
import Select from "react-select";
import { WarehouseType } from "@/types/warehouse";
import { selectStyles } from "@/lib/styles/selectStyles";

const filterSelectStyles = {
  ...selectStyles,
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
  }),
};

interface WarehouseFilterProps {
  fetchWarehousesList: () => void;
  warehouses: WarehouseType[];
  loading: boolean;
  setSelectedWarehouse: Dispatch<SetStateAction<number | undefined>>;
  selectedWarehouse: number | undefined;
  stacked?: boolean;
}

const WarehouseFilter = ({
  fetchWarehousesList,
  warehouses,
  loading,
  setSelectedWarehouse,
  selectedWarehouse,
  stacked,
}: WarehouseFilterProps) => {
  useEffect(() => {
    fetchWarehousesList();
  }, [fetchWarehousesList]);

  const warehouseList = warehouses.map((warehouse) => ({
    label: warehouse.warehousename,
    value: warehouse.warehouseid,
  }));

  useEffect(() => {
    if (warehouses.length) {
      const warehouse = warehouses.find((warehouse) => warehouse.issystem);
      if (warehouse) {
        setSelectedWarehouse(warehouse.warehouseid);
      }
    }
  }, [warehouses, setSelectedWarehouse]);

  if (stacked) {
    return (
      <div>
        <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Warehouse</label>
        <div className="filter-select-wrap">
          <Select
            className="w-100"
            classNamePrefix="react-select"
            options={warehouseList}
            value={selectedWarehouse ? { value: selectedWarehouse, label: warehouseList.find((w) => w.value === selectedWarehouse)?.label || "" } : null}
            onChange={(option) => setSelectedWarehouse(parseInt(option?.value as unknown as string, 10))}
            isLoading={loading}
            isClearable
            styles={filterSelectStyles}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="filter-select-wrap w-100">
      <Select
        className="w-100"
        classNamePrefix="react-select"
        placeholder="Select Warehouse"
        options={warehouseList}
        value={selectedWarehouse ? { value: selectedWarehouse, label: warehouseList.find((w) => w.value === selectedWarehouse)?.label || "" } : null}
        onChange={(option) => setSelectedWarehouse(parseInt(option?.value as unknown as string, 10))}
        isLoading={loading}
        isClearable
        styles={filterSelectStyles}
      />
    </div>
  );
};

export default WarehouseFilter;
