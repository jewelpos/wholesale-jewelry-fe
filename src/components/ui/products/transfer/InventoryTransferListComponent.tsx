"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { InventoryTransfer } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import InventoryTransferItemsComponent from "./transferItems/InventoryTransferItemsComponent";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_INVENTORY_TRANSFER_LIST_QUERY } from "@/lib/graphql/query/products";
import { inventoryTransferColumnDefs } from "./ColumnDef";
import InventoryTransferListHeader from "./InventoryTransferListHeader";

const InventoryTransferListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getInventoryTransferList] = useLazyQuery(
    GET_INVENTORY_TRANSFER_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    number | undefined
  >(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<InventoryTransfer>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        let filtersMain = filterVariables(
          params,
          debouncedSearch,
          "transfersource, destination, transfertype, username"
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
          const { data } = await getInventoryTransferList({
            variables: {
              storeid: parsedStoreId,
              ...filtersMain,
            },
          });
          if (data.getInventoryTransferList) {
            params.success({
              rowData: data.getInventoryTransferList.data,
              rowCount: data.getInventoryTransferList.total,
            });
            if (!data.getInventoryTransferList.data.length) {
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
      parsedStoreId,
      dispatch,
      getInventoryTransferList,
      debouncedSearch,
      selectedWarehouse,
    ]
  );

  const columnDefs = useMemo(() => inventoryTransferColumnDefs, []);

  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedWarehouse, gridReady, parsedStoreId]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  return (
    <>
      <InventoryTransferListHeader />
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
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              masterDetail
              detailCellRenderer={InventoryTransferItemsComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryTransferListComponent;
