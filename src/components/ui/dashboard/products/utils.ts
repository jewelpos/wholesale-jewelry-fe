import { ProductListType } from "@/types/product";
import { formatCurrency as _formatCurrency } from "@/lib/utils/currencyFormat";

export const formatCurrency = (n: number) => _formatCurrency(n);

export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export const num = (v: number | null | undefined) => Number(v ?? 0);

export const daysSince = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

export const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const currentYear = new Date().getFullYear();

export const PRISM = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  orange: "#f97316",
  teal: "#14b8a6",
};

export const AGING_BUCKET_COLORS: Record<string, string> = {
  "0-30":   "#10b981",
  "31-90":  "#f59e0b",
  "91-180": "#f97316",
  "181+":   "#f43f5e",
  default:  "#94a3b8",
};

export const agingColor = (bucket: string | null | undefined) =>
  AGING_BUCKET_COLORS[bucket ?? ""] ?? AGING_BUCKET_COLORS.default;

export const marginColor = (pct: number) => {
  if (pct >= 30) return PRISM.emerald;
  if (pct >= 20) return PRISM.teal;
  if (pct >= 10) return PRISM.amber;
  if (pct >= 0)  return PRISM.orange;
  return PRISM.rose;
};

export const METAL_COLORS = [
  "#f59e0b", "#9ca3af", "#e5e7eb", "#a78bfa", "#fb923c",
  "#34d399", "#60a5fa", "#f87171", "#c084fc", "#38bdf8",
];

// ABC classification — cumulative revenue share
export type AbcClass = "A" | "B" | "C";
export type AbcProduct = ProductListType & { abcClass: AbcClass; revSharePct: number; daysOfCover: number | null };

export const classifyABC = (products: ProductListType[]): AbcProduct[] => {
  const withRevenue = products
    .filter((p) => num(p.totalsoldvalue) > 0)
    .sort((a, b) => num(b.totalsoldvalue) - num(a.totalsoldvalue));

  const totalRevenue = withRevenue.reduce((s, p) => s + num(p.totalsoldvalue), 0);
  let cumulative = 0;

  return withRevenue.map((p) => {
    cumulative += num(p.totalsoldvalue);
    const pct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 100;
    const revSharePct = totalRevenue > 0 ? (num(p.totalsoldvalue) / totalRevenue) * 100 : 0;
    const abcClass: AbcClass = pct <= 80 ? "A" : pct <= 95 ? "B" : "C";

    const dailyRate = num(p.totalsoldqty) / 365;
    const daysOfCover = dailyRate > 0 ? num(p.itemquantityinhand) / dailyRate : null;

    return { ...p, abcClass, revSharePct, daysOfCover };
  });
};

export const abcBadgeStyle = (cls: AbcClass) => {
  if (cls === "A") return { bg: "#eef2ff", color: "#6366f1", border: "#6366f1" };
  if (cls === "B") return { bg: "#fffbeb", color: "#f59e0b", border: "#f59e0b" };
  return { bg: "#f8fafc", color: "#64748b", border: "#cbd5e1" };
};

export const stdVars = (page = 1, perpage = 2000) => ({
  page,
  perpage,
  filters: [] as [],
  sortModel: [] as [],
  rowGroupCols: [] as [],
  groupKeys: [] as [],
});

export const yearFilter = (year: number) => [
  { key: "year", value: { filterType: "number", type: "equals", filter: year } },
];
