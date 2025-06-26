"use client";

import { ColDef } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const appliedPaymentsColumnDefs: ColDef[] = [
  {
    headerName: "Invoice Number",
    field: "invoicenumber",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Applied Amount",
    field: "appliedamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Pay Mode",
    field: "paymode",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Check/Card No",
    field: "checkcardno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Applied By",
    field: "appliedby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Status",
    field: "voided",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Description",
    field: "chk_description",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Company",
    field: "companyname",
    filter: "agTextColumnFilter",
  },
];

export default appliedPaymentsColumnDefs;
