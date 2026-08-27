// Shared quantity formatter — thousands separator, up to 3 decimals (matching
// this codebase's qty precision convention, e.g. Math.round(abs * 1000) / 1000
// for weight-based items), trimmed to whole numbers when there's no fraction.
const qtyFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

export function formatQty(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? qtyFormatter.format(n) : String(value);
}
