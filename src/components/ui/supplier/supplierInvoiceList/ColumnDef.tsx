import { TIME_FORMAT } from "@/lib/config/constants";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const supplierInvoiceListColumnDefs: ColDef[] = [
  {
    field: "supplierinvoiceid",
    headerName: "Invoice ID",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    field: "companyname",
    headerName: "Company Name",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "veninvoiceno",
    headerName: "Invoice Number",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "veninvoicedate",
    headerName: "Invoice Date",
    filter: "agDateColumnFilter",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    hide: false,
  },
  {
    field: "veninvoicetotal",
    headerName: "Total Amount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: false,
  },
  {
    field: "veninvamtpaid",
    headerName: "Amount Paid",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: false,
  },
  {
    field: "veninvamtbalance",
    headerName: "Balance",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: false,
  },
  {
    field: "terms",
    headerName: "Terms",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "refponumber",
    headerName: "PO Reference",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "enteredby",
    headerName: "Entered By",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    field: "invpostingdate",
    headerName: "Posting Date",
    filter: "agDateColumnFilter",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    hide: true,
  },
  {
    field: "veninvremarks",
    headerName: "Remarks",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    field: "warehousename",
    headerName: "Warehouse Name",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    field: "modifiedby",
    headerName: "Modified By",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    field: "lastmodifieddate",
    headerName: "Last Modified Date",
    filter: "agDateColumnFilter",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    hide: true,
  },
  {
    field: "warehouseid",
    headerName: "Warehouse ID",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    field: "outletid",
    headerName: "Outlet ID",
    filter: "agNumberColumnFilter",
    hide: true,
  },
];
