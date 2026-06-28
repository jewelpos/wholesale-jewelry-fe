import { ColDef, ColGroupDef } from "ag-grid-community";
import {
  PaymentMatrixColumn,
  PaymentMatrixRow,
  PaymentMatrixTotals,
  PaymentMetricMode,
} from "@/types/accounts";
import { getPaymentCellStyle } from "./paymentMatrixHeatmap";

const ALL_METRICS: PaymentMetricMode[] = ["totalamount", "paycount", "avgamount"];

const METRIC_HEADER: Record<PaymentMetricMode, string> = {
  totalamount: "Amount",
  paycount: "Count",
  avgamount: "Avg",
};

const fmt2 = (p: { value: number }) =>
  p.value != null ? Number(p.value).toFixed(2) : "";

function getOutletValue(
  data: PaymentMatrixRow,
  outletid: number,
  mode: PaymentMetricMode
): number {
  const outlet = data?.outlets?.find((o) => o.outletid === outletid);
  if (!outlet) return 0;
  return outlet[mode] ?? 0;
}

function getRowTotal(data: PaymentMatrixRow, mode: PaymentMetricMode): number {
  return (data?.outlets ?? []).reduce((sum, o) => sum + (o[mode] ?? 0), 0);
}

/**
 * Builds ALL 3 metric columns upfront per outlet.
 * Metric switching uses api.applyColumnState — no columnDefs rebuild.
 */
export function buildPaymentMatrixColumns(
  columns: PaymentMatrixColumn[],
  initialMode: PaymentMetricMode,
  getMode: () => PaymentMetricMode
): (ColDef | ColGroupDef)[] {
  const fixed: ColDef[] = [
    {
      headerName: "Payment Mode",
      field: "paymentmodename",
      pinned: "left" as const,
      width: 160,
      cellStyle: { fontWeight: 500 },
    },
  ];

  const dynamic: ColGroupDef[] = columns.map((outlet) => ({
    headerName: outlet.outletname,
    groupId: `outlet_${outlet.outletid}`,
    children: ALL_METRICS.map(
      (mode) =>
        ({
          headerName: METRIC_HEADER[mode],
          colId: `outlet_${outlet.outletid}_${mode}`,
          hide: mode !== initialMode,
          filter: "agNumberColumnFilter",
          width: mode === "totalamount" ? 120 : 90,
          valueFormatter: mode !== "paycount" ? fmt2 : undefined,
          cellStyle: (p: any) =>
            getPaymentCellStyle(
              p.value,
              getMode(),
              getRowTotal(p.data, getMode())
            ),
          valueGetter: (p: any) =>
            getOutletValue(p.data, outlet.outletid, mode),
        } as ColDef)
    ),
  }));

  return [...fixed, ...dynamic];
}

export function getPaymentColumnStateForMode(
  columns: PaymentMatrixColumn[],
  mode: PaymentMetricMode
): { colId: string; hide: boolean }[] {
  return columns.flatMap((outlet) =>
    ALL_METRICS.map((m) => ({
      colId: `outlet_${outlet.outletid}_${m}`,
      hide: m !== mode,
    }))
  );
}

export function buildPaymentPinnedRow(
  totals: PaymentMatrixTotals[]
): PaymentMatrixRow {
  return {
    paymentmode: "TOTAL",
    paymentmodename: "Grand Total",
    outlets: totals.map((t) => ({
      outletid: t.outletid,
      totalamount: t.totalamount,
      paycount: t.paycount,
      avgamount: t.avgamount,
    })),
  };
}
