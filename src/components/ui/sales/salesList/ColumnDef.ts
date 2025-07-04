import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesInvoiceListType } from "@/types/sales";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const salesInvoiceColumnDefs: ColDef<SalesInvoiceListType>[] = [
  {
    headerName: "Invoice number",
    field: "invoicenumber",
    filter: "agNumberColumnFilter",
  },
  { headerName: "Customer", field: "customerid", filter: "agTextColumnFilter" },
  { headerName: "Company", field: "companyname", filter: "agTextColumnFilter" },
  { headerName: "Mode", field: "salemodename", filter: "agTextColumnFilter" },
  {
    headerName: "Total items",
    field: "numberofitems",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total amount",
    field: "totalamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Discount amount",
    field: "discountamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Sub total",
    field: "subtotal",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Tax",
    field: "salestax",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Shipping",
    field: "shipping",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Net amount",
    field: "netamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Received amount",
    field: "amountreceived",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due balance",
    field: "balancedue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  { headerName: "Terms", field: "termsname", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Date",
    field: "saledate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(Number(params.value)).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
