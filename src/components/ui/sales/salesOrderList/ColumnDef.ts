import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesOrderListType } from "@/types/sales";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import SalesOrderActions from "./SalesOrderActions";

export const salesOrderColumnDefs: ColDef<SalesOrderListType>[] = [
  {
    headerName: "Sales order number",
    field: "salesorderno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Customer",
    colId: "customerid, custcompanyname",
    filter: "agTextColumnFilter",
    enableRowGroup: false,
    valueGetter: (params) =>
      params.data ? `${params.data.customerid} - ${params.data.custcompanyname ?? ""}` : "",
  },
  { headerName: "Items", field: "numberofitems", filter: "agTextColumnFilter" },
  {
    headerName: "Net amount",
    field: "netamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Shipping method",
    field: "shippingname",
    filter: "agTextColumnFilter",
  },
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter" },
  { headerName: "Invoice Qty", field: "invoiceqty", filter: "agNumberColumnFilter" },
  { headerName: "Bord Qty", field: "bordqty", filter: "agNumberColumnFilter" },
  { headerName: "Terms", field: "termsname", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  { headerName: "Created By", field: "createdbyname", filter: "agTextColumnFilter" },
  { headerName: "Processed By", field: "orderprocessedbyname", filter: "agTextColumnFilter" },
  { headerName: "Outlet ID", field: "outletid", filter: "agNumberColumnFilter", hide: true },
  {
    headerName: "Order date",
    field: "orderdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Order processed date",
    field: "orderprocesseddate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Actions",
    cellRenderer: SalesOrderActions,
    maxWidth: 180,
    minWidth: 160,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    enableRowGroup: false,
    suppressHeaderMenuButton: true,
  },
];
