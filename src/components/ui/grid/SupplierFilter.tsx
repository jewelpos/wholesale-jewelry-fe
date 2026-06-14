import React, { Dispatch, SetStateAction, useEffect } from "react";
import Select from "react-select";
import { useParams } from "next/navigation";
import { SupplierType } from "@/types/supplier";
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

  const supplierList = suppliers.map((supplier) => ({
    label: supplier.companyname,
    value: supplier.supplierid,
  }));

  return (
    <div className="filter-select-wrap w-100">
      <Select
        className="w-100"
        classNamePrefix="react-select"
        placeholder="Select Supplier"
        options={supplierList}
        value={
          selectedSupplier
            ? {
                value: selectedSupplier,
                label: supplierList.find((s) => s.value === selectedSupplier)?.label || "",
              }
            : null
        }
        onChange={(option) =>
          setSelectedSupplier(option ? parseInt(option.value as unknown as string, 10) : undefined)
        }
        isLoading={loading}
        isClearable
        styles={filterSelectStyles}
      />
    </div>
  );
};

export default SupplierFilter;
