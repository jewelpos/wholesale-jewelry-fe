import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import React, { forwardRef } from "react";
import CustomLoadingOverlay from "./CustomLoadingOverlay";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import useAutoSizeAggrid from "@/hooks/useAutoSizeAggrid";

interface POSGridProps extends AgGridReactProps {
  columnDefs: any[]; // Replace `any[]` with the actual type of columnDefs if available
  gridOptions?: any; // You can type gridOptions more specifically if needed
  onGridReady: (params: any) => void; // Type this callback function as needed
}

const POSGrid = forwardRef<AgGridReact, POSGridProps>(
  ({ columnDefs, gridOptions, onGridReady }, ref) => {
    const { autoSizeStrategy } = useAutoSizeAggrid();
    return (
      <div className="ag-theme-quartz custom-theme">
        <AgGridReact
          ref={ref}
          columnDefs={columnDefs}
          defaultColDef={{
            filter: true,
            flex: 1,
            sortable: true,
          }}
          gridOptions={{
            rowHeight: 37,
            headerHeight: 50,
            suppressServerSideFullWidthLoadingRow: true,
            sideBar: true,
            ...gridOptions,
          }}
          domLayout="autoHeight"
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
                  suppressPivots: false, // show Pivot section
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
            defaultToolPanel: "filters", // optional: open with Filters
          }}
        />
      </div>
    );
  }
);

export default POSGrid;
