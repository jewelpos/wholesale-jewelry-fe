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
import { SupplierSalesPurchaseSummary } from "@/types/reports";
import { supplierMonthlySalesColumnDefs } from "./ColumnDef";
import SupplierMonthlySalesHeader from "./SupplierMonthlySalesHeader";
import { GET_SUPPLIER_MONTHLY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { useParams } from "next/navigation";

const SupplierMonthlySalesComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlySupplierSalesPivot] = useLazyQuery(
    GET_SUPPLIER_MONTHLY_SALES_PIVOT_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<SupplierSalesPurchaseSummary>
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
          "supplier, warehousename"
        );
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlySupplierSalesPivot({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getMonthlySupplierSalesPivot) {
            const {
              data: rows,
              total,
              totalsRow,
            } = data.getMonthlySupplierSalesPivot;
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
                const pinnedRow: Partial<SupplierSalesPurchaseSummary> = {
                  supplier: "Page Total",
                  total_purchase: totalsRow.total_purchase,
                  total_sales: totalsRow.total_sales,
                  jan: totalsRow.jan,
                  feb: totalsRow.feb,
                  mar: totalsRow.mar,
                  apr: totalsRow.apr,
                  may: totalsRow.may,
                  jun: totalsRow.jun,
                  jul: totalsRow.jul,
                  aug: totalsRow.aug,
                  sep: totalsRow.sep,
                  oct: totalsRow.oct,
                  nov: totalsRow.nov,
                  dec: totalsRow.dec,
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
    [parsedStoreId, selectedOutlet, dispatch, getMonthlySupplierSalesPivot, debouncedSearch]
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
              columnDefs={supplierMonthlySalesColumnDefs}
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

export default SupplierMonthlySalesComponent;

