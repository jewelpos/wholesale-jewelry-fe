import React from "react";
import { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import StatusPillRenderer from "@/components/ui/grid/StatusPillRenderer";

const formatDate = (v: string | number | null | undefined) => {
  if (!v) return "—";
  const d = new Date(typeof v === "string" ? v : Number(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const PctRenderer = (p: ICellRendererParams) => {
  const counted = (p.data?.counteditems ?? 0) as number;
  const total = (p.data?.totalitems ?? 0) as number;
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
  const color = pct === 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#64748b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ color, fontWeight: 600 }}>{pct}%</span>
      <span style={{ color: "#94a3b8", fontSize: 11 }}>({counted}/{total})</span>
    </div>
  );
};

const CurrencyRenderer = (p: ICellRendererParams) => {
  const n = Number(p.value ?? 0);
  const color = n < 0 ? "#ef4444" : n > 0 ? "#10b981" : "#64748b";
  return (
    <span style={{ color }}>
      ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

export const physicalCountColumnDefs: ColDef[] = [
  {
    headerName: "Batch #",
    field: "batchnumber",
    filter: "agTextColumnFilter",
    width: 130,
    sort: "desc",
    pinned: "left",
  },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
    flex: 1,
    minWidth: 130,
  },
  {
    headerName: "Scope",
    field: "scope",
    filter: "agTextColumnFilter",
    width: 110,
  },
  {
    headerName: "Status",
    field: "countstatus",
    cellRenderer: StatusPillRenderer,
    filter: "agTextColumnFilter",
    width: 120,
  },
  {
    headerName: "Count Date",
    field: "countdate",
    filter: "agDateColumnFilter",
    width: 120,
    valueFormatter: (p: ValueFormatterParams) => formatDate(p.value),
  },
  {
    headerName: "Progress",
    field: "counteditems",
    width: 150,
    cellRenderer: PctRenderer,
    filter: false,
    sortable: false,
  },
  {
    headerName: "Variance $",
    field: "totalvariance",
    cellRenderer: CurrencyRenderer,
    filter: "agNumberColumnFilter",
    width: 120,
  },
  {
    headerName: "Created By",
    field: "createdby",
    filter: "agTextColumnFilter",
    width: 130,
    hide: true,
  },
  {
    headerName: "Posted Date",
    field: "posteddate",
    filter: "agDateColumnFilter",
    width: 120,
    valueFormatter: (p: ValueFormatterParams) => formatDate(p.value),
    hide: true,
  },
  {
    headerName: "Actions",
    field: "actions",
    width: 140,
    pinned: "right",
    filter: false,
    sortable: false,
    cellRenderer: "physicalCountActionsRenderer",
  },
];
