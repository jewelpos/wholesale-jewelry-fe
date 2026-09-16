import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";
import { GET_GRID_COLUMN_STATE_QUERY } from "@/lib/graphql/query/gridPreferences";
import { SAVE_GRID_COLUMN_STATE_MUTATION } from "@/lib/graphql/mutations/gridPreferences";
import GridLayoutToolPanel from "./GridLayoutToolPanel";

interface POSGridClientProps extends AgGridReactProps {
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
  loading?: boolean;
  masterDetail?: boolean;
  height?: string;
  fillHeight?: boolean;
  /** Unique id for this grid (e.g. "user-list"). When set, column order/visibility/width
   * is saved per-user and restored automatically. Omit to opt out of persistence. */
  gridKey?: string;
}

const POSGridClient = forwardRef<AgGridReact, POSGridClientProps>(
  (
    {
      columnDefs,
      gridOptions,
      onGridReady,
      defaultColDef = { filter: true, floatingFilter: true },
      rowSelection,
      rowData,
      loading,
      masterDetail,
      height = "300px",
      fillHeight = false,
      domLayout = "normal",
      gridKey,
      ...props
    },
    ref
  ) => {
    const { autoSizeStrategy } = useAutoSizeAggrid();
    const { storeId: storeIdParam } = useParams();
    const parsedStoreId = parseInt(storeIdParam as string, 10);
    const internalRef = useRef<AgGridReact>(null);
    const isRestoringRef = useRef(false);
    // True from the instant a restore attempt is kicked off until its fetch actually
    // settles — see POSGrid.tsx's identical restorePendingRef for the full root-cause
    // writeup (2026-09-12 "grid layout resets itself" investigation). Without this, a
    // caller's own onGridReady (e.g. autoSizeAllColumns) can fire a resize against the
    // grid's still-default widths before this restore's async fetch resolves, and the
    // debounced save below can persist those defaults over the user's real saved layout.
    const restorePendingRef = useRef(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadedGridKeyRef = useRef<string | null>(null);

    const combinedRef = useCallback(
      (node: AgGridReact | null) => {
        (internalRef as React.MutableRefObject<AgGridReact | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<AgGridReact | null>).current = node;
        }
      },
      [ref]
    );

    const [fetchGridColumnState] = useLazyQuery(GET_GRID_COLUMN_STATE_QUERY, { fetchPolicy: "network-only" });
    const [saveGridColumnState] = useMutation(SAVE_GRID_COLUMN_STATE_MUTATION);

    const persistColumnState = useCallback(() => {
      if (!gridKey || !parsedStoreId || isRestoringRef.current || restorePendingRef.current) return;
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

    // Shared by the automatic restore-on-ready below and the manual "Reset to My
    // Saved Layout" sidebar button (see GridLayoutToolPanel.tsx / POSGrid.tsx for the
    // full rationale) — fetches the DB row and applies it to the grid. Doesn't touch
    // loadedGridKeyRef/restorePendingRef itself; callers decide the guard behavior.
    const fetchAndApplySavedState = useCallback(
      (paramsApi?: any): Promise<void> => {
        if (!gridKey || !parsedStoreId) return Promise.resolve();
        return fetchGridColumnState({ variables: { storeid: parsedStoreId, gridkey: gridKey } })
          .then(({ data }) => {
            const raw = data?.getGridColumnState;
            if (!raw) return;
            const state = JSON.parse(raw);
            const api = internalRef.current?.api ?? paramsApi;
            if (!api) return;
            isRestoringRef.current = true;
            api.applyColumnState({ state, applyOrder: true });
            setTimeout(() => { isRestoringRef.current = false; }, 0);
          })
          .catch(() => {
            // Non-critical — grid just falls back to whatever it currently shows
          });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [gridKey, parsedStoreId]
    );

    // Manual "Reset to My Saved Layout" — sidebar Layout tab. Unlike the auto-restore
    // in handleGridReady, this is repeatable (no loadedGridKeyRef guard) since it's an
    // explicit, on-demand user action, not the one-shot on-ready restore.
    const handleManualReset = useCallback(() => {
      return fetchAndApplySavedState();
    }, [fetchAndApplySavedState]);

    // Manual "Save Current Layout" — sidebar Layout tab. Bypasses the 800ms debounce
    // and saves immediately; still respects isRestoringRef/restorePendingRef so it
    // can't capture/persist a layout the grid hasn't actually finished settling into.
    const handleManualSave = useCallback(async () => {
      const api = internalRef.current?.api;
      if (!gridKey || !parsedStoreId || !api || isRestoringRef.current || restorePendingRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const state = api.getColumnState();
      await saveGridColumnState({
        variables: { storeid: parsedStoreId, gridkey: gridKey, columnstate: JSON.stringify(state) },
      });
    }, [gridKey, parsedStoreId, saveGridColumnState]);

    const handleGridReady = useCallback(
      (params: any) => {
        // Kick off the restore fetch BEFORE the caller's own onGridReady (which often
        // calls autoSizeAllColumns()) — see restorePendingRef above for why this whole
        // sequence matters.
        if (gridKey && parsedStoreId && loadedGridKeyRef.current !== gridKey) {
          loadedGridKeyRef.current = gridKey;
          restorePendingRef.current = true;
          fetchAndApplySavedState(params.api).finally(() => {
            restorePendingRef.current = false;
          });
        }
        onGridReady?.(params);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [gridKey, parsedStoreId, onGridReady, fetchAndApplySavedState]
    );

    // Third sidebar tab, added only when this grid persists layout (gridKey set) —
    // see GridLayoutToolPanel.tsx for why this location was chosen over a button
    // above/inside the grid.
    const sideBarToolPanels = useMemo(() => {
      const panels: any[] = [
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
      ];
      if (gridKey) {
        panels.push({
          id: "layout",
          labelDefault: "Layout",
          labelKey: "layout",
          iconKey: "save",
          toolPanel: GridLayoutToolPanel,
          toolPanelParams: { onSave: handleManualSave, onReset: handleManualReset },
        });
      }
      return panels;
    }, [gridKey, handleManualSave, handleManualReset]);

    // The sideBar prop itself must also be memoized, not just the toolPanels array —
    // see POSGrid.tsx's identical sideBarConfig for the full explanation (AG Grid's
    // React wrapper reinitializes/collapses the whole side bar whenever this prop's
    // object reference changes, which an inline literal guarantees on every render).
    const sideBarConfig = useMemo(() => ({
      toolPanels: sideBarToolPanels,
      defaultToolPanel: "", // optional: open with Filters
    }), [sideBarToolPanels]);

    const handleColumnVisible = useCallback(
      (e: any) => {
        if (!isRestoringRef.current && !restorePendingRef.current) persistColumnState();
        (props as any).onColumnVisible?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );
    const handleColumnMoved = useCallback(
      (e: any) => {
        if (e.finished && !isRestoringRef.current && !restorePendingRef.current) persistColumnState();
        (props as any).onColumnMoved?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );
    const handleColumnResized = useCallback(
      (e: any) => {
        if (e.finished && !isRestoringRef.current && !restorePendingRef.current) persistColumnState();
        (props as any).onColumnResized?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );

    return (
      <div
        className="ag-theme-quartz custom-theme"
        style={{
          height: fillHeight ? "100%" : domLayout === "autoHeight" ? "auto" : `calc(100vh - ${height})`,
          width: "100%",
        }}
      >
        <AgGridReact
          ref={combinedRef}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            enableRowGroup: true,
            // Was 200 — see POSGrid.tsx's identical fix for why: a blanket floor with
            // no matching maxWidth blocked shrinking any column below it while growing
            // stayed unrestricted ("can increase but not decrease", 2026-09-15).
            minWidth: 60,
            ...defaultColDef,
          }}
          gridOptions={{
            suppressServerSideFullWidthLoadingRow: true,
            icons: {
              save: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
            },
            ...gridOptions,
          }}
          rowHeight={28}
          headerHeight={32}
          rowData={rowData}
          rowSelection={rowSelection}
          rowGroupPanelShow="always"
          domLayout={domLayout}
          pagination={true}
          onGridReady={handleGridReady}
          autoSizeStrategy={autoSizeStrategy}
          paginationPageSize={20}
          loadingOverlayComponent={CustomLoadingOverlay}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          sideBar={sideBarConfig}
          groupDisplayType="singleColumn"
          maxBlocksInCache={100}
          loading={loading}
          masterDetail={masterDetail}
          onColumnVisible={handleColumnVisible}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          {...props}
        />
      </div>
    );
  }
);

POSGridClient.displayName = "POSGridClient";

export default POSGridClient;
