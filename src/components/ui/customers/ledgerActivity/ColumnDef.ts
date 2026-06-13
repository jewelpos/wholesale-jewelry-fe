import { CustomerLedgerReportType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

const OPENING_BALANCE_CODE = "__OB__";

export const ledgerActivityColumnDefs: ColDef<CustomerLedgerReportType>[] = [
  {
    headerName: "Date",
    field: "ledgerdate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format("MM/DD/YYYY") : "",
    filter: "agDateColumnFilter",
    minWidth: 120,
  },
  {
    headerName: "Activity",
    field: "ledgercode",
    cellRenderer: (params: ICellRendererParams) =>
      params.value === OPENING_BALANCE_CODE ? "" : (params.value ?? ""),
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
