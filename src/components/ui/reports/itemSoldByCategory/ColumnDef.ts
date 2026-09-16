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
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total cost",
    field: "total_cost",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total profit",
    field: "total_profit",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Profit %",
    field: "profit_margin_percent",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Jan",
    field: "jan",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Feb",
    field: "feb",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Mar",
    field: "mar",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Apr",
    field: "apr",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "May",
    field: "may",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Jun",
    field: "jun",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Jul",
    field: "jul",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Aug",
    field: "aug",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Sep",
    field: "sep",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Oct",
    field: "oct",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Nov",
    field: "nov",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Dec",
    field: "dec",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
    hide: true,
  },
];
