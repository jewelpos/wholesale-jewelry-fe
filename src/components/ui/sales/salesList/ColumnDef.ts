import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesInvoiceListType } from "@/types/sales";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

const dateRenderer = (params: ICellRendererParams) =>
  params.node.rowPinned === "bottom" || params.value == null
    ? ""
    : dayjs(params.value).format(TIME_FORMAT);

export const salesInvoiceColumnDefs: ColDef<SalesInvoiceListType>[] = [
  {
    headerName: "Invoice #",
    field: "invoicenumber",
    filter: "agNumberColumnFilter",
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
  { headerName: "Invoice Total",   field: "netamount",            filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  { headerName: "Amount Paid",     field: "amountreceived",       filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  { headerName: "Credit Applied",  field: "creditamountapplied",  filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  { headerName: "Balance",         field: "balancedue",           filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  { headerName: "Status",        field: "statusname",       filter: "agTextColumnFilter" },
  { headerName: "Mode",          field: "salemodename",     filter: "agTextColumnFilter",   hide: true },
  { headerName: "Items",         field: "numberofitems",    filter: "agNumberColumnFilter", hide: true },
  { headerName: "Total",         field: "totalamount",      filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Item Discount", field: "discountamount",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Order Discount", field: "orderdiscountamount", filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Subtotal",      field: "subtotal",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Tax",           field: "salestax",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Shipping",      field: "shipping",         filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Terms",         field: "termsname",        filter: "agTextColumnFilter",   hide: true },
  { headerName: "Check Received", field: "checkreceived",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell", hide: true },
  { headerName: "Warehouse",     field: "warehousename",    filter: "agTextColumnFilter",   hide: true },
  { headerName: "Modified",      field: "lastmodifieddate", filter: "agDateColumnFilter",   cellRenderer: dateRenderer, hide: true },
  {
    headerName: "Credit Fully Applied",
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
