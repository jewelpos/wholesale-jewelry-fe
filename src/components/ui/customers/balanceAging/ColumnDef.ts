import { CustomerBalanceAgingType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceAgingColumnDefs: ColDef<CustomerBalanceAgingType>[] = [
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    cellRenderer: (params: ICellRendererParams<CustomerBalanceAgingType>) =>
      params.data ? `${params.data.customerid} - ${params.data.companyname}` : "",
    filter: "agTextColumnFilter",
    minWidth: 220,
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
