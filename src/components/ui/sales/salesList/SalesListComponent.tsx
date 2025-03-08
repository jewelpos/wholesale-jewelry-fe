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
import { GET_SALES_INVOICE_LIST_QUERY } from "@/lib/graphql/query/sales";
import { SalesInvoiceListType } from "@/types/sales";

const SalesListComponent = () => {
  const [getInvoiceList] = useLazyQuery(GET_SALES_INVOICE_LIST_QUERY);
  const [rowData, setRowData] = useState<SalesInvoiceListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();

  const columnDefs: ColDef<SalesInvoiceListType>[] = [
    { headerName: "invoicenumber", field: "invoicenumber" },
    { headerName: "Customer", field: "customerid" },
    { headerName: "Company", field: "companyname" },
    { headerName: "Mode", field: "salemodename" },
    { headerName: "Total items", field: "numberofitems" },
    { headerName: "Total amount", field: "totalamount" },
    { headerName: "Discount amount", field: "discountamount" },
    { headerName: "Sub total", field: "subtotal" },
    { headerName: "Tax", field: "salestax" },
    { headerName: "Shipping", field: "shipping" },
    { headerName: "Net amount", field: "netamount" },
    { headerName: "Received amount", field: "amountreceived" },
    { headerName: "Due balance", field: "balancedue" },
    { headerName: "Terms", field: "termsname" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
      headerName: "Date",
      field: "saledate",
      cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
  ];

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getInvoiceList({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getInvoiceList) {
          setRowData(data.getInvoiceList.data);
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
          <AgGridReact<SalesInvoiceListType>
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

export default SalesListComponent;
