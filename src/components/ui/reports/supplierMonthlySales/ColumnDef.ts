import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { SupplierSalesPurchaseSummary } from "@/types/reports";

export const supplierMonthlySalesColumnDefs: ColDef<SupplierSalesPurchaseSummary>[] = [
  {
    headerName: "Supplier",
    field: "supplier",
    filter: "agTextColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.node.rowPinned === "bottom" ? "Page Total" : params.value,
  }, // (V)
  {
    headerName: "Year",
    field: "year",
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Purchase",
    field: "total_purchase",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Sales",
    field: "total_sales",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Jan",
    field: "jan",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Feb",
    field: "feb",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Mar",
    field: "mar",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Apr",
    field: "apr",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "May",
    field: "may",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Jun",
    field: "jun",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Jul",
    field: "jul",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Aug",
    field: "aug",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Sep",
    field: "sep",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Oct",
    field: "oct",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Nov",
    field: "nov",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Dec",
    field: "dec",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
    hide: true,
  },
];

