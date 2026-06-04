"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { useParams } from "next/navigation";

import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { filterVariables } from "@/lib/utils/gridFilters";
import { MonthlyPaymentSummary } from "@/types/reports";
import SupplierMonthlySalesHeader from "@/components/ui/reports/supplierMonthlySales/SupplierMonthlySalesHeader";
import { GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { dailyPaymentsReportColumnDefs } from "./ColumnDef";

const DailyPaymentsReportComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [getMonthlyDailyPaymentsPivot] = useLazyQuery(
    GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY
  );

  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(
    -1
  );
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<MonthlyPaymentSummary>
  ) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearch,
          "month_display, warehousename"
        );

        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyDailyPaymentsPivot({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              warehouseid: selectedWarehouse,
              ...filters,
            },
          });

          if (data.getMonthlyDailyPaymentsPivot) {
            const { data: rows, total, totalsRow } =
              data.getMonthlyDailyPaymentsPivot;

            params.success({
              rowData: rows,
              rowCount: total,
            });

            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                const pinnedRow: Partial<MonthlyPaymentSummary> = {
                  year: "Page Total" as unknown as number,
                  monthly_payment: totalsRow.monthly_payment,
                  monthly_count: totalsRow.monthly_count,
                };
                gridRef.current?.api?.setGridOption("pinnedBottomRowData", [
                  pinnedRow,
                ]);
              }
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
    [
      debouncedSearch,
      dispatch,
      getMonthlyDailyPaymentsPivot,
      parsedStoreId,
      selectedOutlet,
      selectedWarehouse,
    ]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [
    datasource,
    debouncedSearch,
    gridReady,
    selectedOutlet,
    selectedWarehouse,
  ]);

  return (
    <>
      <SupplierMonthlySalesHeader />
      <div className="card table-list-card">
        <div className="card-body p-2">
          <CustomFilterSections
            search={search}
            setSearch={setSearch}
            selectedOutlet={selectedOutlet}
            setSelectedOutlet={setSelectedOutlet}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={dailyPaymentsReportColumnDefs}
              onGridReady={handleOnGridReady}
              defaultColDef={{
                filter: !debouncedSearch,
                floatingFilter: !debouncedSearch,
              }}
              getRowStyle={(params) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyPaymentsReportComponent;
