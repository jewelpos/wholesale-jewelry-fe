import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { CustomerSalesSummary } from "@/types/customer";

export const customerMonthlySalesColumnDefs: ColDef<CustomerSalesSummary>[] = [
  {
    headerName: "Customer ID",
    field: "customerid",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Company Name",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Year",
    field: "year",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Invoice count",
    field: "invoice_count",
    filter: "agNumberColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.node.rowPinned === "bottom"
        ? "Page Total"
        : params.value,
  },
  {
    headerName: "Total sales",
    field: "total_sales",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total balance due",
    field: "total_balance_due",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total profit",
    field: "total_profit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Jan",
    field: "jan",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Feb",
    field: "feb",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Mar",
    field: "mar",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Apr",
    field: "apr",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "May",
    field: "may",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Jun",
    field: "jun",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Jul",
    field: "jul",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Aug",
    field: "aug",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Sep",
    field: "sep",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Oct",
    field: "oct",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Nov",
    field: "nov",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Dec",
    field: "dec",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
];
