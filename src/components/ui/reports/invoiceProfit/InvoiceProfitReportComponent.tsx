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
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY } from "@/lib/graphql/query/reports";
import { InvoiceSummary } from "@/types/reports";
import { invoiceProfitColumnDefs } from "./ColumnDef";
import InvoiceProfitItemsComponent from "./InvoiceProfitItemsComponent";

const InvoiceProfitReportComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getInvoiceProfitSummaryList] = useLazyQuery(
    GET_INVOICE_PROFIT_SUMMARY_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (params: GridReadyEvent<InvoiceSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "invoicenumber, custcompanyname, salemodename, warehousename"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getInvoiceProfitSummaryList({
            variables: {
              storeid: parsedStoreId,
              outletid: parsedOutletId,
              ...filters,
            },
          });
          if (data.getInvoiceProfitSummaryList) {
            params.success({
              rowData: data.getInvoiceProfitSummaryList.data,
              rowCount: data.getInvoiceProfitSummaryList.total,
            });
            if (!data.getInvoiceProfitSummaryList.data.length) {
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
      parsedOutletId,
      dispatch,
      getInvoiceProfitSummaryList,
      debouncedSearch,
    ]
  );

  useEffect(() => {
    if (parsedStoreId && parsedOutletId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, parsedStoreId, parsedOutletId]);

  useEffect(() => {
    if (debouncedSearch && gridReady) {
      gridRef?.current?.api?.setFilterModel(null);
      gridRef?.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, gridReady, debouncedSearch]);

  return (
    <>
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections search={search} setSearch={setSearch} />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={invoiceProfitColumnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              masterDetail
              detailCellRenderer={InvoiceProfitItemsComponent}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceProfitReportComponent;

