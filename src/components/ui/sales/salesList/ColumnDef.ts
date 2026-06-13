import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesInvoiceListType } from "@/types/sales";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

const dateRenderer = (params: ICellRendererParams) =>
  params.node.rowPinned === "bottom" || params.value == null
    ? ""
    : dayjs(Number(params.value)).format(TIME_FORMAT);

export const salesInvoiceColumnDefs: ColDef<SalesInvoiceListType>[] = [
  {
    headerName: "Invoice #",
    field: "invoicenumber",
    filter: "agNumberColumnFilter",
    sort: "desc",
  },
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    filter: "agTextColumnFilter",
    valueGetter: (params) => {
      if (!params.data || params.node?.rowPinned) return "";
      return `${params.data.customerid} - ${params.data.companyname ?? ""}`;
    },
  },
  { headerName: "Date",          field: "saledate",        filter: "agDateColumnFilter",   cellRenderer: dateRenderer },
  { headerName: "Invoice Total", field: "netamount",        filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Balance",       field: "balancedue",       filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Amount Paid",   field: "amountreceived",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Status",        field: "statusname",       filter: "agTextColumnFilter" },
  { headerName: "Mode",          field: "salemodename",     filter: "agTextColumnFilter",   hide: true },
  { headerName: "Items",         field: "numberofitems",    filter: "agNumberColumnFilter", hide: true },
  { headerName: "Total",         field: "totalamount",      filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, hide: true },
  { headerName: "Discount",      field: "discountamount",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, hide: true },
  { headerName: "Subtotal",      field: "subtotal",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, hide: true },
  { headerName: "Tax",           field: "salestax",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, hide: true },
  { headerName: "Shipping",      field: "shipping",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, hide: true },
  { headerName: "Terms",         field: "termsname",        filter: "agTextColumnFilter",   hide: true },
  { headerName: "Warehouse",     field: "warehousename",    filter: "agTextColumnFilter",   hide: true },
  { headerName: "Modified",      field: "lastmodifieddate", filter: "agDateColumnFilter",   cellRenderer: dateRenderer, hide: true },
  {
    headerName: "Credit Applied",
    field: "custcrediapplied",
    filter: "agTextColumnFilter",
    hide: true,
    valueGetter: (params) => {
      if (!params.data || params.node?.rowPinned) return "";
      if (Number(params.data.salemodeid) !== 5) return "";
      return Number(params.data.custcrediapplied) === 1 ? "Yes" : "No";
    },
  },
];
