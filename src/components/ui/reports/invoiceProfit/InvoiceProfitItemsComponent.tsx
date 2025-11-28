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
import POSGrid from "@/components/ui/grid/POSGrid";
import { useParams } from "next/navigation";
import { GET_INVOICE_PROFIT_ITEM_DETAIL_LIST_QUERY } from "@/lib/graphql/query/reports";
import { InvoiceItem, InvoiceSummary } from "@/types/reports";
import { invoiceProfitItemsColumnDefs } from "./ColumnDef";

interface Props {
  data: InvoiceSummary;
}

const InvoiceProfitItemsComponent = ({ data }: Props) => {
  const [getInvoiceProfitItemDetailList] = useLazyQuery(
    GET_INVOICE_PROFIT_ITEM_DETAIL_LIST_QUERY
  );
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<InvoiceItem>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data: itemData } = await getInvoiceProfitItemDetailList({
            variables: {
              storeid: parsedStoreId,
              invoicenumber: parseInt(data.invoicenumber as string, 10),
              ...filters,
            },
          });
          if (itemData.getInvoiceProfitItemDetailList) {
            params.success({
              rowData: itemData.getInvoiceProfitItemDetailList.data,
              rowCount: itemData.getInvoiceProfitItemDetailList.total,
            });
            if (!itemData.getInvoiceProfitItemDetailList.data.length) {
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
    [dispatch, getInvoiceProfitItemDetailList, data.invoicenumber, parsedStoreId]
  );

  useEffect(() => {
    if (data.invoicenumber && parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, data.invoicenumber, parsedStoreId]);

  return (
    <div className="card table-list-card bg-gray-200">
      <div className="card-body p-2">
        <div className="ag-theme-quartz custom-theme">
          <POSGrid
            ref={gridRef}
            columnDefs={invoiceProfitItemsColumnDefs}
            onGridReady={handleOnGridReady}
            domLayout="autoHeight"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceProfitItemsComponent;

