import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";
import { useFloatingFilter } from "./FloatingFilterContext";
import { GET_GRID_COLUMN_STATE_QUERY } from "@/lib/graphql/query/gridPreferences";
import { SAVE_GRID_COLUMN_STATE_MUTATION } from "@/lib/graphql/mutations/gridPreferences";

interface POSGridProps extends AgGridReactProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnDefs: any[]; // Replace `any[]` with the actual type of columnDefs if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gridOptions?: any; // You can type gridOptions more specifically if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onGridReady: (params: any) => void; // Type this callback function as needed
  // You can type gridOptions more specifically if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultColDef?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowSelection?: any;
  domLayout?: "autoHeight" | "normal";
  /** Additional px to subtract from 100vh. Default 300. Use higher values when summary cards/charts are above the grid. */
  heightOffset?: number;
  /** When true, grid height is 100% (use inside a flex-fill container). Overrides heightOffset. */
  fillHeight?: boolean;
  /** Unique id for this grid (e.g. "product-list"). When set, column order/visibility/width
   * is saved per-user and restored automatically. Omit to opt out of persistence. */
  gridKey?: string;
}

const POSGrid = forwardRef<AgGridReact, POSGridProps>(
  (
    {
      columnDefs,
      gridOptions,
      onGridReady,
      defaultColDef = { filter: true },
      rowSelection,
      domLayout = "normal",
      heightOffset = 300,
      fillHeight = false,
      gridKey,
      ...props
    },
    forwardedRef
  ) => {
    const { autoSizeStrategy } = useAutoSizeAggrid();
    const { showFilters } = useFloatingFilter();
    const { storeId: storeIdParam } = useParams();
    const parsedStoreId = parseInt(storeIdParam as string, 10);

    const effectiveDefaultColDef = useMemo(() => ({
      sortable: true,
      enableRowGroup: true,
      minWidth: 200,
      ...defaultColDef,
      floatingFilter: defaultColDef?.floatingFilter ?? showFilters,
    }), [defaultColDef, showFilters]);

    // Internal ref needed to access grid API for column state restore
    const internalRef = useRef<AgGridReact>(null);

    // Track user-set column visibility so we can restore it if AG Grid resets
    const savedColStateRef = useRef<any[] | null>(null);
    const isRestoringRef = useRef(false);

    // Combine forwarded ref with internal ref
    const combinedRef = useCallback(
      (node: AgGridReact | null) => {
        (internalRef as React.MutableRefObject<AgGridReact | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<AgGridReact | null>).current = node;
        }
      },
      [forwardedRef]
    );

    // Persisted per-user column layout (order/visibility/width) — only active when a
    // gridKey is supplied by the caller. Saves are debounced so a drag or resize doesn't
    // fire a request per pixel; loading happens once, right after the grid is ready.
    const [fetchGridColumnState] = useLazyQuery(GET_GRID_COLUMN_STATE_QUERY, { fetchPolicy: "network-only" });
    const [saveGridColumnState] = useMutation(SAVE_GRID_COLUMN_STATE_MUTATION);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const persistColumnState = useCallback(() => {
      if (!gridKey || !parsedStoreId || isRestoringRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const api = internalRef.current?.api;
        if (!api) return;
        const state = api.getColumnState();
        saveGridColumnState({
          variables: { storeid: parsedStoreId, gridkey: gridKey, columnstate: JSON.stringify(state) },
        }).catch(() => {
          // Non-critical — column layout just won't persist this time
        });
      }, 800);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridKey, parsedStoreId]);

    // Load the saved layout once the grid is ready
    const loadedGridKeyRef = useRef<string | null>(null);
    const handleGridReady = useCallback(
      (params: any) => {
        onGridReady?.(params);
        if (!gridKey || !parsedStoreId || loadedGridKeyRef.current === gridKey) return;
        loadedGridKeyRef.current = gridKey;
        fetchGridColumnState({ variables: { storeid: parsedStoreId, gridkey: gridKey } })
          .then(({ data }) => {
            const raw = data?.getGridColumnState;
            if (!raw) return;
            const state = JSON.parse(raw);
            const api = internalRef.current?.api ?? params.api;
            if (!api) return;
            isRestoringRef.current = true;
            api.applyColumnState({ state, applyOrder: true });
            savedColStateRef.current = state;
            setTimeout(() => { isRestoringRef.current = false; }, 0);
          })
          .catch(() => {
            // Non-critical — grid just falls back to the default layout
          });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [gridKey, parsedStoreId, onGridReady]
    );

    // Save column state whenever the user toggles column visibility
    const handleColumnVisible = useCallback(
      (e: any) => {
        if (!isRestoringRef.current) {
          savedColStateRef.current = e.api.getColumnState();
          persistColumnState();
        }
        // Forward to any parent-supplied handler
        (props as any).onColumnVisible?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );

    // Save column state once a drag-to-reorder or drag-to-resize finishes. Must also
    // update savedColStateRef (not just persist to the backend) — otherwise the
    // "restore after columnDefs/defaultColDef change" effect below keeps reapplying
    // the stale pre-move order on the next re-render, snapping the column right back.
    const handleColumnMoved = useCallback(
      (e: any) => {
        if (e.finished && !isRestoringRef.current) {
          savedColStateRef.current = e.api.getColumnState();
          persistColumnState();
        }
        (props as any).onColumnMoved?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );
    const handleColumnResized = useCallback(
      (e: any) => {
        if (e.finished && !isRestoringRef.current) {
          savedColStateRef.current = e.api.getColumnState();
          persistColumnState();
        }
        (props as any).onColumnResized?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );

    // Clicking a column header to sort never updated savedColStateRef, so the
    // "restore after columnDefs/defaultColDef change" effect below kept reapplying
    // the pre-sort state on the next re-render (columnDefs is rebuilt on most
    // renders across list pages), snapping sort back to default immediately.
    const handleSortChanged = useCallback(
      (e: any) => {
        if (!isRestoringRef.current) {
          savedColStateRef.current = e.api.getColumnState();
        }
        (props as any).onSortChanged?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    // After columnDefs or defaultColDef changes, restore saved user column visibility.
    // AG Grid re-applies defaults on prop changes which can reset user-set hide state.
    useEffect(() => {
      if (!savedColStateRef.current) return;
      const api = internalRef.current?.api;
      if (!api) return;
      const saved = savedColStateRef.current;
      const raf = requestAnimationFrame(() => {
        isRestoringRef.current = true;
        // applyOrder: true — a columnDefs/defaultColDef re-render (e.g. from the debounced
        // save mutation settling) otherwise resets AG Grid's column order back to the
        // columnDefs array order, which looked like a reorder "snapping back" immediately.
        api.applyColumnState({ state: saved, applyOrder: true });
        // Clear flag after AG Grid finishes processing
        setTimeout(() => { isRestoringRef.current = false; }, 0);
      });
      return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnDefs, effectiveDefaultColDef]);

    return (
      <div
        className="ag-theme-quartz custom-theme"
        style={{
          height: fillHeight ? "100%" : domLayout === "autoHeight" ? "auto" : `calc(100vh - ${heightOffset}px)`,
          width: "100%",
        }}
      >
        <AgGridReact
          ref={combinedRef}
          columnDefs={columnDefs}
          defaultColDef={effectiveDefaultColDef}
          rowHeight={28}
          headerHeight={32}
          gridOptions={{
            suppressServerSideFullWidthLoadingRow: true,
            filterDebounceMs: 300,
            ...gridOptions,
          }}
          rowSelection={rowSelection}
          rowGroupPanelShow="onlyWhenGrouping"
          domLayout={domLayout}
          rowModelType="serverSide"
          pagination={true}
          onGridReady={handleGridReady}
          autoSizeStrategy={autoSizeStrategy}
          paginationPageSize={20}
          loadingOverlayComponent={CustomLoadingOverlay}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          sideBar={{
            toolPanels: [
              {
                id: "columns",
                labelDefault: "Columns",
                labelKey: "columns",
                iconKey: "columns",
                toolPanel: "agColumnsToolPanel",

                toolPanelParams: {
                  suppressRowGroups: true,
                  suppressValues: true,
                  suppressPivots: true, // show Pivot section
                  suppressPivotMode: true,
                },
              },
              {
                id: "filters",
                labelDefault: "Filters",
                labelKey: "filters",
                iconKey: "filter",
                toolPanel: "agFiltersToolPanel",
              },
            ],
            defaultToolPanel: "", // optional: open with Filters
          }}
          groupDisplayType="singleColumn"
          maxBlocksInCache={100}
          onColumnVisible={handleColumnVisible}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          onSortChanged={handleSortChanged}
          {...props}
        />
      </div>
    );
  }
);

POSGrid.displayName = "POSGrid";

export default POSGrid;
