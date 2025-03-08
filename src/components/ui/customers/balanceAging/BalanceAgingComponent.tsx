"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { _InfiniteRowModelGridApi, ColDef } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import CustomLoadingOverlay from "../../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../../grid/CustomNoRowsOverlay";
import { GET_INVOICE_AGING_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerBalanceAgingType } from "@/types/customer";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import { useParams } from "next/navigation";
import Select from "react-select";
import OutletsFilter from "../../grid/OutletsFilter";

const BalanceAgingComponent = () => {
  const [getInvoiceAgingReport] = useLazyQuery(GET_INVOICE_AGING_REPORT_QUERY);
  const [rowData, setRowData] = useState<CustomerBalanceAgingType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  // const gridRef = useRef<AgGridReact>(null);

  const columnDefs: ColDef<CustomerBalanceAgingType>[] = [
    {
      headerName: "Customer name",
      field: "customername",
      filter: true,
    },
    { headerName: "Customer name", field: "companyname" },
    { headerName: "Total sale", field: "total_sale" },
    { headerName: "Due", field: "due_0_30" },
    { headerName: "Due", field: "due_31_60" },
    { headerName: "Due", field: "due_61_90" },
    { headerName: "Due", field: "due_91_120" },
    { headerName: "Due", field: "due_120_plus" },
    { headerName: "Total due", field: "total_due" },
  ];

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getInvoiceAgingReport({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getInvoiceAgingReport) {
          setRowData(data.getInvoiceAgingReport.data);
          // params.successCallback(data.getRows.rows, data.getRows.lastRow);
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
      // params.failCallback();
    }
  }, []);

  // const datasource = useMemo(
  //   () => ({
  //     getRows: async (params: any) => {
  //       const { startRow, endRow, filterModel } = params.request;

  //       const filters = Object.keys(filterModel).reduce((acc, key) => {
  //         acc[key] = filterModel[key].filter;
  //         return acc;
  //       }, {} as any);

  //       const result = await handleTryCatch(
  //         async () => {
  //           const { data } = await getInvoiceAgingReport({
  //             variables: { outletid: 73, page: 1, perPage: 1 },
  //           });
  //           if (data.getInvoiceAgingReport) {
  //             params.successCallback(data.getRows.rows, data.getRows.lastRow);
  //           }
  //           return true;
  //         },
  //         () => {
  //           setLoading(false);
  //         }
  //       );
  //       if (result.error) {
  //         dispatch(
  //           showNotification({
  //             message: result.error,
  //             type: NOTIFICATION_TYPES.ERROR,
  //           })
  //         );
  //         params.failCallback();
  //       }
  //     },
  //   }),
  //   []
  // );

  //for server side
  // const onGridReady = useCallback(
  //   (params: any) => {
  //     params.api.setServerSideDatasource(datasource);
  //   },
  //   [datasource]
  // );

  useEffect(() => {
    if (selectedOutlet) {
      fetchReport(selectedOutlet);
    }
  }, [selectedOutlet, fetchReport]);

  return (
    <div className="card-body">
      <div className="table-top">
        <div className="form-sort">
          <OutletsFilter
            fetchOutletsList={fetchOutletsList}
            outlets={outlets}
            loading={outletsLoading}
            setSelectedOutlet={setSelectedOutlet}
            selectedOutlet={selectedOutlet}
          />
        </div>
      </div>
      <div className="ag-theme-quartz custom-theme">
        {/* server side */}
        {/* <AgGridReact<CustomerBalanceAgingType>
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={{
          filter: true,
          flex: 1,
          sortable: true,
        }}
        rowModelType="serverSide"
        pagination={true}
        paginationPageSize={10}
        onGridReady={onGridReady}
      /> */}

        {!outletsLoading && (
          <AgGridReact<CustomerBalanceAgingType>
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

export default BalanceAgingComponent;
