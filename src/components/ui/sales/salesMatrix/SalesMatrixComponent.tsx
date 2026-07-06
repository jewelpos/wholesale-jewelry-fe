"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { ChevronDown, ChevronUp } from "react-feather";
import { ColDef, ColGroupDef, GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import "ag-grid-enterprise";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import useOutlets from "@/hooks/useOutlets";
import useMenu from "@/hooks/useMenu";
import POSGrid from "@/components/ui/grid/POSGrid";
import PageHeader from "@/components/ui/PageHeader";
import ReportSummaryCards, { SummaryCardDef } from "@/components/ui/reports/shared/ReportSummaryCards";
import { GET_SALES_MATRIX_QUERY } from "@/lib/graphql/query/sales";
import {
  SalesMatrixColumn,
  SalesMatrixRow,
  SalesMatrixTotals,
  SalesMetricMode,
} from "@/types/accounts";
import {
  buildSalesMatrixColumns,
  buildSalesPinnedRow,
  getSalesColumnStateForMode,
} from "./salesMatrixColumnDef";
import MultiOutletSelect from "@/components/ui/products/inventoryPivot/MultiOutletSelect";
import { formatCurrency } from "@/lib/utils/currencyFormat";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "@/components/ui/grid/SummaryPanelWrapper";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type ChartMetric = "totalsales" | "amountreceived" | "balancedue";

const CHART_METRIC_LABELS: Record<ChartMetric, string> = {
  totalsales: "Sales by Period",
  amountreceived: "Payment by Period",
  balancedue: "Balance by Period",
};

const TOGGLE_METRIC_LABELS: Partial<Record<SalesMetricMode, string>> = {
  salecount: "Count",
  avgsale: "Avg",
};

const OUTLET_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899",
];

function getDateRange(preset: string): { startdate: string; enddate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "today") {
    const s = fmt(now);
    return { startdate: s, enddate: s };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startdate: fmt(start), enddate: fmt(now) };
  }
  if (preset === "month") {
    return {
      startdate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      enddate: fmt(now),
    };
  }
  if (preset === "year") {
    return { startdate: `${now.getFullYear()}-01-01`, enddate: fmt(now) };
  }
  return { startdate: fmt(now), enddate: fmt(now) };
}

