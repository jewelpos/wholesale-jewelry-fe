import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef } from "react";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";

interface POSGridProps extends AgGridReactProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnDefs: any[]; // Replace `any[]` with the actual type of columnDefs if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gridOptions?: any; // You can type gridOptions more specifically if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onGridReady: (params: any) => void; // Type this callback function as needed
}

const POSGrid = forwardRef<AgGridReact, POSGridProps>(
  ({ columnDefs, gridOptions, onGridReady }, ref) => {
    const { autoSizeStrategy } = useAutoSizeAggrid();
    return (
      <div
        className="ag-theme-quartz custom-theme"
        style={{ height: "550px", width: "100%" }}
      >
        <AgGridReact
          ref={ref}
          columnDefs={columnDefs}
          defaultColDef={{
            filter: true,
            floatingFilter: true,
            sortable: true,
            enableRowGroup: true,
            minWidth: 200,
          }}
          gridOptions={{
            rowHeight: 42,
            headerHeight: 50,
            suppressServerSideFullWidthLoadingRow: true,
            // sideBar: true,
            ...gridOptions,
          }}
          rowGroupPanelShow="always"
          domLayout="normal"
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
        />
      </div>
    );
  }
);

POSGrid.displayName = "POSGrid";

export default POSGrid;
