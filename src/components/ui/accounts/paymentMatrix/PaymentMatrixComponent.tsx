"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
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
import { GET_PAYMENT_COLLECTION_MATRIX_QUERY } from "@/lib/graphql/query/accounts";
import {
  PaymentMatrixColumn,
  PaymentMatrixRow,
  PaymentMatrixTotals,
  PaymentMetricMode,
} from "@/types/accounts";
import {
  buildPaymentMatrixColumns,
  buildPaymentPinnedRow,
  getPaymentColumnStateForMode,
} from "./paymentMatrixColumnDef";
import MultiOutletSelect from "@/components/ui/products/inventoryPivot/MultiOutletSelect";

const METRIC_LABELS: Record<PaymentMetricMode, string> = {
  totalamount: "Amount",
  paycount: "Count",
  avgamount: "Avg",
};

function getDateRange(preset: string): { startdate: string; enddate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "today") { const s = fmt(now); return { startdate: s, enddate: s }; }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startdate: fmt(start), enddate: fmt(now) };
  }
  if (preset === "month") {
    return { startdate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, enddate: fmt(now) };
  }
  if (preset === "year") {
    return { startdate: `${now.getFullYear()}-01-01`, enddate: fmt(now) };
  }
  return { startdate: fmt(now), enddate: fmt(now) };
}

const PaymentMatrixComponent = () => {
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
  const [metricMode, setMetricMode] = useState<PaymentMetricMode>("totalamount");
  const [datePreset, setDatePreset] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [matrixColumns, setMatrixColumns] = useState<PaymentMatrixColumn[]>([]);
  const matrixColumnsRef = useRef<PaymentMatrixColumn[]>([]);
  const metricModeRef = useRef<PaymentMetricMode>("totalamount");

  const { fetchOutletsList, outlets, loading: outletsLoading } = useOutlets();
  const [getPaymentMatrix] = useLazyQuery(GET_PAYMENT_COLLECTION_MATRIX_QUERY);

  const resolvedDates = useMemo(() => {
    if (datePreset === "custom" && customStart && customEnd) {
      return { startdate: customStart, enddate: customEnd };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  // Stable ref so datasource closure always reads the current date range
  const resolvedDatesRef = useRef(resolvedDates);
  useEffect(() => { resolvedDatesRef.current = resolvedDates; }, [resolvedDates]);

  const columnDefs = useMemo(
    () =>
      buildPaymentMatrixColumns(
        matrixColumns,
        metricModeRef.current,
        () => metricModeRef.current
      ),
    [matrixColumns]
  );

  const stableDefaultColDef = useMemo(() => ({ filter: true }), []);

  const handleMetricChange = useCallback((mode: PaymentMetricMode) => {
    metricModeRef.current = mode;
    if (gridReadyRef.current && matrixColumnsRef.current.length) {
      gridRef.current?.api?.applyColumnState({
        state: getPaymentColumnStateForMode(matrixColumnsRef.current, mode),
        applyOrder: false,
      });
      gridRef.current?.api?.refreshCells({ force: true });
    }
    setMetricMode(mode);
  }, []);

  const handleOutletChange = useCallback((ids: number[]) => {
    setSelectedOutletIds(ids);
    setMatrixColumns([]);
    matrixColumnsRef.current = [];
    gridReadyRef.current = false;
    setGridReady(false);
    setGridKey((k) => k + 1);
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
          const { data } = await getPaymentMatrix({
            variables: {
              storeid: parsedStoreId,
              outletids: selectedOutletIds,
              ...dates,
            },
          });

          if (data?.getPaymentCollectionMatrix) {
            const { columns, data: rows, totals } = data.getPaymentCollectionMatrix;

            const newKey = columns.map((c: PaymentMatrixColumn) => c.outletid).join(",");
            const curKey = matrixColumnsRef.current.map((c) => c.outletid).join(",");
            matrixColumnsRef.current = columns;

            if (newKey !== curKey) {
              setMatrixColumns(columns);
            } else {
              gridRef.current?.api?.applyColumnState({
                state: getPaymentColumnStateForMode(columns, metricModeRef.current),
                applyOrder: false,
              });
            }

            params.success({ rowData: rows, rowCount: rows.length });

            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              gridRef.current?.api?.setGridOption(
                "pinnedBottomRowData",
                totals?.length
                  ? [buildPaymentPinnedRow(totals as PaymentMatrixTotals[])]
                  : []
              );
            }
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
    [parsedStoreId, selectedOutletIds, resolvedDates]
  );

  useEffect(() => {
    if (gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady]);

  const handleGridReady = (_params: GridReadyEvent<PaymentMatrixRow>) => {
    gridReadyRef.current = true;
    setGridReady(true);
  };

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
        title={currentMenu?.permissiondisplayname ?? "Payment Collection Matrix"}
        subtitle={
          currentMenu?.permissiondescription ??
          "Compare payment collections by mode across outlets"
        }
        rightSection={
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => router.push(`${basePath}/customers/applied_payments`)}
          >
            ← Payments
          </button>
        }
      />

      <div
        className="card table-list-card"
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}
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
                    className={`btn ${datePreset === p ? "btn-secondary" : "btn-outline-secondary"}`}
                    onClick={() => setDatePreset(p)}
                  >
                    {p === "today" ? "Today"
                      : p === "week" ? "This Week"
                      : p === "month" ? "This Month"
                      : p === "year" ? "This Year"
                      : "Custom"}
                  </button>
                ))}
              </div>
            </div>

            {datePreset === "custom" && (
              <div className="d-flex gap-2 align-items-end">
                <div>
                  <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
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
                  <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
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

          {/* Metric toggle + legend */}
          <div
            className="d-flex align-items-center gap-3 flex-wrap px-3 py-2"
            style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>Show:</span>
              <div className="btn-group btn-group-sm">
                {(Object.keys(METRIC_LABELS) as PaymentMetricMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`btn ${metricMode === mode ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleMetricChange(mode)}
                  >
                    {METRIC_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Heat-map legend */}
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
                      width: 12, height: 12, borderRadius: 2,
                      background: color, border: "1px solid #e2e8f0", flexShrink: 0,
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
              <i className="fas fa-credit-card fa-2x" />
              <span style={{ fontSize: 14 }}>
                Select at least one outlet above to load the payment matrix.
              </span>
            </div>
          )}

          {/* Grid */}
          <div
            style={{
              flex: 1, minHeight: 0,
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

export default PaymentMatrixComponent;
