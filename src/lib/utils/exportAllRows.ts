import ExcelJS from "exceljs";
import { GridApi } from "ag-grid-community";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";

export interface ExportPageResult {
  data: Record<string, unknown>[];
  total: number;
}

export interface ExportAllRowsOptions {
  fileName?: string;
  sheetName?: string;
  perpage?: number;
  maxRows?: number;
  onProgress?: (fetched: number, total: number) => void;
}

export class ExportTooLargeError extends Error {
  constructor(total: number, maxRows: number) {
    super(`This export would include ${total.toLocaleString()} rows, which is more than the ${maxRows.toLocaleString()}-row limit. Please narrow your filters and try again.`);
    this.name = "ExportTooLargeError";
  }
}

const DEFAULT_PERPAGE = 500;
const DEFAULT_MAX_ROWS = 20000;

/**
 * Fetches every row matching the current query (via repeated calls to fetchPage,
 * reusing whatever paginated GraphQL query the grid itself already uses) and builds
 * a downloadable .xlsx client-side — instead of exporting only whatever page AG Grid's
 * server-side row model currently has loaded (see exportGridToExcel for that).
 *
 * Columns/headers/hidden-column exclusion mirror exportGridToExcel so the output looks
 * the same as today's export, just with every matching row instead of one page.
 */
export const exportAllRowsToExcel = async (
  api: GridApi | null | undefined,
  fetchPage: (page: number, perpage: number) => Promise<ExportPageResult>,
  options: ExportAllRowsOptions = {}
): Promise<void> => {
  if (!api) return;

  const {
    fileName = "export",
    sheetName = "Sheet1",
    perpage = DEFAULT_PERPAGE,
    maxRows = DEFAULT_MAX_ROWS,
    onProgress,
  } = options;

  const columns = api
    .getAllDisplayedColumns()
    ?.filter((col) => !col.getColDef().suppressHeaderMenuButton) ?? [];

  const rows: Record<string, unknown>[] = [];
  let page = 1;
  let total = 0;

  do {
    const result = await fetchPage(page, perpage);
    total = result.total;
    if (page === 1 && total > maxRows) {
      throw new ExportTooLargeError(total, maxRows);
    }
    rows.push(...result.data);
    onProgress?.(rows.length, total);
    page += 1;
  } while (rows.length < total && total > 0);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.getColDef().headerName || col.getColId(),
    key: col.getColId(),
    width: 18,
  }));

  for (const row of rows) {
    const rowValues: Record<string, unknown> = {};
    for (const col of columns) {
      const colDef = col.getColDef();
      const colId = col.getColId();
      const field = colDef.field;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fakeParams: any = { data: row, colDef, api, column: col, node: null, context: null };

      let value: unknown = field ? (row as Record<string, unknown>)[field] : undefined;
      if (typeof colDef.valueGetter === "function") {
        try {
          value = colDef.valueGetter(fakeParams);
        } catch {
          // fall back to raw field value if the getter needs grid context we don't have
        }
      }
      if (typeof colDef.valueFormatter === "function") {
        try {
          value = colDef.valueFormatter({ ...fakeParams, value });
        } catch {
          // keep unformatted value
        }
      }

      if (colDef.filter === "agDateColumnFilter" && value != null && value !== "") {
        const ts = Number(value);
        if (!isNaN(ts) && ts > 0) {
          value = dayjs(ts).format(TIME_FORMAT);
        }
      }

      rowValues[colId] = value ?? "";
    }
    worksheet.addRow(rowValues);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
