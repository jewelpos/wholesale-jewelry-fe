import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef, useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import { Check, Save } from "react-feather";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";
import { GET_GRID_COLUMN_STATE_QUERY } from "@/lib/graphql/query/gridPreferences";
import { SAVE_GRID_COLUMN_STATE_MUTATION } from "@/lib/graphql/mutations/gridPreferences";

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

    // Explicit "Save layout" button — see POSGrid.tsx for the full rationale.
    const [justSaved, setJustSaved] = useState(false);
    const [manualSaving, setManualSaving] = useState(false);
    const handleManualSave = useCallback(() => {
      const api = internalRef.current?.api;
      if (!gridKey || !parsedStoreId || !api || isRestoringRef.current || restorePendingRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const state = api.getColumnState();
      setManualSaving(true);
      saveGridColumnState({
        variables: { storeid: parsedStoreId, gridkey: gridKey, columnstate: JSON.stringify(state) },
      })
        .then(() => {
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 1800);
        })
        .catch(() => {
          // Non-critical — user can just try again
        })
        .finally(() => setManualSaving(false));
    }, [gridKey, parsedStoreId, saveGridColumnState]);

    const handleGridReady = useCallback(
      (params: any) => {
        // Kick off the restore fetch BEFORE the caller's own onGridReady (which often
        // calls autoSizeAllColumns()) — see restorePendingRef above for why this whole
        // sequence matters.
        if (gridKey && parsedStoreId && loadedGridKeyRef.current !== gridKey) {
          loadedGridKeyRef.current = gridKey;
          restorePendingRef.current = true;
          fetchGridColumnState({ variables: { storeid: parsedStoreId, gridkey: gridKey } })
            .then(({ data }) => {
              const raw = data?.getGridColumnState;
              if (!raw) return;
              const state = JSON.parse(raw);
              const api = internalRef.current?.api ?? params.api;
              if (!api) return;
              isRestoringRef.current = true;
              api.applyColumnState({ state, applyOrder: true });
              setTimeout(() => { isRestoringRef.current = false; }, 0);
            })
            .catch(() => {
              // Non-critical — grid just falls back to the default layout
            })
            .finally(() => {
              restorePendingRef.current = false;
            });
        }
        onGridReady?.(params);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [gridKey, parsedStoreId, onGridReady]
    );

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
        style={{
          height: fillHeight ? "100%" : domLayout === "autoHeight" ? "auto" : `calc(100vh - ${height})`,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {gridKey && (
          <div className="d-flex justify-content-end mb-1" style={{ flex: "none" }}>
            <button
              type="button"
              className="btn btn-sm btn-light d-flex align-items-center gap-1 py-0 px-2"
              style={{ fontSize: 12, lineHeight: "22px", border: "1px solid #dee2e6" }}
              onClick={handleManualSave}
              disabled={manualSaving}
              title="Save this grid's column order, widths and visibility for your account"
            >
              {justSaved ? <Check size={12} className="text-success" /> : <Save size={12} />}
              {justSaved ? "Saved" : manualSaving ? "Saving…" : "Save Layout"}
            </button>
          </div>
        )}
        <div className="ag-theme-quartz custom-theme" style={{ flex: "1 1 auto", minHeight: 0, width: "100%" }}>
        <AgGridReact
          ref={combinedRef}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            enableRowGroup: true,
            minWidth: 200,
            ...defaultColDef,
          }}
          gridOptions={{
            suppressServerSideFullWidthLoadingRow: true,
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
          loading={loading}
          masterDetail={masterDetail}
          onColumnVisible={handleColumnVisible}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          {...props}
        />
        </div>
      </div>
    );
  }
);

POSGridClient.displayName = "POSGridClient";

export default POSGridClient;
