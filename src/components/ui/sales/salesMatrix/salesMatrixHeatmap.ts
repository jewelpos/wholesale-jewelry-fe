import type { CSSProperties } from "react";
import { SalesMetricMode } from "@/types/accounts";

export type HeatmapField = SalesMetricMode | "amountreceived" | "balancedue";

export function getSalesCellStyle(
  value: number,
  field: HeatmapField,
  rowTotal: number
): CSSProperties {
  const base: CSSProperties = { textAlign: "right" };

  if (field === "salecount") {
    if (value === 0) return { ...base, background: "#f3f4f6", color: "#9ca3af" };
    if (value <= 5)  return { ...base, background: "#fef3c7", color: "#d97706" };
    if (value <= 20) return { ...base, background: "#dcfce7", color: "#16a34a" };
    return               { ...base, background: "#bbf7d0", color: "#15803d" };
  }

  const share = rowTotal > 0 ? value / rowTotal : 0;

  if (field === "balancedue") {
    // Inverted: high outstanding balance = warm/red (bad)
    if (value === 0)   return { ...base, background: "#f3f4f6", color: "#9ca3af" };
    if (share >= 0.4)  return { ...base, background: "#fee2e2", color: "#dc2626" };
    if (share >= 0.2)  return { ...base, background: "#fed7aa", color: "#ea580c" };
    if (share >= 0.05) return { ...base, background: "#fef3c7", color: "#d97706" };
    return                    { ...base, background: "#fafafa", color: "#64748b" };
  }

  // totalsales and amountreceived: share-based green scale
  if (value === 0)   return { ...base, background: "#f3f4f6", color: "#9ca3af" };
  if (share >= 0.4)  return { ...base, background: "#dcfce7", color: "#15803d" };
  if (share >= 0.2)  return { ...base, background: "#dbeafe", color: "#1d4ed8" };
  if (share >= 0.05) return { ...base, background: "#f0f9ff", color: "#0369a1" };
  return                    { ...base, background: "#fafafa", color: "#64748b" };
}
