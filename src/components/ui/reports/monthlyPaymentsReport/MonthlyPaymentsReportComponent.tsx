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
import { MonthlyPaymentsPivotSummary } from "@/types/reports";
import { GET_MONTHLY_PAYMENT_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { monthlyPaymentsReportColumnDefs } from "./ColumnDef";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import ReportMiniChart from "@/components/ui/reports/shared/ReportMiniChart";
import ReportLayout from "@/components/ui/reports/shared/ReportLayout";
import ReportHeader from "@/components/ui/reports/shared/ReportHeader";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_KEYS: (keyof MonthlyPaymentsPivotSummary)[] = [
  "jan_total", "feb_total", "mar_total", "apr_total", "may_total", "jun_total",
  "jul_total", "aug_total", "sep_total", "oct_total", "nov_total", "dec_total",
];

const MonthlyPaymentsReportComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getMonthlyPaymentPivot] = useLazyQuery(GET_MONTHLY_PAYMENT_PIVOT_QUERY);
  const dispatch = useAppDispatch();
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(-1);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [totals, setTotals] = useState<Partial<MonthlyPaymentsPivotSummary> | null>(null);

  const handleOnGridReady = (params: GridReadyEvent<MonthlyPaymentsPivotSummary>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(params, debouncedSearch, "month_display, warehousename");
        const result = await handleTryCatch(async () => {
          const { data } = await getMonthlyPaymentPivot({
            variables: { storeid: parsedStoreId, outletid: selectedOutlet, warehouseid: selectedWarehouse, ...filters },
          });
          if (data.getMonthlyPaymentPivot) {
            const { data: rows, total, totalsRow } = data.getMonthlyPaymentPivot;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              if (totalsRow) {
                setTotals(totalsRow);
                const pinnedRow: Partial<MonthlyPaymentsPivotSummary> = {
                  month_display: "Page Total" as unknown as string,
                  monthly_payment: totalsRow.monthly_payment,
                  monthly_count: totalsRow.monthly_count,
                  jan_total: totalsRow.jan_total, feb_total: totalsRow.feb_total,
                  mar_total: totalsRow.mar_total, apr_total: totalsRow.apr_total,
                  may_total: totalsRow.may_total, jun_total: totalsRow.jun_total,
                  jul_total: totalsRow.jul_total, aug_total: totalsRow.aug_total,
                  sep_total: totalsRow.sep_total, oct_total: totalsRow.oct_total,
                  nov_total: totalsRow.nov_total, dec_total: totalsRow.dec_total,
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
    [debouncedSearch, dispatch, getMonthlyPaymentPivot, parsedStoreId, selectedOutlet, selectedWarehouse]
  );

  useEffect(() => {
    if ((selectedOutlet || debouncedSearch) && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, debouncedSearch, gridReady, selectedOutlet, selectedWarehouse]);

  const chartValues = totals ? MONTH_KEYS.map((k) => Number(totals[k] ?? 0)) : [];
  const monthlyCount = totals?.monthly_count ?? 0;
  const monthlyPayment = totals?.monthly_payment ?? 0;
  const activeMonths = chartValues.filter((v) => v > 0).length;
  const avgPerMonth = activeMonths > 0 ? monthlyPayment / activeMonths : 0;

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("monthly-payments");

  const summaryCards: SummaryCardDef[] = [
    { label: "Total Payments", value: monthlyPayment || null, format: "currency", accent: "#6366f1" },
    { label: "Transactions", value: monthlyCount || null, format: "number", accent: "#0ea5e9" },
    { label: "Avg per Month", value: avgPerMonth || null, format: "currency", accent: "#10b981" },
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
          title="Monthly Payments Trend"
          subtitle="Total payments collected per month"
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
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGrid
              ref={gridRef}
              columnDefs={monthlyPaymentsReportColumnDefs}
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

export default MonthlyPaymentsReportComponent;
