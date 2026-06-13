import React from "react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { ItemAgingSummary } from "@/types/product";
import dayjs from "dayjs";

const BucketBadge = (params: ICellRendererParams) => {
  const value: string = params.value ?? "";
  if (!value) return null;

  const lower = value.toLowerCase();
  let bg = "var(--status-default-bg)";
  let color = "var(--status-default-text)";

  if (lower.startsWith("0") || lower.includes("0-30")) {
    bg = "var(--status-paid-bg)";    color = "var(--status-paid-text)";
  } else if (lower.includes("31") || lower.includes("30-60") || lower.includes("31-60")) {
    bg = "var(--status-open-bg)";    color = "var(--status-open-text)";
  } else if (lower.includes("61") || lower.includes("60-90") || lower.includes("61-90")) {
    bg = "var(--status-partial-bg)"; color = "var(--status-partial-text)";
  } else if (lower.includes("91") || lower.includes("180") || lower.includes("90+") || lower.includes("180+")) {
    bg = "var(--status-void-bg)";    color = "var(--status-void-text)";
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: 600, background: bg, color, lineHeight: 1.6, whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
};

const formatDate = (params: ICellRendererParams) =>
  params.value ? dayjs(Number(params.value)).format("MM/DD/YYYY") : "";

export const productAgingColumnDefs: ColDef<ItemAgingSummary>[] = [
  { headerName: "Item ID",    field: "itemid",           filter: "agNumberColumnFilter", hide: true },
  { headerName: "Barcode ID", field: "itembarcodeid",    filter: "agNumberColumnFilter", hide: true },
  { headerName: "Item Code",  field: "itemcode",         filter: "agTextColumnFilter" },
  { headerName: "Description", field: "itemdescription", filter: "agTextColumnFilter", flex: 2 },
  { headerName: "Supplier",   field: "supplier",         filter: "agTextColumnFilter" },
  { headerName: "Qty in Hand", field: "itemquantityinhand", filter: "agNumberColumnFilter" },
  {
    headerName: "Unit Cost",
    field: "unit_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Cost",
    field: "total_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last Inbound",
    field: "last_inbound_date",
    filter: "agDateColumnFilter",
    cellRenderer: formatDate,
  },
  { headerName: "Age (Days)",  field: "age_days",          filter: "agNumberColumnFilter" },
  {
    headerName: "Inbound Bucket",
    field: "inbound_aging_bucket",
    filter: "agTextColumnFilter",
    cellRenderer: BucketBadge,
  },
  {
    headerName: "Sale Price",
    field: "sale_price",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Sale Value",
    field: "total_sale_value",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last Sale",
    field: "last_sale_date",
    filter: "agDateColumnFilter",
    cellRenderer: formatDate,
  },
  { headerName: "Last Sale (Days)", field: "last_sale_days",      filter: "agNumberColumnFilter" },
  {
    headerName: "Sales Bucket",
    field: "sales_aging_bucket",
    filter: "agTextColumnFilter",
    cellRenderer: BucketBadge,
  },
  { headerName: "Warehouse", field: "warehousename", filter: "agTextColumnFilter", hide: true },
];
