import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerLedgerReportType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const ledgerActivityColumnDefs: ColDef<CustomerLedgerReportType>[] = [
  {
    headerName: "Customer",
    field: "ledgercustid",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Company name",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Date",
    field: "ledgerdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(Number(params.value)).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  { headerName: "Activity", field: "ledgercode", filter: "agTextColumnFilter" },
  {
    headerName: "Description",
    field: "ledgerdescription",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Amount debited",
    field: "ledamountdebit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Amount credited",
    field: "ledamountcredit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Balance",
    field: "running_balance",
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