function getGranularity(
  preset: string,
  customStart?: string,
  customEnd?: string
): "hour" | "day" | "month" {
  if (preset === "today") return "hour";
  if (preset === "week" || preset === "month") return "day";
  if (preset === "year") return "month";
  if (customStart && customEnd) {
    const days =
      (new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000;
    return days <= 31 ? "day" : "month";
  }
  return "month";
}

const SalesMatrixComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentMenu, basePath } = useMenu();

  const gridRef = useRef<AgGridReact>(null);
  const gridReadyRef = useRef(false);
  const [gridReady, setGridReady] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  const [selectedOutletIds, setSelectedOutletIds] = useState<number[]>([]);
  const [metricMode, setMetricMode] = useState<SalesMetricMode>("totalsales");
  const [datePreset, setDatePreset] = useState("year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("totalsales");

  const [matrixColumns, setMatrixColumns] = useState<SalesMatrixColumn[]>([]);
  const matrixColumnsRef = useRef<SalesMatrixColumn[]>([]);
  const metricModeRef = useRef<SalesMetricMode>("totalsales");

  const [totals, setTotals] = useState<SalesMatrixTotals[]>([]);
  const [chartRows, setChartRows] = useState<SalesMatrixRow[]>([]);
  const [chartColumns, setChartColumns] = useState<SalesMatrixColumn[]>([]);

  const { fetchOutletsList, outlets, loading: outletsLoading } = useOutlets();
  const [getSalesMatrix] = useLazyQuery(GET_SALES_MATRIX_QUERY);

  const { isAdmin, isCollapsed: cardsCollapsed, toggle: toggleCards } = useSummaryPanel("sales-matrix");
  const { isCollapsed: chartCollapsed, toggle: toggleChart } = useSummaryPanel("sales-matrix-chart");

  const resolvedDates = useMemo(() => {
    if (datePreset === "custom" && customStart && customEnd) {
      return { startdate: customStart, enddate: customEnd };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const resolvedDatesRef = useRef(resolvedDates);
  useEffect(() => {
    resolvedDatesRef.current = resolvedDates;
  }, [resolvedDates]);

  const granularity = useMemo(
    () => getGranularity(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd]
  );

  const columnDefs = useMemo(
    () =>
      buildSalesMatrixColumns(
        matrixColumns,
        metricModeRef.current,
        () => metricModeRef.current
      ),
    [matrixColumns]
  );

  const stableDefaultColDef = useMemo(() => ({ filter: true }), []);

  const handleMetricChange = useCallback((mode: SalesMetricMode) => {
    // Clicking the active toggle button deselects it (back to default = no extra columns)
    const next = metricModeRef.current === mode ? "totalsales" : mode;
    metricModeRef.current = next;
    if (gridReadyRef.current && matrixColumnsRef.current.length) {
      gridRef.current?.api?.applyColumnState({
        state: getSalesColumnStateForMode(matrixColumnsRef.current, next),
        applyOrder: false,
      });
      gridRef.current?.api?.refreshCells({ force: true });
    }
    setMetricMode(next);
  }, []);

  const handleOutletChange = useCallback((ids: number[]) => {
    setSelectedOutletIds(ids);
    setMatrixColumns([]);
    matrixColumnsRef.current = [];
    gridReadyRef.current = false;
    setGridReady(false);
    setGridKey((k) => k + 1);
    setTotals([]);
    setChartRows([]);
    setChartColumns([]);
  }, []);

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!selectedOutletIds.length) {
          params.success({ rowData: [], rowCount: 0 });
          gridRef.current?.api?.showNoRowsOverlay();
          return;
        }

        gridRef.current?.api?.showLoadingOverlay();
        const dates = resolvedDatesRef.current;

        const result = await handleTryCatch(async () => {
          const { data } = await getSalesMatrix({
            variables: {
              storeid: parsedStoreId,
              outletids: selectedOutletIds,
              ...dates,
              granularity,
            },
          });

          if (!data?.getSalesMatrix) {
            params.success({ rowData: [], rowCount: 0 });
            gridRef.current?.api?.showNoRowsOverlay();
            return true;
          }

          const { columns, data: rows, totals: newTotals } = data.getSalesMatrix;

          const newKey = columns
            .map((c: SalesMatrixColumn) => c.outletid)
            .join(",");
          const curKey = matrixColumnsRef.current
            .map((c) => c.outletid)
            .join(",");
          matrixColumnsRef.current = columns;

          if (newKey !== curKey) {
            setMatrixColumns(columns);
          } else {
            gridRef.current?.api?.applyColumnState({
              state: getSalesColumnStateForMode(columns, metricModeRef.current),
              applyOrder: false,
            });
          }

          params.success({ rowData: rows, rowCount: rows.length });
          setTotals(newTotals ?? []);
          setChartRows(rows ?? []);
          setChartColumns(columns ?? []);

          if (!rows.length) {
            gridRef.current?.api?.showNoRowsOverlay();
            gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
          } else {
            gridRef.current?.api?.hideOverlay();
            gridRef.current?.api?.setGridOption(
              "pinnedBottomRowData",
              newTotals?.length
                ? [buildSalesPinnedRow(newTotals as SalesMatrixTotals[])]
                : []
            );
          }
          return true;
        });

        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
          dispatch(
            showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
          );
          params.fail();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsedStoreId, selectedOutletIds, resolvedDates, granularity]
  );

  useEffect(() => {
    if (gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady]);

  const handleGridReady = (_params: GridReadyEvent<SalesMatrixRow>) => {
    gridReadyRef.current = true;
    setGridReady(true);
  };

  // Summary card derivations
  const totalSales = totals.reduce((s, t) => s + (t.totalsales ?? 0), 0);
  const totalCount = totals.reduce((s, t) => s + (t.salecount ?? 0), 0);
  const totalReceived = totals.reduce((s, t) => s + (t.amountreceived ?? 0), 0);
  const totalBalance = totals.reduce((s, t) => s + (t.balancedue ?? 0), 0);
  const avgPerInvoice = totalCount > 0 ? totalSales / totalCount : null;
  const bestOutlet = totals.length
    ? totals.reduce((best, t) => (t.totalsales > best.totalsales ? t : best), totals[0])
    : null;
  const collectionRate = totalSales > 0 ? (totalReceived / totalSales) * 100 : null;
  const rateSubtext = !collectionRate
    ? undefined
    : collectionRate >= 80
    ? "Healthy collection"
    : collectionRate >= 50
    ? "Follow-up needed"
    : "Critical AR risk";

  const summaryCards: SummaryCardDef[] = [
    {
      label: "Total Sales",
      value: totalSales || null,
      format: "currency",
      accent: "#6366f1",
    },
    {
      label: "Total Received",
      value: totalReceived || null,
      format: "currency",
      accent: "#10b981",
    },
    {
      label: "Balance Due",
      value: totalBalance || null,
      format: "currency",
      accent: "#ef4444",
    },
    {
      label: "Collection Rate",
      value: collectionRate,
      format: "percent",
      subtext: rateSubtext,
      accent: "#f59e0b",
    },
    {
      label: bestOutlet ? `Best: ${bestOutlet.outletname}` : "Best Outlet",
      value: bestOutlet?.totalsales || null,
      format: "currency",
      accent: "#8b5cf6",
    },
    {
      label: "Invoice Count",
      value: totalCount || null,
      format: "number",
      accent: "#0ea5e9",
    },
  ];

  // Stacked bar chart — series driven by chartMetric selection
  const chartData = useMemo(() => {
    if (!chartRows.length || !chartColumns.length) return null;
    return {
      labels: chartRows.map((r) => r.period_label),
      datasets: chartColumns.map((col, i) => ({
        label: col.outletname,
        data: chartRows.map(
          (r) => (r.outlets.find((o) => o.outletid === col.outletid) as any)?.[chartMetric] ?? 0
        ),
        backgroundColor: OUTLET_COLORS[i % OUTLET_COLORS.length] + "99",
        borderColor: OUTLET_COLORS[i % OUTLET_COLORS.length],
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false as const,
      })),
    };
  }, [chartRows, chartColumns, chartMetric]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          position: "top" as const,
          labels: { font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: "#1e293b",
          titleColor: "#94a3b8",
          bodyColor: "#f1f5f9",
          titleFont: { size: 11 },
          bodyFont: { size: 12 },
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label: (ctx: any) =>
              `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 10 }, color: "#94a3b8" },
        },
        y: {
          stacked: true,
          display: false,
          grid: { display: false },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 150px)",
        overflow: "hidden",
      }}
    >
      <PageHeader
        title={currentMenu?.permissiondisplayname ?? "Sales Matrix"}
        subtitle={
          currentMenu?.permissiondescription ??
          "Compare sales performance across outlets by period"
        }
        rightSection={
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => router.push(`${basePath}/sales/list`)}
          >
            ← Invoices
          </button>
        }
      />

      {/* Summary cards — admin only, toggle panel */}
      {isAdmin && totals.length > 0 && (
        <SummaryPanelWrapper isCollapsed={cardsCollapsed} onToggle={toggleCards} title="Sales Summary">
          <ReportSummaryCards cards={summaryCards} loading={false} singleRow />
        </SummaryPanelWrapper>
      )}

      {/* Stacked bar chart — collapsible panel, hidden when only 1 period */}
      {chartData && chartRows.length > 1 && (
        <div className="card" style={{ marginBottom: 8, flexShrink: 0 }}>
          <div
            className="d-flex align-items-center justify-content-between px-3"
            style={{ height: 36, borderBottom: chartCollapsed ? "none" : "1px solid #e2e8f0", cursor: "pointer" }}
            onClick={toggleChart}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {CHART_METRIC_LABELS[chartMetric]}
            </span>
            <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Chart series toggle */}
              <div className="btn-group btn-group-sm">
                {(["totalsales", "amountreceived", "balancedue"] as ChartMetric[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`btn ${chartMetric === m ? "btn-secondary" : "btn-outline-secondary"}`}
                    style={{ fontSize: 10, padding: "1px 8px" }}
                    onClick={() => setChartMetric(m)}
                  >
                    {m === "totalsales" ? "Sales" : m === "amountreceived" ? "Payment" : "Balance"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 11,
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  lineHeight: 1.6,
                }}
                onClick={toggleChart}
              >
                {chartCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
                {chartCollapsed ? "Show Chart" : "Hide Chart"}
              </button>
            </div>
          </div>
          {!chartCollapsed && (
            <div style={{ padding: "10px 16px", height: 160 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      )}

      <div
        className="card table-list-card"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          marginBottom: 0,
        }}
      >
        <div
          className="card-body p-0"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          {/* Filter bar */}
          <div
            className="d-flex align-items-end gap-3 flex-wrap px-3 pt-3 pb-2"
            style={{ borderBottom: "1px solid #e2e8f0" }}
          >
            <div style={{ minWidth: 260, flex: 2 }}>
              <MultiOutletSelect
                fetchOutletsList={fetchOutletsList}
                outlets={outlets}
                loading={outletsLoading}
                selectedOutletIds={selectedOutletIds}
                onChange={handleOutletChange}
              />
            </div>

            <div className="d-flex flex-column gap-1">
              <label
                className="form-label mb-0"
                style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
              >
                Period
              </label>
              <div className="btn-group btn-group-sm">
                {(["today", "week", "month", "year", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    className={`btn ${
                      datePreset === p ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    onClick={() => setDatePreset(p)}
                  >
                    {p === "today"
                      ? "Today"
                      : p === "week"
                      ? "This Week"
                      : p === "month"
                      ? "This Month"
                      : p === "year"
                      ? "This Year"
                      : "Custom"}
                  </button>
                ))}
              </div>
            </div>

            {datePreset === "custom" && (
              <div className="d-flex gap-2 align-items-end">
                <div>
                  <label
                    className="form-label mb-1"
                    style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
                  >
                    From
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="form-label mb-1"
                    style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
                  >
                    To
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metric toggle + heat-map legend */}
          <div
            className="d-flex align-items-center gap-3 flex-wrap px-3 py-2"
            style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>
                Also show:
              </span>
              <div className="btn-group btn-group-sm">
                {(Object.keys(TOGGLE_METRIC_LABELS) as SalesMetricMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`btn ${
                      metricMode === mode ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => handleMetricChange(mode)}
                  >
                    {TOGGLE_METRIC_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 ms-auto">
              {[
                { color: "#f3f4f6", label: "No activity" },
                { color: "#f0f9ff", label: "Low share" },
                { color: "#dbeafe", label: "Moderate" },
                { color: "#dcfce7", label: "Dominant (≥40%)" },
              ].map(({ color, label }) => (
                <div key={label} className="d-flex align-items-center gap-1">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: color,
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {!selectedOutletIds.length && (
            <div
              className="d-flex align-items-center justify-content-center flex-column gap-2"
              style={{ flex: 1, color: "#94a3b8" }}
            >
              <i className="fas fa-chart-bar fa-2x" />
              <span style={{ fontSize: 14 }}>
                Select at least one outlet above to load the sales matrix.
              </span>
            </div>
          )}

          {/* Grid */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: selectedOutletIds.length ? "flex" : "none",
              flexDirection: "column",
            }}
          >
            <POSGrid
              key={gridKey}
              ref={gridRef}
              columnDefs={columnDefs as (ColDef | ColGroupDef)[]}
              defaultColDef={stableDefaultColDef}
              fillHeight
              onGridReady={handleGridReady}
              getRowStyle={(params: any) =>
                params.node.rowPinned === "bottom"
                  ? { fontWeight: "bold", background: "#f1f5f9" }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesMatrixComponent;
