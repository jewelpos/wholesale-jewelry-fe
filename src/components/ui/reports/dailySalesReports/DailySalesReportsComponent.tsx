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
import { GET_MONTHLY_DAILY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
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

const DAY_KEYS = Array.from({ length: 31 }, (_, i) => `day_${String(i + 1).padStart(2, "0")}` as keyof DailySalesSummary);
const DAY_LABELS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const DailySalesReportsComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlyDailySalesPivot] = useLazyQuery(GET_MONTHLY_DAILY_SALES_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<DailySalesSummary> | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MIN, YEAR_MAX]);

  const handleOnGridReady = (params: GridReadyEvent<DailySalesSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "month_display, warehousename");
        if (yearRange[0] !== YEAR_MIN || yearRange[1] !== YEAR_MAX) {
          filters.filters = [...filters.filters, { key: "year", value: { filterType: "number", type: "inRange", filter: String(yearRange[0]), filterTo: String(yearRange[1]) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyDailySalesPivot({
            variables: { storeid: parsedStoreId, outletid: selectedOutlet, ...filters },
          });
          if (data.getMonthlyDailySalesPivot) {
            const { data: rows, total, totalsRow } = data.getMonthlyDailySalesPivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<DailySalesSummary> = {
                  year: "Page Total" as unknown as number,
                  monthly_total_sales: totalsRow.monthly_total_sales,
                  day_01: totalsRow.day_01, day_02: totalsRow.day_02, day_03: totalsRow.day_03,
                  day_04: totalsRow.day_04, day_05: totalsRow.day_05, day_06: totalsRow.day_06,
                  day_07: totalsRow.day_07, day_08: totalsRow.day_08, day_09: totalsRow.day_09,
                  day_10: totalsRow.day_10, day_11: totalsRow.day_11, day_12: totalsRow.day_12,
                  day_13: totalsRow.day_13, day_14: totalsRow.day_14, day_15: totalsRow.day_15,
                  day_16: totalsRow.day_16, day_17: totalsRow.day_17, day_18: totalsRow.day_18,
                  day_19: totalsRow.day_19, day_20: totalsRow.day_20, day_21: totalsRow.day_21,
                  day_22: totalsRow.day_22, day_23: totalsRow.day_23, day_24: totalsRow.day_24,
                  day_25: totalsRow.day_25, day_26: totalsRow.day_26, day_27: totalsRow.day_27,
                  day_28: totalsRow.day_28, day_29: totalsRow.day_29, day_30: totalsRow.day_30,
                  day_31: totalsRow.day_31,
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
    [parsedStoreId, selectedOutlet, dispatch, getMonthlyDailySalesPivot, debouncedSearch, yearRange]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, gridReady, debouncedSearch]);

  const dailyValues = totals ? DAY_KEYS.map((k) => Number(totals[k] ?? 0)) : [];
  const activeDays = dailyValues.filter((v) => v > 0).length;
  const maxDay = dailyValues.length ? Math.max(...dailyValues) : 0;
  const avgDay = activeDays > 0 ? (totals?.monthly_total_sales ?? 0) / activeDays : 0;

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("daily-sales");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Sales", value: totals?.monthly_total_sales, format: "currency", accent: "#6366f1" },
    { label: "Best Day", value: maxDay || null, format: "currency", accent: "#10b981" },
    { label: "Avg per Active Day", value: avgDay || null, format: "currency", accent: "#0ea5e9" },
    { label: "Active Days", value: activeDays || null, format: "number", accent: "#8b5cf6" },
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
          labels={DAY_LABELS}
          values={dailyValues}
          title="Sales by Day of Month"
          subtitle="Aggregated daily sales across all months"
          color="#6366f1"
          type="bar"
          height={140}
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
            color="#6366f1"
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={dailySalesReportsColumnDefs}
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

export default DailySalesReportsComponent;
