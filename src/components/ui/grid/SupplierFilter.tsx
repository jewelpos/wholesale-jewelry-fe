import React, { Dispatch, SetStateAction, useEffect } from "react";
import Select from "react-select";
import { useParams } from "next/navigation";
import { SupplierType } from "@/types/supplier";
import { Col, Row } from "react-bootstrap";

interface SupplierFilterProps {
  fetchSuppliersList: (parsedStoreId: number) => void;
  fetchSuppliersByOutletId?: (storeId: number, outletId: number) => void;
  suppliers: SupplierType[];
  loading: boolean;
  setSelectedSupplier: Dispatch<SetStateAction<number | undefined>>;
  selectedSupplier: number | undefined;
  outletId?: number;
}

const SupplierFilter = ({
  fetchSuppliersList,
  fetchSuppliersByOutletId,
  suppliers,
  loading,
  setSelectedSupplier,
  selectedSupplier,
  outletId,
}: SupplierFilterProps) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);

  useEffect(() => {
    if (parsedStoreId) {
      if (outletId && fetchSuppliersByOutletId) {
        fetchSuppliersByOutletId(parsedStoreId, outletId);
      } else {
        fetchSuppliersList(parsedStoreId);
      }
    }
  }, [parsedStoreId, outletId, fetchSuppliersList, fetchSuppliersByOutletId]);

  const supplierList = [
    { label: "All", value: -1 },
    ...suppliers.map((supplier) => ({
      label: supplier.companyname,
      value: supplier.supplierid,
    })),
  ];
  return (
    <Row className="d-flex align-items-center justify-content-center">
      <Col xs={6} className="mr-0  text-end">
        <h6 className="p-0 m-0">Select Supplier</h6>
      </Col>
      <Col xs={6} className="p-0 m-0">
        <Select
          className="img-select"
          classNamePrefix="react-select"
          options={supplierList}
          value={
            selectedSupplier
              ? {
                  value: selectedSupplier,
                  label:
                    supplierList.find((s) => s.value === selectedSupplier)
                      ?.label || "",
                }
              : null
          }
          onChange={(option) => {
            const parsedId = parseInt(option?.value as unknown as string, 10);
            setSelectedSupplier(parsedId);
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

export default SupplierFilter;
