import { TIME_FORMAT } from "@/lib/config/constants";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const supplierInvoiceListColumnDefs: ColDef[] = [
  {
    field: "supplierinvoiceid",
    headerName: "Invoice ID",
    filter: "agNumberColumnFilter",
  },
  {
    field: "veninvoiceno",
    headerName: "Invoice Number",
    filter: "agTextColumnFilter",
  },
  {
    field: "veninvoicedate",
    headerName: "Invoice Date",
    filter: "agDateColumnFilter",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
  },
  {
    field: "veninvoicetotal",
    headerName: "Total Amount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    field: "veninvamtpaid",
    headerName: "Amount Paid",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    field: "veninvamtbalance",
    headerName: "Balance",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    field: "refponumber",
    headerName: "PO Reference",
    filter: "agNumberColumnFilter",
  },
  {
    field: "invpostingdate",
    headerName: "Posting Date",
    filter: "agDateColumnFilter",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
  },
  {
    field: "veninvremarks",
    headerName: "Remarks",
    filter: "agTextColumnFilter",
  }
];
