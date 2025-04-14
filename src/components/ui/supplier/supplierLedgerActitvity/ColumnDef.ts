import { TIME_FORMAT } from "@/lib/config/constants";
import { SupplierLedgerListType } from "@/types/supplier";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const supplierLedgerColumnDefs: ColDef<SupplierLedgerListType>[] = [
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
    headerName: "Running balance",
    field: "running_balance",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Reference",
    field: "ledgerreference",
    filter: "agTextColumnFilter",
  },
  { headerName: "Bank", field: "ledgerbankid", filter: "agTextColumnFilter" },
  { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Date",
    field: "ledgerdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Actions",
    cellRenderer: ActionCellRenderer,
    maxWidth: 150,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      onEdit: (data: SupplierLedgerListType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: SupplierLedgerListType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: SupplierLedgerListType) => {
        console.log("View clicked", data);
      },
    },
  },
];
