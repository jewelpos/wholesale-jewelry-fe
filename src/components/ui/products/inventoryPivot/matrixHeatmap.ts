import { CellStyle } from "ag-grid-community";
import { InventoryMatrixRow, MatrixMetricMode, MatrixThresholdMode } from "@/types/product";

export function getMatrixCellStyle(
  value: number,
  mode: MatrixMetricMode,
  thresholdMode: MatrixThresholdMode,
  row?: InventoryMatrixRow
): CellStyle {
  const base: CellStyle = { textAlign: "right" };

  if (value == null) return base;

  if (mode === "sold_qty") {
    if (value === 0) return { ...base, background: "#f3f4f6", color: "#9ca3af" };
    if (value < 10) return { ...base, background: "#dcfce7", color: "#16a34a" };
    return { ...base, background: "#15803d", color: "#fff" };
  }

  if (mode === "days_of_stock") {
    if (value === 0) return { ...base, background: "#fee2e2", color: "#dc2626" };
    if (value < 7) return { ...base, background: "#fef3c7", color: "#d97706" };
    if (value < 30) return { ...base, background: "#dcfce7", color: "#16a34a" };
    return { ...base, background: "#dbeafe", color: "#2563eb" };
  }

  // on hand / available — determine thresholds
  let lowThreshold = 5;
  let highThreshold = 50;

  if (thresholdMode === "reorder_point" && row) {
    if (row.reorderpoint != null) lowThreshold = row.reorderpoint;
    if (row.maxstock != null) highThreshold = row.maxstock;
  }

  if (value === 0) return { ...base, background: "#fee2e2", color: "#dc2626" };
  if (value <= lowThreshold) return { ...base, background: "#fef3c7", color: "#d97706" };
  if (value <= highThreshold) return { ...base, background: "#dcfce7", color: "#16a34a" };
  return { ...base, background: "#dbeafe", color: "#2563eb" };
}
