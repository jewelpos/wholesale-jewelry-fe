import { GridApi, ProcessCellForExportParams } from "ag-grid-community";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";

export interface GridExportOptions {
  fileName?: string;
  sheetName?: string;
}

/**
 * Exports the current AG Grid visible rows to an Excel file.
 * - Columns marked with suppressHeaderMenuButton (e.g. Actions) are excluded.
 * - Hidden columns (hide: true) are excluded via getAllDisplayedColumns.
 * - Date columns (agDateColumnFilter) are formatted using TIME_FORMAT.
 */
export const exportGridToExcel = (
  api: GridApi | null | undefined,
  options: GridExportOptions = {}
) => {
  if (!api) return;

  const { fileName = "export", sheetName = "Sheet1" } = options;

  const columnKeys = api
    .getAllDisplayedColumns()
    ?.filter((col) => !col.getColDef().suppressHeaderMenuButton)
    .map((col) => col.getColId());

  api.exportDataAsExcel({
    fileName: fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`,
    sheetName,
    columnKeys,
    processCellCallback: (params: ProcessCellForExportParams) => {
      const filter = params.column.getColDef().filter;
      if (filter === "agDateColumnFilter" && params.value != null && params.value !== "") {
        const ts = Number(params.value);
        if (!isNaN(ts) && ts > 0) {
          return dayjs(ts).format(TIME_FORMAT);
        }
      }
      return params.value;
    },
  });
};
