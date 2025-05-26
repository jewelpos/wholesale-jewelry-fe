"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_CUSTOMER_LEDGER_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerLedgerReportType } from "@/types/customer";
import "ag-grid-enterprise";
import { ledgerActivityColumnDefs } from "./ColumnDef";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import LedgerActivityHeader from "./LedgerActivityHeader";

const LedgerActivityComponent = () => {
  const [getCustomerLedgerReport] = useLazyQuery(
    GET_CUSTOMER_LEDGER_REPORT_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerLedgerReportType>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filtersMain = filterVariables(
          params,
          debouncedSearch,
          "ledgercustid, custcompanyname, customername"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getCustomerLedgerReport({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getCustomerLedgerReport) {
            params.success({
              rowData: data.getCustomerLedgerReport.data,
              rowCount: data.getCustomerLedgerReport.total,
            });
            if (!data.getCustomerLedgerReport.data.length) {
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
    [selectedOutlet, dispatch, getCustomerLedgerReport, debouncedSearch]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  return (
    <>
      <LedgerActivityHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={ledgerActivityColumnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LedgerActivityComponent;
