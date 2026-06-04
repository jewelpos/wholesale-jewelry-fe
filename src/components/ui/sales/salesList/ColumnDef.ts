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
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter" },
  { headerName: "Mode",      field: "salemodename",  filter: "agTextColumnFilter" },
  { headerName: "Items",     field: "numberofitems", filter: "agNumberColumnFilter" },
  { headerName: "Total",     field: "totalamount",   filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Discount",  field: "discountamount", filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Subtotal",  field: "subtotal",      filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Tax",       field: "salestax",      filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Shipping",  field: "shipping",      filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Net",       field: "netamount",     filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Received",  field: "amountreceived", filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Balance",   field: "balancedue",    filter: "agNumberColumnFilter", cellRenderer: currencyFormattedCellRenderer },
  { headerName: "Terms",     field: "termsname",     filter: "agTextColumnFilter" },
  { headerName: "Warehouse", field: "warehousename", filter: "agTextColumnFilter" },
  { headerName: "Date",      field: "saledate",      filter: "agDateColumnFilter",   cellRenderer: dateRenderer },
  { headerName: "Modified",  field: "lastmodifieddate", filter: "agDateColumnFilter", cellRenderer: dateRenderer, hide: true },
];
