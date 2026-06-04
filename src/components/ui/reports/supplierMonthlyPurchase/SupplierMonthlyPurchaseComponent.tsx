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
import { SupplierPurchaseSummary } from "@/types/reports";
import { supplierMonthlyPurchaseColumnDefs } from "./ColumnDef";
import SupplierMonthlySalesHeader from "../supplierMonthlySales/SupplierMonthlySalesHeader";
import { GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { useParams } from "next/navigation";

const SupplierMonthlyPurchaseComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlySupplierPurchasePivot] = useLazyQuery(
    GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  const handleOnGridReady = (
    params: GridReadyEvent<SupplierPurchaseSummary>
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
          const { data } = await getMonthlySupplierPurchasePivot({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              ...filters,
            },
          });
          if (data.getMonthlySupplierPurchasePivot) {
            const {
              data: rows,
              total,
              totalsRow,
            } = data.getMonthlySupplierPurchasePivot;
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
                const pinnedRow: Partial<SupplierPurchaseSummary> = {
                  supplier: "Page Total",
                  total_purchases: totalsRow.total_purchases,
                  total_purchase_amount: totalsRow.total_purchase_amount,
                  total_amount_paid: totalsRow.total_amount_paid,
                  total_balance_due: totalsRow.total_balance_due,
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
    [parsedStoreId, selectedOutlet, dispatch, getMonthlySupplierPurchasePivot, debouncedSearch]
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
              columnDefs={supplierMonthlyPurchaseColumnDefs}
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

export default SupplierMonthlyPurchaseComponent;
