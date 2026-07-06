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
            <button
              type="button"
              onClick={() => handleFilterToggle(!showFilters)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", fontSize: 12, fontWeight: 600,
                borderRadius: 6, border: showFilters ? "1px solid #6366f1" : "1px solid #dee2e6",
                background: showFilters ? "#eef2ff" : "#fff",
                color: showFilters ? "#6366f1" : "#64748b",
                cursor: "pointer", whiteSpace: "nowrap", transition: "0.15s",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
              </svg>
              Filters
            </button>
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
