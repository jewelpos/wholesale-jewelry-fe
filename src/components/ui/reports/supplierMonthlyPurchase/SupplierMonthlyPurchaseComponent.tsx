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
import { GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { useParams } from "next/navigation";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import ReportMiniChart from "@/components/ui/reports/shared/ReportMiniChart";
import ReportLayout from "@/components/ui/reports/shared/ReportLayout";
import ReportHeader from "@/components/ui/reports/shared/ReportHeader";
import ReportSliderFilter from "@/components/ui/reports/shared/ReportSliderFilter";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

const YEAR_MIN = 2018;
const YEAR_MAX = new Date().getFullYear();
const YEAR_MARKS = Object.fromEntries(
  Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => [YEAR_MIN + i, String(YEAR_MIN + i)])
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SupplierMonthlyPurchaseComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlySupplierPurchasePivot] = useLazyQuery(GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<SupplierPurchaseSummary> | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MIN, YEAR_MAX]);

  const handleOnGridReady = (params: GridReadyEvent<SupplierPurchaseSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "supplier, warehousename");
        if (yearRange[0] !== YEAR_MIN || yearRange[1] !== YEAR_MAX) {
          filters.filters = [...filters.filters, { key: "year", value: { filterType: "number", type: "inRange", filter: String(yearRange[0]), filterTo: String(yearRange[1]) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlySupplierPurchasePivot({
            variables: { storeid: parsedStoreId, outletid: selectedOutlet, ...filters },
          });
          if (data.getMonthlySupplierPurchasePivot) {
            const { data: rows, total, totalsRow } = data.getMonthlySupplierPurchasePivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<SupplierPurchaseSummary> = {
                  supplier: "Page Total",
                  total_purchases: totalsRow.total_purchases,
                  total_purchase_amount: totalsRow.total_purchase_amount,
                  total_amount_paid: totalsRow.total_amount_paid,
                  total_balance_due: totalsRow.total_balance_due,
                  jan: totalsRow.jan, feb: totalsRow.feb, mar: totalsRow.mar,
                  apr: totalsRow.apr, may: totalsRow.may, jun: totalsRow.jun,
                  jul: totalsRow.jul, aug: totalsRow.aug, sep: totalsRow.sep,
                  oct: totalsRow.oct, nov: totalsRow.nov, dec: totalsRow.dec,
                };
                gridRef.current?.api?.setGridOption("pinnedBottomRowData", [pinnedRow]);
              }
            }
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [parsedStoreId, selectedOutlet, dispatch, getMonthlySupplierPurchasePivot, debouncedSearch, yearRange]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  const chartValues = totals
    ? [totals.jan, totals.feb, totals.mar, totals.apr, totals.may, totals.jun,
       totals.jul, totals.aug, totals.sep, totals.oct, totals.nov, totals.dec].map(Number)
    : [];

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("supplier-monthly-purchase");

  const summaryCards: SummaryCardDef[] = [
    { label: "Purchase Orders", value: totals?.total_purchases, format: "number", accent: "#6366f1" },
    { label: "Total Amount", value: totals?.total_purchase_amount, format: "currency", accent: "#0ea5e9" },
    { label: "Amount Paid", value: totals?.total_amount_paid, format: "currency", accent: "#10b981" },
    { label: "Balance Due", value: totals?.total_balance_due, format: "currency", accent: "#ef4444" },
  ];

  return (
    <ReportLayout>
      <ReportHeader
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
      />
      {isAdmin && (
        <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Report Summary">
          <ReportSummaryCards cards={summaryCards} loading={!totals && !!selectedOutlet} />
        </SummaryPanelWrapper>
      )}
      {totals && (
        <ReportMiniChart
          labels={MONTHS}
          values={chartValues}
          title="Purchase Activity by Month"
          subtitle="Total purchase amounts per month"
          color="#0ea5e9"
          type="area"
        />
      )}
      <div
        className="card table-list-card"
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}
      >
        <div
          className="card-body p-0"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
          />
          <ReportSliderFilter
            label="Year Range"
            range
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            marks={YEAR_MARKS}
            value={yearRange}
            onChange={(v) => setYearRange(v as [number, number])}
            color="#0ea5e9"
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={supplierMonthlyPurchaseColumnDefs}
              fillHeight
              onGridReady={handleOnGridReady}
              defaultColDef={{ filter: !debouncedSearch }}
              getRowStyle={(params) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", backgroundColor: "#f5f5f5" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default SupplierMonthlyPurchaseComponent;
