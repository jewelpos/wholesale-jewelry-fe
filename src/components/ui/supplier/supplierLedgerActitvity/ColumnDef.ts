import { TIME_FORMAT } from "@/lib/config/constants";
import { SupplierLedgerListType } from "@/types/supplier";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const supplierLedgerColumnDefs: ColDef<SupplierLedgerListType>[] = [
  {
    headerName: "Ledger date",
    field: "ledgerdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  { headerName: "Ledger", field: "ledgerid", filter: "agTextColumnFilter" },
  { headerName: "Code", field: "ledgercode", filter: "agTextColumnFilter" },
  {
    headerName: "Description",
    field: "ledgerdescription",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Debit amount",
    field: "ledamountdebit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Credit amount",
    field: "ledamountcredit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Reference",
    field: "ledgerreference",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
];
