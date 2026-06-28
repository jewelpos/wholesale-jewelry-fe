"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import "ag-grid-enterprise";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { filterVariables } from "@/lib/utils/gridFilters";
import { useDebounce } from "@/hooks/useDebounce";
import useOutlets from "@/hooks/useOutlets";
import useMenu from "@/hooks/useMenu";
import POSGrid from "@/components/ui/grid/POSGrid";
import PageHeader from "@/components/ui/PageHeader";
import { GET_INVENTORY_MATRIX_QUERY } from "@/lib/graphql/query/products";
import {
  InventoryMatrixRow,
  InventoryMatrixUnitTotals,
  MatrixMetricMode,
  MatrixThresholdMode,
  OutletMatrixColumn,
} from "@/types/product";
import {
  buildMatrixColumns,
  buildPinnedRows,
  getColumnStateForMode,
} from "./matrixColumnDef";
import MultiOutletSelect from "./MultiOutletSelect";

class GridErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[InventoryMatrix] Grid error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-3 text-danger" style={{ fontSize: 12 }}>
          <strong>Grid error:</strong> {this.state.error.message}
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 11 }}>
            {this.state.error.stack}
          </pre>
          <button
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const METRIC_LABELS: Record<MatrixMetricMode, string> = {
  onhand: "On Hand",
  available: "Available",
  days_of_stock: "Days of Stock",
  sold_qty: "Sold Qty",
};

const InventoryMatrixComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentMenu, currentPath } = useMenu();

  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState(false);
  const gridReadyRef = useRef(false);
  const [gridKey, setGridKey] = useState(0);

  const [selectedOutletIds, setSelectedOutletIds] = useState<number[]>([]);
  const [metricMode, setMetricMode] = useState<MatrixMetricMode>("onhand");
  const [thresholdMode, setThresholdMode] = useState<MatrixThresholdMode>("range");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Outlet column structure returned by the backend — drives columnDefs prop rebuild.
  // This only changes when the outlet selection changes, NOT when metric/threshold changes.
  const [matrixColumns, setMatrixColumns] = useState<OutletMatrixColumn[]>([]);

  // Refs so datasource and metric/threshold handlers always see current values without
  // stale closures — and without triggering the columnDefs useMemo.
  const matrixColumnsRef = useRef<OutletMatrixColumn[]>([]);
  const metricModeRef = useRef<MatrixMetricMode>("onhand");
  const thresholdModeRef = useRef<MatrixThresholdMode>("range");

  const { fetchOutletsList, outlets, loading: outletsLoading } = useOutlets();
  const [getInventoryMatrix] = useLazyQuery(GET_INVENTORY_MATRIX_QUERY);

  const includeSoldQty = metricMode === "sold_qty";

  // columnDefs ONLY depends on matrixColumns (not metricMode / thresholdMode).
  // After the initial outlet load, switching metrics never rebuilds this memo, so AG Grid
  // never receives a new columnDefs prop — which avoids the ColGroupDef reconciliation bug
  // in AG Grid 32 that nulls ColumnGroup.providedColumnGroup mid-cycle.
  //
  // Metric switching uses api.applyColumnState to show/hide per-metric columns.
  // Threshold switching uses api.refreshCells to re-evaluate cellStyle closures.
  // Both paths are captured via refs so the closures always read current values.
  const columnDefs = useMemo(
    () =>
      buildMatrixColumns(
        matrixColumns,
        metricModeRef.current,
        () => thresholdModeRef.current
      ),
    [matrixColumns]
  );

  // useCallback with [] — reads gridReady from ref to avoid stale closure.
  const handleMetricChange = useCallback((mode: MatrixMetricMode) => {
    metricModeRef.current = mode;
    if (gridReadyRef.current && matrixColumnsRef.current.length) {
      gridRef.current?.api?.applyColumnState({
        state: getColumnStateForMode(matrixColumnsRef.current, mode),
        applyOrder: false,
      });
      // Force cells to re-evaluate valueGetters after visibility change.
      gridRef.current?.api?.refreshCells({ force: true });
    }
    setMetricMode(mode);
  }, []);

  const handleThresholdChange = useCallback((mode: MatrixThresholdMode) => {
    thresholdModeRef.current = mode;
    setThresholdMode(mode);
    if (gridReadyRef.current) {
      gridRef.current?.api?.refreshCells({ force: true });
    }
  }, []);

  const handleOutletChange = useCallback((ids: number[]) => {
    setSelectedOutletIds(ids);
    setMatrixColumns([]);
    matrixColumnsRef.current = [];
    gridReadyRef.current = false;
    setGridKey((k) => k + 1);
    setGridReady(false);
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

        const filters = filterVariables(
          params,
          debouncedSearch,
          "itemcode, itemdescription, categoryname, subcategoryname"
        );

        const result = await handleTryCatch(async () => {
          const { data } = await getInventoryMatrix({
            variables: {
              storeid: parsedStoreId,
              outletids: selectedOutletIds,
              includeSoldQty,
              ...filters,
            },
          });

          if (data?.getInventoryMatrix) {
            const { columns, data: rows, total, totalsRows } =
              data.getInventoryMatrix;

            // Check if the outlet structure actually changed (new set of outlets selected
            // vs. a re-fetch triggered by metric/search/threshold change).
            const newKey = columns.map((c: OutletMatrixColumn) => c.outletid).join(",");
            const curKey = matrixColumnsRef.current.map((c) => c.outletid).join(",");
            matrixColumnsRef.current = columns;

            if (newKey !== curKey) {
              // Outlet structure changed: update state → columnDefs prop rebuilds (flat→grouped).
              // buildMatrixColumns uses metricModeRef.current so the correct metric
              // columns are visible from the start.
              setMatrixColumns(columns);
            } else {
              // Same outlet structure — only data changed (metric/search re-fetch).
              // Apply current metric visibility imperatively; no columnDefs prop change.
              gridRef.current?.api?.applyColumnState({
                state: getColumnStateForMode(columns, metricModeRef.current),
                applyOrder: false,
              });
            }

            params.success({ rowData: rows, rowCount: total });

            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
              gridRef.current?.api?.setGridOption("pinnedBottomRowData", []);
            } else {
              gridRef.current?.api?.hideOverlay();
              gridRef.current?.api?.setGridOption(
                "pinnedBottomRowData",
                totalsRows?.length
                  ? buildPinnedRows(totalsRows as InventoryMatrixUnitTotals[])
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
            showNotification({
              message: result.error,
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
          params.fail();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsedStoreId, selectedOutletIds, debouncedSearch, includeSoldQty]
  );

  useEffect(() => {
    if (gridReady) {
      gridRef.current?.api?.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady]);

  // Stable defaultColDef so POSGrid's effectiveDefaultColDef useMemo doesn't rebuild on
  // every parent render — which would fire useEffect([columnDefs, effectiveDefaultColDef])
  // and schedule an rAF that fights our applyColumnState visibility calls.
  const stableDefaultColDef = useMemo(() => ({ filter: true }), []);

  const handleGridReady = (params: GridReadyEvent<InventoryMatrixRow>) => {
    gridReadyRef.current = true;
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
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
        title={currentMenu?.permissiondisplayname ?? "Inventory Matrix"}
        subtitle={
          currentMenu?.permissiondescription ??
          "Compare inventory across outlets and warehouses"
        }
        rightSection={
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => router.push(`${currentPath}/list`)}
          >
            ← Products
          </button>
        }
      />

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
            <div style={{ minWidth: 200, flex: 1 }}>
              <label
                className="form-label mb-1"
                style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Item code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ minWidth: 260, flex: 2 }}>
              <MultiOutletSelect
                fetchOutletsList={fetchOutletsList}
                outlets={outlets}
                loading={outletsLoading}
                selectedOutletIds={selectedOutletIds}
                onChange={handleOutletChange}
              />
            </div>
          </div>

          {/* Metric + threshold toggles */}
          <div
            className="d-flex align-items-center gap-3 flex-wrap px-3 py-2"
            style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>
                Show:
              </span>
              <div className="btn-group btn-group-sm">
                {(Object.keys(METRIC_LABELS) as MatrixMetricMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`btn ${
                      metricMode === mode ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => handleMetricChange(mode)}
                  >
                    {mode === "sold_qty" ? (
                      <>
                        Sold Qty{" "}
                        <span
                          className="badge bg-warning text-dark ms-1"
                          style={{ fontSize: 10 }}
                        >
                          slow
                        </span>
                      </>
                    ) : (
                      METRIC_LABELS[mode]
                    )}
                  </button>
                ))}
              </div>
            </div>

            {(metricMode === "onhand" || metricMode === "available") && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>
                  Color by:
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn ${
                      thresholdMode === "range" ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    onClick={() => handleThresholdChange("range")}
                  >
                    Range
                  </button>
                  <button
                    className={`btn ${
                      thresholdMode === "reorder_point"
                        ? "btn-secondary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handleThresholdChange("reorder_point")}
                  >
                    Reorder Point
                  </button>
                </div>
              </div>
            )}

            {/* Heat-map legend */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              {[
                { color: "#fee2e2", label: "Out of stock" },
                { color: "#fef3c7", label: "Low" },
                { color: "#dcfce7", label: "Healthy" },
                { color: "#dbeafe", label: "Overstocked" },
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

          {/* Empty state when no outlets selected */}
          {!selectedOutletIds.length && (
            <div
              className="d-flex align-items-center justify-content-center flex-column gap-2"
              style={{ flex: 1, color: "#94a3b8" }}
            >
              <i className="fas fa-th fa-2x" />
              <span style={{ fontSize: 14 }}>
                Select at least one outlet above to load the inventory matrix.
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
            <GridErrorBoundary>
              <POSGrid
                key={gridKey}
                ref={gridRef}
                columnDefs={columnDefs}
                defaultColDef={stableDefaultColDef}
                fillHeight
                onGridReady={handleGridReady}
                getRowStyle={(params) =>
                  params.node.rowPinned === "bottom"
                    ? { fontWeight: "bold", background: "#f1f5f9" }
                    : undefined
                }
              />
            </GridErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryMatrixComponent;
