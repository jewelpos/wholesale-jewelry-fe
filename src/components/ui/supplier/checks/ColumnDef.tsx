import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const checksListColumnDefs: ColDef[] = [
  {
    field: "supplierid",
    headerName: "Supplier ID",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    field: "companyname",
    headerName: "Company Name",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "year",
    headerName: "Year",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    field: "total_amount",
    headerName: "Total Amount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: false,
  },
  {
    field: "total_checks",
    headerName: "Total Checks",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "jan",
    headerName: "January",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "feb",
    headerName: "February",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "mar",
    headerName: "March",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "apr",
    headerName: "April",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "may",
    headerName: "May",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "jun",
    headerName: "June",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "jul",
    headerName: "July",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "aug",
    headerName: "August",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "sep",
    headerName: "September",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "oct",
    headerName: "October",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "nov",
    headerName: "November",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "dec",
    headerName: "December",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "warehousename",
    headerName: "Warehouse Name",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "warehouseid",
    headerName: "Warehouse ID",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    field: "outletid",
    headerName: "Outlet ID",
    filter: "agNumberColumnFilter",
    hide: true,
  },
];
