"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_INVOICE_AGING_REPORT_QUERY } from "@/lib/graphql/query/customer";
import { CustomerBalanceAgingType } from "@/types/customer";
import "ag-grid-enterprise";
import { balanceAgingColumnDefs } from "./ColumnDef";
import POSGrid from "../../grid/POSGrid";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useDebounce } from "@/hooks/useDebounce";
import CustomFilterSections from "../../grid/CustomFilterSections";
import BalanceAgingHeader from "./BalanceAgingHeader";

const BalanceAgingComponent = () => {
  const [getInvoiceAgingReport] = useLazyQuery(GET_INVOICE_AGING_REPORT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const handleOnGridReady = (
    params: GridReadyEvent<CustomerBalanceAgingType>
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
          "customerid, companyname, customername"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getInvoiceAgingReport({
            variables: {
              outletid: selectedOutlet,
              ...filtersMain,
            },
          });
          if (data.getInvoiceAgingReport) {
            params.success({
              rowData: data.getInvoiceAgingReport.data,
              rowCount: data.getInvoiceAgingReport.total,
            });
            if (!data.getInvoiceAgingReport.data.length) {
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
    [selectedOutlet, dispatch, getInvoiceAgingReport, debouncedSearch]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  return (
    <>
      <BalanceAgingHeader />
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
              columnDefs={balanceAgingColumnDefs}
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

export default BalanceAgingComponent;
