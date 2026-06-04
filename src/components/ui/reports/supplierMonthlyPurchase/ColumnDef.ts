import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { SupplierPurchaseSummary } from "@/types/reports";

export const supplierMonthlyPurchaseColumnDefs: ColDef<SupplierPurchaseSummary>[] = [
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
    headerName: "Total Purchases",
    field: "total_purchases",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Purchase Amount",
    field: "total_purchase_amount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Amount Paid",
    field: "total_amount_paid",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Balance Due",
    field: "total_balance_due",
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
