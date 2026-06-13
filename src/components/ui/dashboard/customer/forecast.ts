import DashboardCustomer from "./types";
import { num } from "./utils";

export type ChurnRisk = "low" | "medium" | "high" | "critical";
export type PaymentBehavior = "on-time" | "slow" | "chronic-late" | "unknown";

export function computeChurnScore(c: DashboardCustomer): number {
  let score = 0;
  const days = c.days_since_last_sale;
  const balance = num(c.balancedue);
  const sales = num(c.numberofsales);

  if (days === null || days === undefined) score += 25;
  else if (days > 365) score += 80;
  else if (days > 180) score += 55;
  else if (days > 90) score += 35;
  else if (days > 60) score += 20;
  else if (days > 30) score += 10;

  if (balance > 0 && (days === null || days > 90)) score += 15;
  else if (balance > 0 && days !== null && days > 60) score += 8;

  if (sales === 0) score += 10;

  return Math.min(100, score);
}

export function churnRiskLabel(score: number): ChurnRisk {
  if (score >= 76) return "critical";
  if (score >= 51) return "high";
  if (score >= 26) return "medium";
  return "low";
}

export function churnRiskColor(risk: ChurnRisk): string {
  switch (risk) {
    case "critical": return "#ef4444";
    case "high":     return "#f97316";
    case "medium":   return "#facc15";
    case "low":      return "#22c55e";
  }
}

export function churnRiskBadgeClass(risk: ChurnRisk): string {
  switch (risk) {
    case "critical": return "bg-danger-subtle text-danger";
    case "high":     return "bg-warning-subtle text-warning";
    case "medium":   return "bg-info-subtle text-info";
    case "low":      return "bg-success-subtle text-success";
  }
}

export function computeReorderDue(c: DashboardCustomer): { daysOverdue: number; avgCycleDays: number } | null {
  const sales = num(c.numberofsales);
  const days = c.days_since_last_sale;
  if (sales < 2 || days === null || !c.custregistrationdate) return null;
  const regDate = new Date(c.custregistrationdate);
  if (isNaN(regDate.getTime())) return null;
  const daysSinceReg = Math.max(1, Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgCycleDays = Math.round(daysSinceReg / sales);
  if (avgCycleDays < 7) return null;
  return { daysOverdue: Math.round(days) - avgCycleDays, avgCycleDays };
}

export function computePaymentBehavior(c: DashboardCustomer): PaymentBehavior {
  const balance = num(c.balancedue);
  const totalSale = num(c.totalsale);
  const days = c.days_since_last_sale;
  if (totalSale === 0) return "unknown";
  const balanceRatio = balance / totalSale;
  if (balanceRatio > 0.4 && days !== null && days > 90) return "chronic-late";
  if (balanceRatio > 0.15 || (balance > 0 && days !== null && days > 60)) return "slow";
  if (balance === 0 || balanceRatio < 0.05) return "on-time";
  return "slow";
}

export function paymentBehaviorLabel(b: PaymentBehavior): string {
  switch (b) {
    case "on-time":      return "On Time";
    case "slow":         return "Slow Payer";
    case "chronic-late": return "Chronic Late";
    case "unknown":      return "No History";
  }
}

export function paymentBehaviorBadgeClass(b: PaymentBehavior): string {
  switch (b) {
    case "on-time":      return "bg-success-subtle text-success";
    case "slow":         return "bg-warning-subtle text-warning";
    case "chronic-late": return "bg-danger-subtle text-danger";
    case "unknown":      return "bg-secondary-subtle text-secondary";
  }
}

export function computeAtRiskRevenue(c: DashboardCustomer): number {
  const sales = num(c.numberofsales);
  const avgOrderValue = sales > 0 ? num(c.totalsale) / sales : 0;
  const score = computeChurnScore(c);
  if (score < 51) return 0;
  return avgOrderValue * (score / 100);
}

export function computeDSO(totalAR: number, totalSales: number, periodDays = 365): number {
  if (totalSales <= 0) return 0;
  return Math.round((totalAR / totalSales) * periodDays);
}
