import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerChequeListType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const onHandsColumnDefs: ColDef<CustomerChequeListType>[] = [
  {
    headerName: "Customer",
    field: "customerid",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Check number",
    field: "checkno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Check amount",
    field: "checkamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  { headerName: "Status", field: "checkstatus", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  { headerName: "Remarks", field: "chkremarks", filter: "agTextColumnFilter" },
  {
    headerName: "Posting date",
    field: "checkpostingdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Entry date",
    field: "checkentrydate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
