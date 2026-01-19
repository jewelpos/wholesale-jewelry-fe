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
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../../grid/POSGrid";
import { useParams } from "next/navigation";
import {
  InventoryTransfer,
  InventoryItemTransferDetail,
} from "@/types/product";
import { GET_INVENTORY_TRANSFER_ITEM_PAGED_QUERY } from "@/lib/graphql/query/products";
import inventoryTransferItemsColumnDefs from "./ColumnDef";

interface Props {
  data: InventoryTransfer;
}

const InventoryTransferItemsComponent = ({ data }: Props) => {
  const [getInventoryTransferItem] = useLazyQuery(
    GET_INVENTORY_TRANSFER_ITEM_PAGED_QUERY
  );
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<InventoryItemTransferDetail>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data: transferItemData } = await getInventoryTransferItem({
            variables: {
              inventoryitemtransferid: data.inventoryitemtransferid,
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (transferItemData.getInventoryTransferItem) {
            params.success({
              rowData: transferItemData.getInventoryTransferItem.data,
              rowCount: transferItemData.getInventoryTransferItem.total,
            });
            if (!transferItemData.getInventoryTransferItem.data.length) {
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
    [dispatch, getInventoryTransferItem, data.inventoryitemtransferid, parsedStoreId]
  );

  useEffect(() => {
    if (data.inventoryitemtransferid && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, data.inventoryitemtransferid, parsedStoreId]);

  return (
    <div className="card table-list-card bg-gray-200">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={inventoryTransferItemsColumnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryTransferItemsComponent;
