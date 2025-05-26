import React, { Dispatch, SetStateAction, useEffect } from "react";
import Select from "react-select";
import { useParams } from "next/navigation";
import { WarehouseType } from "@/types/warehouse";
import { Col, Row } from "react-bootstrap";

interface WarehouseFilterProps {
  fetchWarehousesList: (parsedStoreId: number) => void;
  warehouses: WarehouseType[];
  loading: boolean;
  setSelectedWarehouse: Dispatch<SetStateAction<number>>;
  selectedWarehouse: number | undefined;
}

const WarehouseFilter = ({
  fetchWarehousesList,
  warehouses,
  loading,
  setSelectedWarehouse,
  selectedWarehouse,
}: WarehouseFilterProps) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);

  useEffect(() => {
    if (parsedStoreId) {
      fetchWarehousesList(parsedStoreId);
    }
  }, [parsedStoreId, fetchWarehousesList]);

  const warehouseList = [
    { label: "All", value: -1 },
    ...warehouses.map((warehouse) => ({
      label: warehouse.warehousename,
      value: warehouse.warehouseid,
    })),
  ];
  return (
    <Row className="d-flex align-items-center justify-content-center">
      <Col xs={6} className="mr-0 ">
        <h6 className="p-0 m-0">Select Warehouse</h6>
      </Col>
      <Col xs={6} className="p-0 m-0">
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
          styles={{
            container: (provided) => ({ ...provided, width: "10rem" }),
          }}
        />
      </Col>
    </Row>
  );
};

export default WarehouseFilter;
