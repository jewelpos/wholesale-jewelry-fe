import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import { Check, Save } from "react-feather";
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
    // True from the instant a restore attempt is kicked off until its fetch actually
    // settles (success, empty, or error) — NOT just during the synchronous
    // applyColumnState() call like isRestoringRef. See restoreColumnState below for why
    // this exists (the "layout resets itself" root cause found 2026-09-12).
    const restorePendingRef = useRef(false);

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

    // A pending debounced save left running past unmount would read internalRef.current
    // (possibly a torn-down grid instance) and persist whatever that yields — clear it
    // on unmount instead of letting it fire into the void.
    useEffect(() => {
      return () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      };
    }, []);

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

    // Explicit "Save layout" button (requested 2026-09-12 alongside the auto-save race
    // fix above) — lets a user commit their current column setup on demand instead of
    // relying only on the debounced auto-save + restore-on-next-load. Bypasses the
    // 800ms debounce and saves immediately; still respects isRestoringRef/restorePendingRef
    // so a click can't capture/persist a layout the grid hasn't actually finished
    // settling into yet.
    const [justSaved, setJustSaved] = useState(false);
    const [manualSaving, setManualSaving] = useState(false);
    const handleManualSave = useCallback(() => {
      const api = internalRef.current?.api;
      if (!gridKey || !parsedStoreId || !api || isRestoringRef.current || restorePendingRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const state = api.getColumnState();
      savedColStateRef.current = state;
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

    // Load the saved layout once the grid is ready. AG Grid only ever calls onGridReady
    // ONCE per grid instance — it never fires again on a later re-render — so if
    // parsedStoreId (a route param) hasn't resolved yet at that exact instant, bailing
    // out here with no retry means the restore is silently skipped for the rest of this
    // page view: the grid falls back to its default layout, and the next column the
    // user touches gets saved as a "change" from that default, overwriting the real
    // saved layout. Pages that fetch more before mounting their grid (extra summary/
    // settings queries) shift exactly when the grid becomes ready relative to when the
    // param resolves, which is why this showed up on some grids/pages and not others.
    // gridIsReadyRef + the retry effect below give it a second chance once the param
    // does resolve, instead of only the one shot at onGridReady time.
    const loadedGridKeyRef = useRef<string | null>(null);
    const gridIsReadyRef = useRef(false);
    const gridReadyParamsRef = useRef<any>(null);

    // Root cause of the "layout resets itself" reports (2026-09-12): callers' own
    // onGridReady handlers often call params.api.autoSizeAllColumns() (CustomerListComponent,
    // SalesListComponent, ...), which fires real onColumnResized events against the
    // grid's DEFAULT columnDefs widths. Those events landed *before* this restore's
    // async network fetch (fetchGridColumnState, fetchPolicy "network-only") had
    // resolved — isRestoringRef was still false at that point since nothing had started
    // applying anything yet — so handleColumnResized happily scheduled a normal
    // 800ms-debounced save. If that fetch took longer than 800ms (heavier concurrent
    // page load, backend under load, slower network — all more likely against the real
    // DEV/UAT/PRD servers than local), the debounced save fired FIRST with the
    // autosized *default* widths, overwriting the user's real saved layout in the DB
    // with defaults. The grid still visually showed the correct restored layout a
    // moment later (applyColumnState ran fine), which is exactly why it looked fine
    // right then — the corruption was silent and only surfaced on the *next* load (new
    // tab, navigate away and back, logout/login), when the restore fetched the
    // now-corrupted default row. restorePendingRef (declared above, alongside
    // isRestoringRef) gates every persist path on this and closes the race regardless
    // of how slow the restore fetch is.
    const restoreColumnState = useCallback(() => {
      if (!gridKey || !parsedStoreId || loadedGridKeyRef.current === gridKey) return;
      loadedGridKeyRef.current = gridKey;
      restorePendingRef.current = true;
      fetchGridColumnState({ variables: { storeid: parsedStoreId, gridkey: gridKey } })
        .then(({ data }) => {
          const raw = data?.getGridColumnState;
          if (!raw) return;
          const rawState = JSON.parse(raw);
          const api = internalRef.current?.api ?? gridReadyParamsRef.current?.api;
          if (!api) return;
          // Strip sort/sortIndex here too — same reason as the columnDefs-change restore
          // effect below: applying a saved sort via the API fires the grid's own
          // sort-changed handling (an SSRM refetch), which was fighting with this very
          // restore and snapping order/visibility/width right back to default the
          // moment the sort "changed". This restore's job is order/visibility/width
          // only; sort is left to whatever the grid/datasource's own default is.
          const state = rawState.map(({ sort, sortIndex, ...rest }: any) => rest);
          isRestoringRef.current = true;
          api.applyColumnState({ state, applyOrder: true });
          savedColStateRef.current = state;
          setTimeout(() => { isRestoringRef.current = false; }, 0);
        })
        .catch(() => {
          // Non-critical — grid just falls back to the default layout
        })
        .finally(() => {
          restorePendingRef.current = false;
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridKey, parsedStoreId]);

    const handleGridReady = useCallback(
      (params: any) => {
        gridIsReadyRef.current = true;
        gridReadyParamsRef.current = params;
        // Kick off the restore fetch BEFORE the caller's own onGridReady (which often
        // calls autoSizeAllColumns()) so the network round trip has the largest possible
        // head start against the debounced save below — narrows the race, doesn't fully
        // close it (that's what restorePendingRef is for), but every bit helps.
        restoreColumnState();
        onGridReady?.(params);
      },
      [onGridReady, restoreColumnState]
    );

    // Retry once parsedStoreId (or gridKey) becomes available/changes after the grid
    // was already ready — restoreColumnState's own loadedGridKeyRef guard makes this a
    // no-op if the restore already happened, so this only ever does real work for the
    // "wasn't ready yet at onGridReady time" case above.
    useEffect(() => {
      if (gridIsReadyRef.current) restoreColumnState();
    }, [restoreColumnState]);

    // Save column state whenever the user toggles column visibility.
    // Also skipped while restorePendingRef is true — see restoreColumnState above:
    // a caller's own onGridReady (e.g. autoSizeAllColumns) can fire this against the
    // grid's still-default layout before the restore fetch has resolved. Recording
    // that into savedColStateRef would feed the DEFAULT layout back into the
    // "restore after columnDefs changes" effect below, and persistColumnState() would
    // silently overwrite the real saved DB row with it.
    const handleColumnVisible = useCallback(
      (e: any) => {
        if (!isRestoringRef.current && !restorePendingRef.current) {
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
    // Same restorePendingRef guard as handleColumnVisible above.
    const handleColumnMoved = useCallback(
      (e: any) => {
        if (e.finished && !isRestoringRef.current && !restorePendingRef.current) {
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
        if (e.finished && !isRestoringRef.current && !restorePendingRef.current) {
          savedColStateRef.current = e.api.getColumnState();
          persistColumnState();
        }
        (props as any).onColumnResized?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [persistColumnState]
    );

    // After columnDefs or defaultColDef changes, restore saved user column visibility.
    // AG Grid re-applies defaults on prop changes which can reset user-set hide state.
    useEffect(() => {
      if (!savedColStateRef.current) return;
      const api = internalRef.current?.api;
      if (!api) return;
      // Strip sort/sortIndex before reapplying — this effect's job is order/visibility/
      // width persistence, not sort. Including sort here caused an infinite loop: any
      // click-to-sort triggers a re-render (SSRM row refetch → parent state update),
      // which reruns this effect, which reapplies sort via the API, which SSRM treats
      // as a fresh sort → another refetch → another re-render → ad infinitum, seen as
      // the grid flashing/loading forever. Leaving sort out means this effect can never
      // fight with (or retrigger from) the grid's own live sort state.
      const saved = savedColStateRef.current.map(({ sort, sortIndex, ...rest }) => rest);
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

    const wrapperHeight = fillHeight ? "100%" : domLayout === "autoHeight" ? "auto" : `calc(100vh - ${heightOffset}px)`;

    return (
      <div
        style={{
          height: wrapperHeight,
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
        <div
          className="ag-theme-quartz custom-theme"
          style={{
            flex: "1 1 auto",
            minHeight: 0,
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
          {...props}
        />
        </div>
      </div>
    );
  }
);

POSGrid.displayName = "POSGrid";

export default POSGrid;
