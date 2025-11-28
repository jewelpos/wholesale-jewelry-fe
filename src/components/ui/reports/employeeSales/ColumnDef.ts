import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { EmployeeYearlySalesSummary } from "@/types/reports";

export const employeeSalesColumnDefs: ColDef<EmployeeYearlySalesSummary>[] = [
  {
    headerName: "Employee",
    field: "employeename",
    filter: "agTextColumnFilter",
  }, // (V)
  {
    headerName: "Year",
    field: "year",
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Sales",
    field: "total_sales",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Cost",
    field: "total_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total Profit",
    field: "total_profit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Profit %",
    field: "profit_margin_percent",
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
