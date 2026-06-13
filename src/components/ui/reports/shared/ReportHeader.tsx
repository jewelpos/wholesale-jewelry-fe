"use client";

import React, { useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import useMenu from "@/hooks/useMenu";
import { useParams } from "next/navigation";
import OutletsFilter from "@/components/ui/grid/OutletsFilter";
import WarehouseFilter from "@/components/ui/grid/WarehouseFilter";
import useOutlets from "@/hooks/useOutlets";
import useWarehouse from "@/hooks/useWarehouse";

interface Props {
  selectedOutlet?: number;
  setSelectedOutlet?: React.Dispatch<React.SetStateAction<number | undefined>>;
  selectedWarehouse?: number;
  setSelectedWarehouse?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const ReportHeader = ({
  selectedOutlet,
  setSelectedOutlet,
  selectedWarehouse,
  setSelectedWarehouse,
}: Props) => {
  const { currentMenu } = useMenu();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const { fetchWarehouseByStoreId, fetchWarehouseByOutletId, loading: warehousesLoading, warehouses } = useWarehouse();

  const fetchWarehousesList = useCallback(() => {
    if (selectedOutlet) {
      fetchWarehouseByOutletId(selectedOutlet);
    } else {
      fetchWarehouseByStoreId(parsedStoreId);
    }
  }, [fetchWarehouseByOutletId, fetchWarehouseByStoreId, selectedOutlet, parsedStoreId]);

  const hasFilters = !!(setSelectedOutlet || setSelectedWarehouse);

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname ?? ""}
      subtitle={currentMenu?.permissiondescription}
      rightSection={
        hasFilters ? (
          <div className="d-flex align-items-end gap-2">
            {setSelectedOutlet && (
              <div style={{ width: 180 }}>
                <OutletsFilter
                  fetchOutletsList={fetchOutletsList}
                  outlets={outlets}
                  loading={outletsLoading}
                  setSelectedOutlet={setSelectedOutlet}
                  selectedOutlet={selectedOutlet}
                  stacked
                />
              </div>
            )}
            {setSelectedWarehouse && (
              <div style={{ width: 170 }}>
                <WarehouseFilter
                  fetchWarehousesList={fetchWarehousesList}
                  warehouses={warehouses}
                  loading={warehousesLoading}
                  setSelectedWarehouse={setSelectedWarehouse}
                  selectedWarehouse={selectedWarehouse}
                  stacked
                />
              </div>
            )}
          </div>
        ) : undefined
      }
    />
  );
};

export default ReportHeader;
