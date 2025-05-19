import { CustomerChequeSummaryListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const customerChequeSummaryColumnDefs: ColDef<CustomerChequeSummaryListType>[] = [
  {
    headerName: "Customer",
    field: "customerid",
    filter: "agTextColumnFilter",
    cellRenderer: "agGroupCellRenderer"
  },
  {
    headerName: "Company name",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Year",
    field: "year",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Total",
    field: "yearly_total",
    filter: "agTextColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  },
  { headerName: "January", field: "Jan", filter: "agTextColumnFilter" },
  { headerName: "February", field: "Feb", filter: "agTextColumnFilter" },
  {
    headerName: "March",
    field: "Mar",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "April",
    field: "Apr",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "May",
    field: "May",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "June",
    field: "Jun",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "July",
    field: "Jul",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "August",
    field: "Aug",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "September",
    field: "Sep",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "October",
    field: "Oct",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "November",
    field: "Nov",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "December",
    field: "Dec",
    filter: "agTextColumnFilter",
  }, 
];
