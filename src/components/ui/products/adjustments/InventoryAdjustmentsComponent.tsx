"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_INVENTORY_ADJUSTMENT_LIST_QUERY } from "@/lib/graphql/query/products";
import { InventoryAdjustment } from "@/types/product";
import "ag-grid-enterprise";
import { inventoryAdjustmentColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useParams } from "next/navigation";
import POSGrid from "../../grid/POSGrid";
import InventoryAdjustmentsHeader from "./InventoryAdjustmentsHeader";

const InventoryAdjustmentsComponent = () => {
  const [getInventoryAdjustmentList] = useLazyQuery(
    GET_INVENTORY_ADJUSTMENT_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(-1);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const handleOnGridReady = (params: GridReadyEvent<InventoryAdjustment>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "itemcode, description"
        );
        if (selectedWarehouse !== -1) {
          filtersMain = {
            ...filtersMain,
            filters: [
              ...filtersMain.filters,
              {
                key: "warehouseid",
                value: {
                  filterType: "text",
                  type: "equals",
                  filter: selectedWarehouse,
                },
              },
            ],
          };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getInventoryAdjustmentList({
            variables: {
              storeid: parsedStoreId,
              ...filtersMain,
            },
          });
          if (data.getInventoryAdjustmentList) {
            params.success({
              rowData: data.getInventoryAdjustmentList.data,
              rowCount: data.getInventoryAdjustmentList.total,
            });
            if (!data.getInventoryAdjustmentList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(
            showNotification({
              message: result.error,
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
          params.fail();
        }
      },
    }),
    [
      debouncedSearch,
      selectedWarehouse,
      dispatch,
      getInventoryAdjustmentList,
      parsedStoreId,
    ]
  );

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, parsedStoreId, gridReady]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [debouncedSearch, gridReady, datasource, selectedWarehouse]);

  return (
    <>
      <InventoryAdjustmentsHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={inventoryAdjustmentColumnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryAdjustmentsComponent;
