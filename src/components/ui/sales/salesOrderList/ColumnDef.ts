import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesOrderListType } from "@/types/sales";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const salesOrderColumnDefs: ColDef<SalesOrderListType>[] = [
  {
    headerName: "Sales order number",
    field: "salesorderno",
    filter: "agNumberColumnFilter",
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
    field: "invshippingmethod",
    filter: "agTextColumnFilter",
  },
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter" },
  { headerName: "Terms", field: "termsname", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  { headerName: "outletid", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Order date",
    field: "orderdate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Order processed date",
    field: "orderprocesseddate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
