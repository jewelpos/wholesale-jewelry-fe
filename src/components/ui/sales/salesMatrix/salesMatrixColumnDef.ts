import { ColDef, ColGroupDef } from "ag-grid-community";
import {
  SalesMatrixColumn,
  SalesMatrixOutletData,
  SalesMatrixRow,
  SalesMatrixTotals,
  SalesMetricMode,
} from "@/types/accounts";
import { getSalesCellStyle, HeatmapField } from "./salesMatrixHeatmap";

type PermanentField = "totalsales" | "amountreceived" | "balancedue";

const PERMANENT_COLUMNS: Array<{ field: PermanentField; header: string }> = [
  { field: "totalsales", header: "Sales" },
  { field: "amountreceived", header: "Payment" },
  { field: "balancedue", header: "Balance" },
];

const TOGGLE_METRICS: SalesMetricMode[] = ["salecount", "avgsale"];

const TOGGLE_HEADER: Partial<Record<SalesMetricMode, string>> = {
  salecount: "Count",
  avgsale: "Avg",
};

const fmt2 = (p: { value: number }) =>
  p.value != null ? Number(p.value).toFixed(2) : "";

function getOutletValue(
  data: SalesMatrixRow,
  outletid: number,
  field: keyof SalesMatrixOutletData
): number {
  const outlet = data?.outlets?.find((o) => o.outletid === outletid);
  if (!outlet) return 0;
  return (outlet[field] as number) ?? 0;
}

function getRowTotalByField(data: SalesMatrixRow, field: keyof SalesMatrixOutletData): number {
  return (data?.outlets ?? []).reduce((sum, o) => sum + ((o[field] as number) ?? 0), 0);
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

  const dynamic: ColGroupDef[] = columns.map((outletCol) => ({
    headerName: outletCol.outletname,
    groupId: `outlet_${outletCol.outletid}`,
    children: [
      // Always-visible: Sales, Payment, Balance
      ...PERMANENT_COLUMNS.map(({ field, header }) => ({
        headerName: header,
        colId: `outlet_${outletCol.outletid}_${field}`,
        hide: false,
        filter: "agNumberColumnFilter",
        width: 120,
        valueFormatter: fmt2,
        cellStyle: (p: any) =>
          getSalesCellStyle(
            p.value,
            field as HeatmapField,
            getRowTotalByField(p.data, field)
          ),
        valueGetter: (p: any) => getOutletValue(p.data, outletCol.outletid, field),
      } as unknown as ColDef)),
      // Toggleable: Count, Avg
      ...TOGGLE_METRICS.map((mode) => ({
        headerName: TOGGLE_HEADER[mode],
        colId: `outlet_${outletCol.outletid}_${mode}`,
        hide: mode !== initialMode,
        filter: "agNumberColumnFilter",
        width: 90,
        valueFormatter: mode !== "salecount" ? fmt2 : undefined,
        cellStyle: (p: any) =>
          getSalesCellStyle(
            p.value,
            mode as HeatmapField,
            getRowTotalByField(p.data, mode)
          ),
        valueGetter: (p: any) => getOutletValue(p.data, outletCol.outletid, mode),
      } as unknown as ColDef)),
    ],
  }));

  return [...fixed, ...dynamic];
}

// Controls only the toggleable Count/Avg columns.
// When mode = "totalsales" (default), both are hidden.
export function getSalesColumnStateForMode(
  columns: SalesMatrixColumn[],
  mode: SalesMetricMode
): { colId: string; hide: boolean }[] {
  return columns.flatMap((outlet) =>
    TOGGLE_METRICS.map((m) => ({
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
      amountreceived: t.amountreceived,
      balancedue: t.balancedue,
    })),
  };
}
