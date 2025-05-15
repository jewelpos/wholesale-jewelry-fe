import { CustomerBalanceAgingType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceAgingColumnDefs: ColDef<CustomerBalanceAgingType>[] = [
  {
    headerName: "Customer ID",
    field: "customerid",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Customer name",
    field: "customername",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Company name",
    field: "companyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Total sale",
    field: "total_sale",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 0 to 30",
    field: "due_0_30",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 31 to 60",
    field: "due_31_60",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 61 to 90",
    field: "due_61_90",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 91 to 120",
    field: "due_91_120",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 120 plus",
    field: "due_120_plus",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total due",
    field: "total_due",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
];
