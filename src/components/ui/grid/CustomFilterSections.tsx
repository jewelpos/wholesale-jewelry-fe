import React, { useCallback } from "react";
import OutletsFilter from "./OutletsFilter";
import useOutlets from "@/hooks/useOutlets";
import WarehouseFilter from "./WarehouseFilter";
import { useParams } from "next/navigation";
import SupplierFilter from "./SupplierFilter";
import useSupplier from "@/hooks/useSupplier";
import useWarehouse from "@/hooks/useWarehouse";
import { AgGridReact } from "ag-grid-react";
import { useFloatingFilter } from "./FloatingFilterContext";

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
  gridRef?: React.RefObject<AgGridReact | null>;
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
  gridRef,
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
    fetchSuppliersByOutletId,
    loading: suppliersLoading,
    suppliers,
  } = useSupplier();

  const { showFilters, setShowFilters } = useFloatingFilter();

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

  const handleFilterToggle = (show: boolean) => {
    setShowFilters(show);
  };

  return (
    <div className="container-fluid my-3">
      <div className="row g-2 align-items-center">
        <div className="col-12 col-md-auto d-flex align-items-center gap-2">
          <div className="input-group" style={{ width: 280 }}>
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
          {gridRef && (
            <div
              className="form-check form-switch d-flex align-items-center gap-1 mb-0"
              style={{ paddingLeft: 0 }}
            >
              <input
                type="checkbox"
                className="form-check-input"
                id="advancedFiltersToggle"
                checked={showFilters}
                onChange={(e) => handleFilterToggle(e.target.checked)}
                style={{ cursor: "pointer", marginLeft: 0 }}
              />
              <label
                className="form-check-label"
                htmlFor="advancedFiltersToggle"
                style={{ cursor: "pointer", fontSize: 12, color: "#64748b", userSelect: "none" }}
              >
                Filters
              </label>
            </div>
          )}
        </div>
        {setSelectedOutlet && (
          <div className="col-12 col-md-5 col-lg-3 ms-md-auto">
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
          <div className={`col-12 col-md-5 col-lg-3${!setSelectedOutlet ? " ms-md-auto" : ""}`}>
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
          <div className={`col-12 col-md-5 col-lg-3${!setSelectedOutlet && !setSelectedWarehouse ? " ms-md-auto" : ""}`}>
            <SupplierFilter
              fetchSuppliersList={fetchSuppliersByStoreId}
              fetchSuppliersByOutletId={fetchSuppliersByOutletId}
              suppliers={suppliers}
              loading={suppliersLoading}
              setSelectedSupplier={setSelectedSupplier}
              selectedSupplier={selectedSupplier}
              outletId={selectedOutlet}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFilterSections;
