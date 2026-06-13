import { ColDef } from "ag-grid-community";
import { ItemQtySoldSummary } from "@/types/reports";

const numCol = (headerName: string, field: keyof ItemQtySoldSummary): ColDef<ItemQtySoldSummary> => ({
  headerName,
  field,
  filter: "agNumberColumnFilter",
  cellStyle: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
});

export const itemQtySoldColumnDefs: ColDef<ItemQtySoldSummary>[] = [
  { headerName: "Item Code",    field: "itemcode",        filter: "agTextColumnFilter" },
  { headerName: "Description",  field: "itemdescription", filter: "agTextColumnFilter", flex: 2 },
  { headerName: "Supplier",     field: "supplier",        filter: "agTextColumnFilter" },
  { headerName: "Category",     field: "categoryname",    filter: "agTextColumnFilter" },
  { headerName: "Year",         field: "sales_year",      filter: "agNumberColumnFilter", hide: true },
  numCol("Total Qty", "total_year_qty"),
  numCol("Jan", "jan"),
  numCol("Feb", "feb"),
  numCol("Mar", "mar"),
  numCol("Apr", "apr"),
  numCol("May", "may"),
  numCol("Jun", "jun"),
  numCol("Jul", "jul"),
  numCol("Aug", "aug"),
  numCol("Sep", "sep"),
  numCol("Oct", "oct"),
  numCol("Nov", "nov"),
  numCol("Dec", "dec"),
  { headerName: "Warehouse", field: "warehousename", filter: "agTextColumnFilter", hide: true },
  { headerName: "Warehouse ID", field: "warehouseid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Outlet ID",    field: "outletid",    filter: "agNumberColumnFilter", hide: true },
];
