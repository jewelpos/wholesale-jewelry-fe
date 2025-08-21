import React, { useCallback } from "react";
import OutletsFilter from "./OutletsFilter";
import useOutlets from "@/hooks/useOutlets";
import WarehouseFilter from "./WarehouseFilter";
import { useParams } from "next/navigation";
import SupplierFilter from "./SupplierFilter";
import useSupplier from "@/hooks/useSupplier";
import useWarehouse from "@/hooks/useWarehouse";

interface Props {
  search?: string;
  setSearch?: React.Dispatch<React.SetStateAction<string>>;
  selectedOutlet?: number | undefined;
  setSelectedOutlet?: React.Dispatch<React.SetStateAction<number | undefined>>;
  selectedWarehouse?: number | undefined;
  setSelectedWarehouse?: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
  selectedSupplier?: number | undefined;
  setSelectedSupplier?: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
}

const CustomFilterSections = ({
  search,
  setSearch,
  selectedOutlet,
  setSelectedOutlet,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedSupplier,
  setSelectedSupplier,
}: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const {
    fetchWarehouseByStoreId,
    fetchWarehouseByOutletId,
    loading: warehousesLoading,
    warehouses,
  } = useWarehouse();
  const {
    fetchSuppliersByStoreId,
    loading: suppliersLoading,
    suppliers,
  } = useSupplier();

  // Determine which warehouse fetch function to use based on selected outlet
  const fetchWarehousesList = useCallback(() => {
    if (selectedOutlet) {
      fetchWarehouseByOutletId(selectedOutlet);
    } else {
      fetchWarehouseByStoreId(parsedStoreId);
    }
  }, [
    fetchWarehouseByOutletId,
    fetchWarehouseByStoreId,
    selectedOutlet,
    parsedStoreId,
  ]);

  return (
    <div className="container-fluid my-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div className="input-group w-50 w-md-100">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
          />
          <span className="input-group-text">
            <i data-feather="search" className="feather-search" />
          </span>
        </div>
        {setSelectedOutlet && (
          <div className="d-flex align-items-center w-25 w-md-100">
            <OutletsFilter
              fetchOutletsList={fetchOutletsList}
              outlets={outlets}
              loading={outletsLoading}
              setSelectedOutlet={setSelectedOutlet}
              selectedOutlet={selectedOutlet}
            />
          </div>
        )}
        {setSelectedWarehouse && (
          <div className="d-flex align-items-center w-25 w-md-100">
            <WarehouseFilter
              fetchWarehousesList={fetchWarehousesList}
              warehouses={warehouses}
              loading={warehousesLoading}
              setSelectedWarehouse={setSelectedWarehouse}
              selectedWarehouse={selectedWarehouse}
            />
          </div>
        )}
        {setSelectedSupplier && (
          <div className="d-flex align-items-center w-25 w-md-100">
            <SupplierFilter
              fetchSuppliersList={fetchSuppliersByStoreId}
              suppliers={suppliers}
              loading={suppliersLoading}
              setSelectedSupplier={setSelectedSupplier}
              selectedSupplier={selectedSupplier}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFilterSections;
