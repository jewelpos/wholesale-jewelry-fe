import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerLedgerReportType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const ledgerActivityColumnDefs: ColDef<CustomerLedgerReportType>[] = [
  {
    headerName: "Customer",
    field: "ledgercustid",
    filter: "agTextColumnFilter",
    filterParams: {
      filterOptions: ["contains", "notContains"],
    },
  },
  { headerName: "Code", field: "ledgercode", filter: "agTextColumnFilter" },
  { headerName: "Description", field: "ledgerdescription" },
  {
    headerName: "Amount debited",
    field: "ledamountdebit",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Amount credited",
    field: "ledamountcredit",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Balance",
    field: "running_balance",
    cellRenderer: currencyFormattedCellRenderer,
  },

  { headerName: "Reference", field: "ledgerreference" },
  { headerName: "Warehouse name", field: "warehousename" },
  {
    headerName: "Date",
    field: "ledgerdate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
  },
];
