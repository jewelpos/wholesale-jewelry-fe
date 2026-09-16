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
import GridLayoutToolPanel from "./GridLayoutToolPanel";

// Stable reference for callers that don't pass their own defaultColDef — an inline
// `{ filter: true }` default *parameter* value is a NEW object every render (JS
// re-evaluates default parameters on every call), which defeated the
// effectiveDefaultColDef useMemo below on literally every render. See
// columnDefsSignature/defaultColDefSignature further down for the full story.
const DEFAULT_COL_DEF = { filter: true };

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
      defaultColDef = DEFAULT_COL_DEF,
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
      // Was 200 — a blanket floor with no matching maxWidth, so every column could be
      // dragged wider freely but never shrunk below 200px regardless of how narrow its
      // content actually needed to be (reported 2026-09-15: "can increase but not
      // decrease", across every grid). 60 still stops a column from being dragged down
      // to unreadable/zero width, without getting in the way of an otherwise-legitimate
      // resize. A column can still set its own larger minWidth in its own ColumnDef.
      minWidth: 60,
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

    // Manual "Save Current Layout" — sidebar Layout tab (see GridLayoutToolPanel).
    // Bypasses the 800ms debounce and saves immediately; still respects
    // isRestoringRef/restorePendingRef so it can't capture/persist a layout the grid
    // hasn't actually finished settling into yet.
    const handleManualSave = useCallback(async () => {
      const api = internalRef.current?.api;
      if (!gridKey || !parsedStoreId || !api || isRestoringRef.current || restorePendingRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const state = api.getColumnState();
      savedColStateRef.current = state;
      await saveGridColumnState({
        variables: { storeid: parsedStoreId, gridkey: gridKey, columnstate: JSON.stringify(state) },
      });
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
    // Shared by the automatic restore-on-ready below and the manual "Reset to My
    // Saved Layout" sidebar button — fetches the DB row and applies it to the grid.
    // Doesn't touch loadedGridKeyRef/restorePendingRef itself; callers decide whether
    // this is the guarded one-shot auto-restore or a repeatable manual action.
    const fetchAndApplySavedState = useCallback((): Promise<void> => {
      if (!gridKey || !parsedStoreId) return Promise.resolve();
      return fetchGridColumnState({ variables: { storeid: parsedStoreId, gridkey: gridKey } })
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
          // Non-critical — grid just falls back to whatever it currently shows
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridKey, parsedStoreId]);

    const restoreColumnState = useCallback(() => {
      if (!gridKey || !parsedStoreId || loadedGridKeyRef.current === gridKey) return;
      loadedGridKeyRef.current = gridKey;
      restorePendingRef.current = true;
      fetchAndApplySavedState().finally(() => {
        restorePendingRef.current = false;
      });
    }, [gridKey, parsedStoreId, fetchAndApplySavedState]);

    // Manual "Reset to My Saved Layout" — sidebar Layout tab. Unlike the auto-restore
    // above, this is repeatable (no loadedGridKeyRef guard) since it's an explicit,
    // on-demand user action, not the one-shot on-ready restore.
    const handleManualReset = useCallback(() => {
      return fetchAndApplySavedState();
    }, [fetchAndApplySavedState]);

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

    // Root cause of "checking a column-visibility box in the sidebar immediately
    // unchecks itself" (2026-09-15, universal across every grid): this effect's
    // dependency array used the raw columnDefs/effectiveDefaultColDef REFERENCES.
    // Many caller pages rebuild their columnDefs array (and/or pass an inline
    // defaultColDef object) fresh on every render — plus DEFAULT_COL_DEF above fixes
    // only the case where a caller passes nothing at all — so this effect could refire
    // on essentially every render of POSGrid, for any reason, from any ancestor.
    // Reapplying savedColStateRef.current is normally a same-state no-op, but it made
    // this effect fire again moments after the user's own checkbox click updates the
    // live grid (before that click's own persistColumnState/savedColStateRef update had
    // fully settled through a render), visibly snapping the box back. Comparing
    // *content* instead of reference means this only actually reruns when columns are
    // structurally added/removed/reordered/re-hidden by the CALLER, which is what the
    // original 2026-08-11 fix (see project_grid_column_persistence memory) needed it for
    // — not on every incidental re-render.
    const columnDefsSignature = useMemo(() => {
      try {
        return JSON.stringify((columnDefs ?? []).map((c: any) => ({ field: c.field, colId: c.colId, hide: c.hide })));
      } catch {
        return String((columnDefs ?? []).length);
      }
    }, [columnDefs]);
    const defaultColDefSignature = useMemo(() => {
      try {
        return JSON.stringify(effectiveDefaultColDef, (_key, val) => (typeof val === "function" ? undefined : val));
      } catch {
        return "";
      }
    }, [effectiveDefaultColDef]);

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
    }, [columnDefsSignature, defaultColDefSignature]);

    // Third sidebar tab, added only when this grid persists layout (gridKey set) —
    // see GridLayoutToolPanel.tsx for why this location was chosen over a button
    // above/inside the grid. Quartz's built-in icon set has no "save" glyph, so one
    // is registered via gridOptions.icons below instead of relying on iconKey alone.
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
    // AG Grid's React wrapper diffs this prop by reference on every render, and a new
    // object reference (even if deeply identical) makes it call setGridOption('sideBar',
    // ...) internally, which reinitializes/collapses the whole side bar. An inline
    // object literal here (the original code, before this fix) meant ANY unrelated
    // re-render of this component while the panel was open would instantly close it —
    // reported 2026-09-15 as "click the side panel, it immediately closes back, can't
    // check a column checkbox or use Save Layout."
    const sideBarConfig = useMemo(() => ({
      toolPanels: sideBarToolPanels,
      defaultToolPanel: "", // optional: open with Filters
    }), [sideBarToolPanels]);

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
            icons: {
              save: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
            },
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
          sideBar={sideBarConfig}
          groupDisplayType="singleColumn"
          maxBlocksInCache={100}
          onColumnVisible={handleColumnVisible}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          {...props}
        />
      </div>
    );
  }
);

POSGrid.displayName = "POSGrid";

export default POSGrid;
