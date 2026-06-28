import { ColDef, ColGroupDef } from "ag-grid-community";
import {
  InventoryMatrixRow,
  InventoryMatrixUnitTotals,
  MatrixMetricMode,
  MatrixThresholdMode,
  OutletMatrixColumn,
  OutletMatrixQty,
  WarehouseMatrixQty,
} from "@/types/product";
import { getMatrixCellStyle } from "./matrixHeatmap";

const ALL_MODES: MatrixMetricMode[] = ["onhand", "available", "days_of_stock", "sold_qty"];

const TOTAL_HEADER: Record<MatrixMetricMode, string> = {
  onhand: "On Hand",
  available: "Available",
  days_of_stock: "Days",
  sold_qty: "Sold",
};

function getOutletValue(
  data: InventoryMatrixRow,
  outletid: number,
  mode: MatrixMetricMode
): number {
  const outlet: OutletMatrixQty | undefined = data?.outlets?.find(
    (o) => o.outletid === outletid
  );
  if (!outlet) return 0;
  if (mode === "days_of_stock")
    return data.avg_daily_sales > 0
      ? +((outlet.onhandqty / data.avg_daily_sales).toFixed(1))
      : 0;
  if (mode === "sold_qty") return outlet.soldqty ?? 0;
  if (mode === "available") return outlet.availableqty;
  return outlet.onhandqty;
}

function getWarehouseValue(
  data: InventoryMatrixRow,
  outletid: number,
  warehouseid: number,
  mode: MatrixMetricMode
): number {
  const wh: WarehouseMatrixQty | undefined = data?.outlets
    ?.find((o) => o.outletid === outletid)
    ?.warehouses?.find((w) => w.warehouseid === warehouseid);
  if (!wh) return 0;
  if (mode === "days_of_stock")
    return data.avg_daily_sales > 0
      ? +((wh.onhandqty / data.avg_daily_sales).toFixed(1))
      : 0;
  if (mode === "sold_qty") return wh.soldqty ?? 0;
  if (mode === "available") return wh.availableqty;
  return wh.onhandqty;
}

/**
 * Builds the full column definition for the matrix grid.
 *
 * ALL four metric columns (onhand / available / days_of_stock / sold_qty) are created
 * upfront for every outlet total and every warehouse. Only one set is visible at a time,
 * controlled by getColumnStateForMode + api.applyColumnState.
 *
 * This means columnDefs NEVER changes after the initial outlet load — we just show/hide
 * columns. Avoids the AG Grid 32 bug where ColGroupDef reconciliation nulls
 * ColumnGroup.providedColumnGroup mid-cycle and throws in getDisplayNameForColumnGroup.
 *
 * getThresholdMode is a ref-backed closure so cellStyle always reads the current
 * threshold without needing to rebuild column defs.
 */
export function buildMatrixColumns(
  columns: OutletMatrixColumn[],
  initialMode: MatrixMetricMode,
  getThresholdMode: () => MatrixThresholdMode
): (ColDef | ColGroupDef)[] {
  const fmt2 = (p: { value: number }) =>
    p.value != null ? Number(p.value).toFixed(2) : "";

  const fixed: ColDef[] = [
    {
      headerName: "Item Code",
      field: "itemcode",
      pinned: "left" as const,
      filter: "agTextColumnFilter",
      width: 130,
      cellStyle: { fontWeight: 500 },
    },
    {
      headerName: "Description",
      field: "itemdescription",
      flex: 2,
      filter: "agTextColumnFilter",
      minWidth: 180,
    },
    {
      headerName: "Unit",
      field: "itemunit",
      filter: "agTextColumnFilter",
      width: 80,
    },
    {
      headerName: "Category",
      field: "categoryname",
      filter: "agTextColumnFilter",
      width: 130,
    },
    {
      headerName: "Subcategory",
      field: "subcategoryname",
      filter: "agTextColumnFilter",
      width: 140,
    },
    {
      headerName: "Overall Qty",
      field: "overall_qty",
      filter: "agNumberColumnFilter",
      width: 110,
      valueFormatter: fmt2,
      cellStyle: { textAlign: "right", fontWeight: 600 },
    },
  ];

  const dynamic: ColGroupDef[] = columns.map((outlet) => ({
    headerName: outlet.outletname,
    groupId: `outlet_${outlet.outletid}`,
    children: [
      // Outlet total — one column per metric, only initialMode visible
      ...ALL_MODES.map(
        (mode) =>
          ({
            headerName: TOTAL_HEADER[mode],
            colId: `outlet_${outlet.outletid}_${mode}`,
            hide: mode !== initialMode,
            filter: "agNumberColumnFilter",
            width: 100,
            cellClass: "fw-semibold",
            valueFormatter: fmt2,
            cellStyle: (p: { value: number; data: InventoryMatrixRow }) =>
              getMatrixCellStyle(p.value, mode, getThresholdMode(), p.data),
            valueGetter: (p: { data: InventoryMatrixRow }) =>
              getOutletValue(p.data, outlet.outletid, mode),
          } as ColDef)
      ),
      // Per warehouse — one column per metric per warehouse
      ...outlet.warehouses.flatMap((wh) =>
        ALL_MODES.map(
          (mode) =>
            ({
              headerName: wh.warehousename,
              colId: `wh_${wh.warehouseid}_${mode}`,
              hide: mode !== initialMode,
              filter: "agNumberColumnFilter",
              width: 120,
              valueFormatter: fmt2,
              cellStyle: (p: { value: number; data: InventoryMatrixRow }) =>
                getMatrixCellStyle(p.value, mode, getThresholdMode(), p.data),
              valueGetter: (p: { data: InventoryMatrixRow }) =>
                getWarehouseValue(p.data, outlet.outletid, wh.warehouseid, mode),
            } as ColDef)
        )
      ),
    ],
  }));

  return [...fixed, ...dynamic];
}

/**
 * Column visibility state to apply when the user switches metric mode.
 * Pass the result to api.applyColumnState({ state, applyOrder: false }).
 */
export function getColumnStateForMode(
  columns: OutletMatrixColumn[],
  mode: MatrixMetricMode
): { colId: string; hide: boolean }[] {
  return columns.flatMap((outlet) => [
    ...ALL_MODES.map((m) => ({
      colId: `outlet_${outlet.outletid}_${m}`,
      hide: m !== mode,
    })),
    ...outlet.warehouses.flatMap((wh) =>
      ALL_MODES.map((m) => ({
        colId: `wh_${wh.warehouseid}_${m}`,
        hide: m !== mode,
      }))
    ),
  ]);
}

export function buildPinnedRows(
  totalsRows: InventoryMatrixUnitTotals[]
): InventoryMatrixRow[] {
  return totalsRows.map((row) => ({
    itemcode: "TOTAL",
    itemdescription: `${row.itemcount ?? 0} item${row.itemcount !== 1 ? "s" : ""}`,
    categoryname: "",
    subcategoryname: row.itemunit || "",
    itemunit: row.itemunit || "",
    overall_qty: row.overall_qty,
    avg_daily_sales: 0,
    reorderpoint: null,
    maxstock: null,
    outlets: row.outlets,
  }));
}
