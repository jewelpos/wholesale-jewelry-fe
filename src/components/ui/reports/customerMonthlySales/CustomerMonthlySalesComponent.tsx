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
import { CustomerSalesSummary } from "@/types/reports";
import { customerMonthlySalesColumnDefs } from "./ColumnDef";
import { GET_CUSTOMER_MONTHLY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
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

const CustomerMonthlySalesComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlyCustomerSalesPivot] = useLazyQuery(GET_CUSTOMER_MONTHLY_SALES_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<CustomerSalesSummary> | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MIN, YEAR_MAX]);

  const handleOnGridReady = (params: GridReadyEvent<CustomerSalesSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "custcompanyname, warehousename");
        if (yearRange[0] !== YEAR_MIN || yearRange[1] !== YEAR_MAX) {
          filters.filters = [...filters.filters, { key: "year", value: { filterType: "number", type: "inRange", filter: String(yearRange[0]), filterTo: String(yearRange[1]) } }];
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyCustomerSalesPivot({
            variables: {
              storeid: parsedStoreId,
              outletid: selectedOutlet,
              warehouseid: selectedWarehouse && selectedWarehouse !== -1 ? selectedWarehouse : undefined,
              ...filters,
            },
          });
          if (data.getMonthlyCustomerSalesPivot) {
            const { data: rows, total, totalsRow } = data.getMonthlyCustomerSalesPivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<CustomerSalesSummary> = {
                  custcompanyname: "Page Total",
                  total_sales: totalsRow.total_sales,
                  total_balance_due: totalsRow.total_balance_due,
                  total_profit: totalsRow.total_profit,
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
    [parsedStoreId, selectedOutlet, selectedWarehouse, dispatch, getMonthlyCustomerSalesPivot, debouncedSearch, yearRange]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridRef, datasource, selectedOutlet, selectedWarehouse, gridReady, debouncedSearch]);

  const chartValues = totals
    ? [totals.jan, totals.feb, totals.mar, totals.apr, totals.may, totals.jun,
       totals.jul, totals.aug, totals.sep, totals.oct, totals.nov, totals.dec].map(Number)
    : [];

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("customer-monthly-sales");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Sales", value: totals?.total_sales, format: "currency", accent: "#6366f1" },
    { label: "Gross Profit", value: totals?.total_profit, format: "currency", accent: "#10b981" },
    { label: "Balance Due", value: totals?.total_balance_due, format: "currency", accent: "#ef4444" },
  ];

  return (
    <ReportLayout>
      <ReportHeader
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
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
          title="Customer Sales by Month"
          subtitle="Aggregated customer sales across all months"
          color="#6366f1"
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
            color="#6366f1"
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={customerMonthlySalesColumnDefs}
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

export default CustomerMonthlySalesComponent;
