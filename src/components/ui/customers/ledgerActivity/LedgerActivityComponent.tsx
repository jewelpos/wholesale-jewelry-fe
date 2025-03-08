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
import { GET_CUSTOMER_LEDGER_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerLedgerReportType } from "@/types/customer";
import "ag-grid-enterprise";
import useOutlets from "@/hooks/useOutlets";
import OutletsFilter from "../../grid/OutletsFilter";

const LedgerActivityComponent = () => {
  const [getCustomerLedgerReport] = useLazyQuery(
    GET_CUSTOMER_LEDGER_REPORT_QUERY
  );
  const [rowData, setRowData] = useState<CustomerLedgerReportType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();

  const columnDefs: ColDef<CustomerLedgerReportType>[] = [
    {
      headerName: "Customer",
      field: "ledgercustid",
    },
    { headerName: "Code", field: "ledgercode" },
    { headerName: "Description", field: "ledgerdescription" },
    { headerName: "Amount debited", field: "ledamountdebit" },
    { headerName: "Amount credited", field: "ledamountcredit" },
    { headerName: "Balance", field: "running_balance" },
    { headerName: "Balance", field: "running_balance" },
    { headerName: "Balance", field: "running_balance" },
    { headerName: "Reference", field: "ledgerreference" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
      headerName: "Date",
      field: "ledgerdate",
      cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
  ];

  const fetchReport = useCallback(async (selectedOutlet: number) => {
    const result = await handleTryCatch(
      async () => {
        const { data } = await getCustomerLedgerReport({
          variables: { outletid: selectedOutlet, page: 1, perpage: 1000 },
        });
        if (data.getCustomerLedgerReport) {
          setRowData(data.getCustomerLedgerReport.data);
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
          <AgGridReact<CustomerLedgerReportType>
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

export default LedgerActivityComponent;
