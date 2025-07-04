"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const appliedPaymentsColumnDefs: ColDef[] = [
  {
    headerName: "Invoice Number",
    field: "invoicenumber",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Applied Amount",
    field: "appliedamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Pay Mode",
    field: "paymode",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Status",
    field: "voided",
    filter: "agTextColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value === "Yes" ? "Voided" : "Not Voided",
    flex: 1,
  },
];

export default appliedPaymentsColumnDefs;
