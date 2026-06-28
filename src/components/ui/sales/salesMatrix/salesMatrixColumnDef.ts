import { ColDef, ColGroupDef } from "ag-grid-community";
import {
  SalesMatrixColumn,
  SalesMatrixRow,
  SalesMatrixTotals,
  SalesMetricMode,
} from "@/types/accounts";
import { getSalesCellStyle } from "./salesMatrixHeatmap";

const ALL_METRICS: SalesMetricMode[] = ["totalsales", "salecount", "avgsale"];

const METRIC_HEADER: Record<SalesMetricMode, string> = {
  totalsales: "Amount",
  salecount: "Count",
  avgsale: "Avg",
};

const fmt2 = (p: { value: number }) =>
  p.value != null ? Number(p.value).toFixed(2) : "";

function getOutletValue(
  data: SalesMatrixRow,
  outletid: number,
  mode: SalesMetricMode
): number {
  const outlet = data?.outlets?.find((o) => o.outletid === outletid);
  if (!outlet) return 0;
  return outlet[mode] ?? 0;
}

function getRowTotal(data: SalesMatrixRow, mode: SalesMetricMode): number {
  return (data?.outlets ?? []).reduce((sum, o) => sum + (o[mode] ?? 0), 0);
}

export function buildSalesMatrixColumns(
  columns: SalesMatrixColumn[],
  initialMode: SalesMetricMode,
  getMode: () => SalesMetricMode
): (ColDef | ColGroupDef)[] {
  const fixed: ColDef[] = [
    {
      headerName: "Period",
      field: "period_label",
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
          width: mode === "totalsales" ? 120 : 90,
          valueFormatter: mode !== "salecount" ? fmt2 : undefined,
          cellStyle: (p: any) =>
            getSalesCellStyle(
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

export function getSalesColumnStateForMode(
  columns: SalesMatrixColumn[],
  mode: SalesMetricMode
): { colId: string; hide: boolean }[] {
  return columns.flatMap((outlet) =>
    ALL_METRICS.map((m) => ({
      colId: `outlet_${outlet.outletid}_${m}`,
      hide: m !== mode,
    }))
  );
}

export function buildSalesPinnedRow(totals: SalesMatrixTotals[]): SalesMatrixRow {
  return {
    period_key: "TOTAL",
    period_label: "Grand Total",
    outlets: totals.map((t) => ({
      outletid: t.outletid,
      totalsales: t.totalsales,
      salecount: t.salecount,
      avgsale: t.avgsale,
    })),
  };
}
