"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  GridReadyEvent,
  IServerSideGetRowsParams,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-enterprise";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch } from "@/lib/store/hook";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { GET_MEMO_LIST_QUERY } from "@/lib/graphql/query/sales";
import { MemoSummary, MemoSummaryTotals } from "@/types/sales";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";

const memoColumnDefs: ColDef<MemoSummary>[] = [
  {
    headerName: "Memo number",
    field: "memonumber",
    filter: "agNumberColumnFilter",
  },
  { headerName: "Customer", field: "customerid", filter: "agNumberColumnFilter" },
  { headerName: "Company", field: "companyname", filter: "agTextColumnFilter" },
  {
    headerName: "Date",
    field: "saledate",
    cellRenderer: (params: ICellRendererParams) =>
      params.node.rowPinned === "bottom" || params.value == null
        ? ""
        : dayjs(Number(params.value)).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  { headerName: "Mode", field: "salemodename", filter: "agTextColumnFilter" },
  {
    headerName: "Total items",
    field: "numberofitems",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total amount",
    field: "totalamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Discount amount",
    field: "discountamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Sub total",
    field: "subtotal",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Tax",
    field: "salestax",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Shipping",
    field: "shipping",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Net amount",
    field: "netamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Received amount",
    field: "amountreceived",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due balance",
    field: "balancedue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  { headerName: "Terms", field: "termsname", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  { headerName: "Created by", field: "createby", filter: "agTextColumnFilter" },
  { headerName: "Last modified by", field: "lastmodifiedby", filter: "agTextColumnFilter" },
  {
    headerName: "Last modified date",
    field: "lastmodifieddate",
    filter: "agDateColumnFilter",
  },
  { headerName: "Warehouse ID", field: "warehouseid", filter: "agNumberColumnFilter" },
  { headerName: "Outlet ID", field: "outletid", filter: "agNumberColumnFilter" },
];

const MemoListComponent = () => {
  const [getMemoList] = useLazyQuery(GET_MEMO_LIST_QUERY);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact<MemoSummary>>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();

  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const handleOnGridReady = (params: GridReadyEvent<MemoSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "companyname");
        const result = await handleTryCatch(async () => {
          const { data } = await getMemoList({
            variables: {
              storeid: parsedStoreId,
              outletid: parsedOutletId,
              warehouseid: selectedWarehouse,
              ...filters,
            },
          });

          if (data?.getMemoList) {
            params.success({
              rowData: data.getMemoList.data,
              rowCount: data.getMemoList.total,
            });

            if (!data.getMemoList.data.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              const totals: MemoSummaryTotals = data.getMemoList.totalsRow;
              const pinnedRow: Partial<MemoSummary> = {
                memonumber: "Grand Total" as unknown as number,
                totalamount: Number(totals?.totalamount ?? 0),
                subtotal: Number(totals?.subtotal ?? 0),
                netamount: Number(totals?.netamount ?? 0),
                amountreceived: Number(totals?.amountreceived ?? 0),
                balancedue: Number(totals?.balancedue ?? 0),
              };
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", [pinnedRow]);
            }
          }
          return true;
        });

        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
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
    [debouncedSearch, dispatch, getMemoList, parsedOutletId, parsedStoreId, selectedWarehouse]
  );

  const handleGridReady = useCallback(
    (params: GridReadyEvent<MemoSummary>) => {
      handleOnGridReady(params);
      params.api.setGridOption("serverSideDatasource", datasource);
    },
    [datasource]
  );

  return (
    <div className="card table-list-card">
      <div className="card-body p-2">
        <CustomFilterSections
          search={search}
          setSearch={setSearch}
          selectedWarehouse={selectedWarehouse}
          setSelectedWarehouse={setSelectedWarehouse}
        />
        <POSGrid
          ref={gridRef}
          columnDefs={memoColumnDefs}
          onGridReady={handleGridReady}
          defaultColDef={{
            filter: !debouncedSearch,
            floatingFilter: !debouncedSearch,
          }}
        />
      </div>
    </div>
  );
};

export default MemoListComponent;
