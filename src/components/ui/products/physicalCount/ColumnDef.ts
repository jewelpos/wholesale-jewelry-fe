import { ColDef } from "ag-grid-community";
import StatusPillRenderer from "@/components/ui/grid/StatusPillRenderer";

const formatDate = (v: string | number | null | undefined) => {
  if (!v) return "—";
  const d = new Date(typeof v === "string" ? v : Number(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const pctRenderer = (p: { data: { counteditems?: number; totalitems?: number } }) => {
  const counted = p.data?.counteditems ?? 0;
  const total = p.data?.totalitems ?? 0;
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
  const color = pct === 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#64748b";
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.gap = "4px";
  const pctSpan = document.createElement("span");
  pctSpan.style.color = color;
  pctSpan.style.fontWeight = "600";
  pctSpan.textContent = `${pct}%`;
  const cntSpan = document.createElement("span");
  cntSpan.style.color = "#94a3b8";
  cntSpan.style.fontSize = "11px";
  cntSpan.textContent = `(${counted}/${total})`;
  el.appendChild(pctSpan);
  el.appendChild(cntSpan);
  return el;
};

const currencyRenderer = (p: { value: number | null | undefined }) => {
  const n = Number(p.value ?? 0);
  const color = n < 0 ? "#ef4444" : n > 0 ? "#10b981" : "#64748b";
  const span = document.createElement("span");
  span.style.color = color;
  span.textContent = `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return span;
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
    valueFormatter: (p) => formatDate(p.value),
  },
  {
    headerName: "Progress",
    field: "counteditems",
    width: 150,
    cellRenderer: pctRenderer,
    filter: false,
    sortable: false,
  },
  {
    headerName: "Variance $",
    field: "totalvariance",
    cellRenderer: currencyRenderer,
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
    valueFormatter: (p) => formatDate(p.value),
    hide: true,
  },
  {
    headerName: "Actions",
    field: "actions",
    width: 110,
    pinned: "right",
    filter: false,
    sortable: false,
    cellRenderer: "physicalCountActionsRenderer",
  },
];
