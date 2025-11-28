import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { CategorySalesSummary } from "@/types/reports";

export const itemSoldByCategoryColumnDefs: ColDef<CategorySalesSummary>[] = [
  {
    headerName: "Category",
    field: "categoryname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Subcategory",
    field: "subcategoryname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Year",
    field: "year",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total quantity",
    field: "total_quantity",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total sales",
    field: "total_sales",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total cost",
    field: "total_cost",
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
    headerName: "Profit %",
    field: "profit_margin_percent",
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
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
    hide: true,
  },
];
