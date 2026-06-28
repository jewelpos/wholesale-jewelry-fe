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
import { EmployeeYearlySalesSummary } from "@/types/reports";
import { employeeSalesColumnDefs } from "./ColumnDef";
import { GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
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

const EmployeeSalesReportComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlyEmployeeSalesPivot] = useLazyQuery(GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<EmployeeYearlySalesSummary> | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MAX, YEAR_MAX]);
  const [marginRange, setMarginRange] = useState<[number, number]>([0, 100]);

  const handleOnGridReady = (params: GridReadyEvent<EmployeeYearlySalesSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "employeename, warehousename");
        if (yearRange[0] !== YEAR_MIN || yearRange[1] !== YEAR_MAX) {
          filters.filters = [...filters.filters, { key: "year", value: { filterType: "number", type: "inRange", filter: String(yearRange[0]), filterTo: String(yearRange[1]) } }];
        }
        if (marginRange[0] !== 0 || marginRange[1] !== 100) {
          filters.filters = [...filters.filters, { key: "profit_margin_percent", value: { filterType: "number", type: "inRange", filter: String(marginRange[0]), filterTo: String(marginRange[1]) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyEmployeeSalesPivot({
            variables: { storeid: parsedStoreId, outletid: selectedOutlet, ...filters },
          });
          if (data.getMonthlyEmployeeSalesPivot) {
            const { data: rows, total, totalsRow } = data.getMonthlyEmployeeSalesPivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<EmployeeYearlySalesSummary> = {
                  employeename: "Page Total",
                  total_sales: totalsRow.total_sales,
                  total_cost: totalsRow.total_cost,
                  total_profit: totalsRow.total_profit,
                  profit_margin_percent: totalsRow.profit_margin_percent,
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
    [parsedStoreId, selectedOutlet, dispatch, getMonthlyEmployeeSalesPivot, debouncedSearch, yearRange, marginRange]
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

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("employee-sales");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Sales", value: totals?.total_sales, format: "currency", accent: "#6366f1" },
    { label: "Total Cost", value: totals?.total_cost, format: "currency", accent: "#f59e0b" },
    { label: "Gross Profit", value: totals?.total_profit, format: "currency", accent: "#10b981" },
    { label: "Profit Margin", value: totals?.profit_margin_percent, format: "percent", accent: "#8b5cf6" },
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
          title="Employee Sales Trend"
          subtitle="Combined monthly sales across all employees"
          color="#8b5cf6"
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
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, borderRight: "1px solid #f1f5f9" }}>
              <ReportSliderFilter
                label="Year Range"
                range
                min={YEAR_MIN}
                max={YEAR_MAX}
                step={1}
                marks={YEAR_MARKS}
                value={yearRange}
                onChange={(v) => setYearRange(v as [number, number])}
                color="#8b5cf6"
              />
            </div>
            <div style={{ flex: 1 }}>
              <ReportSliderFilter
                label="Profit Margin %"
                range
                min={0}
                max={100}
                step={5}
                marks={{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }}
                value={marginRange}
                onChange={(v) => setMarginRange(v as [number, number])}
                formatter={(v) => `${v}%`}
                color="#8b5cf6"
              />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={employeeSalesColumnDefs}
              fillHeight
              onGridReady={handleOnGridReady}
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

export default EmployeeSalesReportComponent;
