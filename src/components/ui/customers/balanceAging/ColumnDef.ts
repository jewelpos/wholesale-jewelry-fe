import { CustomerBalanceAgingType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceAgingColumnDefs: ColDef<CustomerBalanceAgingType>[] = [
  {
    headerName: "Customer name",
    field: "customername",
    filter: "agTextColumnFilter",
  },
  { headerName: "Company name", field: "companyname" },
  {
    headerName: "Total sale",
    field: "total_sale",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Due 0 to 30",
    field: "due_0_30",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Due 31 to 60",
    field: "due_31_60",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Due 61 to 90",
    field: "due_61_90",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Due 91 to 120",
    field: "due_91_120",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Due 120 plus",
    field: "due_120_plus",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Total due",
    field: "total_due",
    cellRenderer: currencyFormattedCellRenderer,
  },
];
