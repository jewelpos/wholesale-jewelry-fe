"use client";

import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { _InfiniteRowModelGridApi, ColDef } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import CustomLoadingOverlay from "../../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../../grid/CustomNoRowsOverlay";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";
import { GET_SALES_ORDER_LIST_QUERY } from "@/lib/graphql/query/sales";
import { SalesOrderListType } from "@/types/sales";

const SalesOrderListComponent = () => {
  const [getSalesOrderList] = useLazyQuery(GET_SALES_ORDER_LIST_QUERY);
  const [rowData, setRowData] = useState<SalesOrderListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();

  const columnDefs: ColDef<SalesOrderListType>[] = [
    { headerName: "Sales order number", field: "salesorderno" },
    { headerName: "Items", field: "numberofitems" },
    { headerName: "Net amount", field: "netamount" },
    { headerName: "Shipping method", field: "invshippingmethod" },
    { headerName: "Status", field: "statusname" },
    { headerName: "Terms", field: "termsname" },
    { headerName: "Warehouse name", field: "warehousename" },
    { headerName: "outletid", field: "outletid" },
    {
      headerName: "Order date",
      field: "orderdate",
      cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
    {
      headerName: "Order processed date",
      field: "orderprocesseddate",
      cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
  ];

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getSalesOrderList({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getSalesOrderList) {
          setRowData(data.getSalesOrderList.data);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetchReport(selectedOutlet);
    }
  }, [selectedOutlet, fetchReport]);

  return (
    <div className="card-body">
      <div className="table-top">
        <div className="search-set">
          <div className="search-input">
            <OutletsFilter
              fetchOutletsList={fetchOutletsList}
              outlets={outlets}
              loading={outletsLoading}
              setSelectedOutlet={setSelectedOutlet}
              selectedOutlet={selectedOutlet}
            />
          </div>
        </div>
      </div>
      <div className="ag-theme-quartz custom-theme">
        {!outletsLoading && (
          <AgGridReact<SalesOrderListType>
            loading={loading}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{
              filter: true,
              flex: 1,
            }}
            gridOptions={{
              rowHeight: 50,
              headerHeight: 50,
            }}
            pagination
            paginationPageSize={20}
            domLayout="autoHeight"
            loadingOverlayComponent={CustomLoadingOverlay}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        )}
      </div>
    </div>
  );
};

export default SalesOrderListComponent;
