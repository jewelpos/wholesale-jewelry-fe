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
import POSGrid from "../../grid/POSGrid";
import { useParams } from "next/navigation";
import { GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { PurchaseOrderItem, PurchaseOrder } from "@/types/purchase";
import purchaseOrderItemsColumnDefs from "./ColumnDef";

interface Props {
  data: PurchaseOrder;
}

const PurchaseOrderItemsComponent = ({ data }: Props) => {
  const [getPurchaseOrderItemsList] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY
  );
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<PurchaseOrderItem>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data: poItemData } = await getPurchaseOrderItemsList({
            variables: {
              ponumber: parseInt(data.ponumber, 10),
              storeid: parsedStoreId,
              ...filters,
            },
          });
          if (poItemData.getSupplierPurchaseOrderItemsList) {
            params.success({
              rowData: poItemData.getSupplierPurchaseOrderItemsList.data,
              rowCount: poItemData.getSupplierPurchaseOrderItemsList.total,
            });
            if (!poItemData.getSupplierPurchaseOrderItemsList.data.length) {
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
    [dispatch, getPurchaseOrderItemsList, data.ponumber, parsedStoreId]
  );

  useEffect(() => {
    if (data.ponumber && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, data.ponumber, parsedStoreId]);

  return (
    <div className="card table-list-card bg-gray-200">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={purchaseOrderItemsColumnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderItemsComponent;
