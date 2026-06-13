import React, { Dispatch, SetStateAction, useEffect } from "react";
import Select from "react-select";
import { WarehouseType } from "@/types/warehouse";
import { Col, Row } from "react-bootstrap";

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

  const selectEl = (
    <Select
      className="img-select"
      classNamePrefix="react-select"
      options={warehouseList}
      value={
        selectedWarehouse
          ? {
              value: selectedWarehouse,
              label:
                warehouseList.find((w) => w.value === selectedWarehouse)
                  ?.label || "",
            }
          : null
      }
      onChange={(option) => {
        const parsedId = parseInt(option?.value as unknown as string, 10);
        setSelectedWarehouse(parsedId);
      }}
      isLoading={loading}
      isClearable
      styles={stacked ? undefined : { container: (provided) => ({ ...provided, width: "10rem" }) }}
    />
  );

  if (stacked) {
    return (
      <div>
        <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Warehouse</label>
        {selectEl}
      </div>
    );
  }

  return (
    <Row className="d-flex align-items-center justify-content-center">
      <Col xs={6} className="mr-0 text-end">
        <h6 className="p-0 m-0">Select Warehouse</h6>
      </Col>
      <Col xs={6} className="p-0 m-0">
        {selectEl}
      </Col>
    </Row>
  );
};

export default WarehouseFilter;
