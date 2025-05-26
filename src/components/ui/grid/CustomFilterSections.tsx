import React from "react";
import OutletsFilter from "./OutletsFilter";
import useOutlets from "@/hooks/useOutlets";
import WarehouseFilter from "./WarehouseFilter";
import useWarehouse from "@/hooks/useWarehouse";
import { useParams } from "next/navigation";

interface Props {
  search?: string;
  setSearch?: React.Dispatch<React.SetStateAction<string>>;
  selectedOutlet?: number | undefined;
  setSelectedOutlet?: React.Dispatch<React.SetStateAction<number | undefined>>;
  selectedWarehouse?: number | undefined;
  setSelectedWarehouse?: React.Dispatch<React.SetStateAction<number>>;
}

const CustomFilterSections = ({
  search,
  setSearch,
  selectedOutlet,
  setSelectedOutlet,
  selectedWarehouse,
  setSelectedWarehouse,
}: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const {
    fetchWarehouseByStoreId,
    loading: warehousesLoading,
    warehouses,
  } = useWarehouse();
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
              fetchWarehousesList={fetchWarehouseByStoreId}
              warehouses={warehouses}
              loading={warehousesLoading}
              setSelectedWarehouse={setSelectedWarehouse}
              selectedWarehouse={selectedWarehouse}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFilterSections;
