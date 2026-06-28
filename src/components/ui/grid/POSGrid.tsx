import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";
import { useFloatingFilter } from "./FloatingFilterContext";

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
      ...props
    },
    forwardedRef
  ) => {
    const { autoSizeStrategy } = useAutoSizeAggrid();
    const { showFilters } = useFloatingFilter();

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

    // Save column state whenever the user toggles column visibility
    const handleColumnVisible = useCallback(
      (e: any) => {
        if (!isRestoringRef.current) {
          savedColStateRef.current = e.api.getColumnState();
        }
        // Forward to any parent-supplied handler
        (props as any).onColumnVisible?.(e);
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
        api.applyColumnState({ state: saved, applyOrder: false });
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
            ...gridOptions,
          }}
          rowSelection={rowSelection}
          rowGroupPanelShow="onlyWhenGrouping"
          domLayout={domLayout}
          rowModelType="serverSide"
          pagination={true}
          onGridReady={onGridReady}
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
          {...props}
        />
      </div>
    );
  }
);

POSGrid.displayName = "POSGrid";

export default POSGrid;
