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
import { useDebounce } from "@/hooks/useDebounce";
import POSGrid from "@/components/ui/grid/POSGrid";
import CustomFilterSections from "@/components/ui/grid/CustomFilterSections";
import { filterVariables } from "@/lib/utils/gridFilters";
import { DailySalesSummary } from "@/types/reports";
import { dailySalesReportsColumnDefs } from "./ColumnDef";
import SupplierMonthlySalesHeader from "@/components/ui/reports/supplierMonthlySales/SupplierMonthlySalesHeader";
import { GET_MONTHLY_DAILY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { useParams } from "next/navigation";

const DailySalesReportsComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlyDailySalesPivot] = useLazyQuery(
    GET_MONTHLY_DAILY_SALES_PIVOT_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<DailySalesSummary>
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
          const { data } = await getMonthlyDailySalesPivot({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getMonthlyDailySalesPivot) {
            const {
              data: rows,
              total,
              totalsRow,
            } = data.getMonthlyDailySalesPivot;
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
                const pinnedRow: Partial<DailySalesSummary> = {
                  year: "Page Total" as unknown as number,
                  monthly_total_sales: totalsRow.monthly_total_sales,
                  day_01: totalsRow.day_01,
                  day_02: totalsRow.day_02,
                  day_03: totalsRow.day_03,
                  day_04: totalsRow.day_04,
                  day_05: totalsRow.day_05,
                  day_06: totalsRow.day_06,
                  day_07: totalsRow.day_07,
                  day_08: totalsRow.day_08,
                  day_09: totalsRow.day_09,
                  day_10: totalsRow.day_10,
                  day_11: totalsRow.day_11,
                  day_12: totalsRow.day_12,
                  day_13: totalsRow.day_13,
                  day_14: totalsRow.day_14,
                  day_15: totalsRow.day_15,
                  day_16: totalsRow.day_16,
                  day_17: totalsRow.day_17,
                  day_18: totalsRow.day_18,
                  day_19: totalsRow.day_19,
                  day_20: totalsRow.day_20,
                  day_21: totalsRow.day_21,
                  day_22: totalsRow.day_22,
                  day_23: totalsRow.day_23,
                  day_24: totalsRow.day_24,
                  day_25: totalsRow.day_25,
                  day_26: totalsRow.day_26,
                  day_27: totalsRow.day_27,
                  day_28: totalsRow.day_28,
                  day_29: totalsRow.day_29,
                  day_30: totalsRow.day_30,
                  day_31: totalsRow.day_31,
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
    [parsedStoreId, selectedOutlet, dispatch, getMonthlyDailySalesPivot, debouncedSearch]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

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
          />
          <div className="ag-theme-quartz custom-theme">
            <POSGrid
              ref={gridRef}
              columnDefs={dailySalesReportsColumnDefs}
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

export default DailySalesReportsComponent;
