import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesOrderListType } from "@/types/sales";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer, qtyFormattedCellRenderer } from "../../products/list/columnDef";
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
  { headerName: "Items", field: "numberofitems", filter: "agTextColumnFilter", cellRenderer: qtyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  {
    headerName: "Net amount",
    field: "netamount",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Item Discount",
    field: "discountamount",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Order Discount",
    field: "orderdiscountamount",
    cellRenderer: currencyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Shipping method",
    field: "shippingname",
    filter: "agTextColumnFilter",
  },
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter" },
  { headerName: "Invoice Qty", field: "invoiceqty", filter: "agNumberColumnFilter", cellRenderer: qtyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
  { headerName: "Bord Qty", field: "bordqty", filter: "agNumberColumnFilter", cellRenderer: qtyFormattedCellRenderer, headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell" },
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
    width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 160,
    minWidth: 52,
    pinned: "right",
    suppressSizeToFit: true,
    suppressAutoSize: true,
    sortable: false,
    filter: false,
    enableRowGroup: false,
    suppressHeaderMenuButton: true,
  },
];
