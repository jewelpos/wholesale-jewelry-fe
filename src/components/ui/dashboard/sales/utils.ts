import { formatCurrency as _formatCurrency } from "@/lib/utils/currencyFormat";

export const formatCurrency = (n: number) => _formatCurrency(n);

export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export const num = (v: number | null | undefined) => Number(v ?? 0);

export const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
export type MonthKey = (typeof MONTH_KEYS)[number];

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

export const marginColor = (pct: number) => {
  if (pct >= 30) return PRISM.emerald;
  if (pct >= 20) return PRISM.teal;
  if (pct >= 10) return PRISM.amber;
  if (pct >= 0) return PRISM.orange;
  return PRISM.rose;
};

export const stdVars = (page = 1, perpage = 1000) => ({
  page,
  perpage,
  sortModel: [] as [],
  rowGroupCols: [] as [],
  groupKeys: [] as [],
});

export const yearFilter = (year: number) => [
  { key: "year", value: { filterType: "number", type: "equals", filter: year } },
];
