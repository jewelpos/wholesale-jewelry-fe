import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerChequeListType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const onHandsColumnDefs: ColDef<CustomerChequeListType>[] = [
  {
    headerName: "Check number",
    field: "checkno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Check amount",
    field: "checkamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Posting date",
    field: "checkpostingdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Check status",
    field: "checkstatus",
    filter: "agTextColumnFilter",
  },
  { headerName: "Entry date", field: "checkentrydate", cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT), filter: "agDateColumnFilter" },
  {
    headerName: "Entered by",
    field: "enteredby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Invoice number",
    field: "chkinvoiceno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Outlet",
    field: "outletid",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last modified date",
    field: "lastmodifieddate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Last modified by",
    field: "modifiedby",
    filter: "agTextColumnFilter",
  },
];
