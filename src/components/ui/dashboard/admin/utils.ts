export const num = (v: number | null | undefined) => Number(v ?? 0);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const formatNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export const formatPct = (n: number) => `${n.toFixed(1)}%`;

export const currentYear = new Date().getFullYear();

export const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] as const;
export const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const PRISM = {
  indigo: "#6366f1", violet: "#8b5cf6", emerald: "#10b981",
  amber: "#f59e0b", rose: "#f43f5e", cyan: "#06b6d4",
  orange: "#f97316", teal: "#14b8a6", slate: "#64748b",
};

export const marginColor = (pct: number) => {
  if (pct >= 35) return PRISM.emerald;
  if (pct >= 20) return PRISM.teal;
  if (pct >= 10) return PRISM.amber;
  return PRISM.rose;
};

export const pctChange = (current: number, prior: number): number | null => {
  if (prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
};

export const yearFilter = (year: number) => [
  { key: "year", value: { filterType: "number", type: "equals", filter: year } },
];

export const stdVars = (page = 1, perpage = 2000) => ({
  page, perpage, filters: [] as [], sortModel: [] as [], rowGroupCols: [] as [], groupKeys: [] as [],
});

// Aggregate monthly pivot rows → one totals object {jan…dec, total_sales, total_profit, profit_margin_percent}
export type MonthTotals = {
  total_sales: number; total_cost: number; total_profit: number; profit_margin_percent: number;
  jan: number; feb: number; mar: number; apr: number; may: number; jun: number;
  jul: number; aug: number; sep: number; oct: number; nov: number; dec: number;
};
export const sumPivotRows = (rows: Record<string, number | string>[]): MonthTotals => {
  const t: MonthTotals = { total_sales: 0, total_cost: 0, total_profit: 0, profit_margin_percent: 0, jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0 };
  for (const r of rows) {
    t.total_sales += num(r.total_sales as number);
    t.total_cost  += num(r.total_cost as number);
    t.total_profit += num(r.total_profit as number);
    for (const mk of MONTH_KEYS) t[mk] += num(r[mk] as number);
  }
  t.profit_margin_percent = t.total_sales > 0 ? (t.total_profit / t.total_sales) * 100 : 0;
  return t;
};
