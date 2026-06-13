import { SupplierLedgerListType } from "@/types/supplier";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

const OB_CODE = "__OB__";

export const supplierLedgerColumnDefs: ColDef<SupplierLedgerListType>[] = [
  {
    headerName: "Date",
    field: "ledgerdate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(params.value?.toString()).format("MM/DD/YYYY") : "",
    filter: "agDateColumnFilter",
    minWidth: 120,
  },
  {
    headerName: "Activity",
    field: "ledgercode",
    cellRenderer: (params: ICellRendererParams) =>
      params.value === OB_CODE ? "" : (params.value ?? ""),
    filter: "agTextColumnFilter",
    minWidth: 120,
  },
  {
    headerName: "Description",
    field: "ledgerdescription",
    filter: "agTextColumnFilter",
    minWidth: 200,
  },
  {
    headerName: "Reference",
    field: "ledgerreference",
    filter: "agTextColumnFilter",
    minWidth: 140,
  },
  {
    headerName: "Debit",
    field: "ledamountdebit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    minWidth: 120,
  },
  {
    headerName: "Credit",
    field: "ledamountcredit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    minWidth: 120,
  },
  {
    headerName: "Running Balance",
    field: "running_balance",
    cellRenderer: currencyFormattedCellRenderer,
    cellStyle: (params) =>
      params.value < 0 ? { color: "#dc3545", fontWeight: 600 } : null,
    filter: "agNumberColumnFilter",
    minWidth: 150,
    pinned: "right",
  },
  {
    headerName: "Outlet",
    field: "warehousename",
    filter: "agTextColumnFilter",
    minWidth: 140,
  },
];
