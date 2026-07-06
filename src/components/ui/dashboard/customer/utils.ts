import DashboardCustomer from "./types";
import { formatCurrency as _formatCurrency } from "@/lib/utils/currencyFormat";

export const formatCurrency = (n: number) => _formatCurrency(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

export const num = (v: number | null | undefined) => Number(v ?? 0);

export const SYSTEM_ACCOUNT_PATTERN = /^(counter\s*sale|cash\s*sale|walk[\s-]*in)/i;

export const isSystemAccount = (c: DashboardCustomer) =>
  SYSTEM_ACCOUNT_PATTERN.test(c.custcompanyname ?? "") ||
  SYSTEM_ACCOUNT_PATTERN.test(c.fullname ?? "");

export const BUCKET_COLORS = ["#22c55e", "#84cc16", "#facc15", "#f97316", "#ef4444"];
