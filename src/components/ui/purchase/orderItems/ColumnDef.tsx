"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";
import { PurchaseOrderItem } from "@/types/purchase";

const purchaseOrderItemsColumnDefs: ColDef<PurchaseOrderItem>[] = [
  {
    headerName: "Item Code",
    field: "itemcode",
    filter: "agTextColumnFilter",
    cellRenderer: "agGroupCellRenderer",
    flex: 1,
  },
  {
    headerName: "Description",
    field: "itemdescription",
    filter: "agTextColumnFilter",
    flex: 2,
  },
  {
    headerName: "Qty Ordered",
    field: "qtyordered",
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Qty Received",
    field: "itemqtyreceived",
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Qty Backorder",
    field: "itemqtybackorder",
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Unit Cost",
    field: "orderunitcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Ext. Price",
    field: "ordextendedprice",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Status",
    field: "status",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Warehouse",
    field: "warehouse",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Last Modified",
    field: "lastmodifieddate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
    flex: 1,
  },
];

export default purchaseOrderItemsColumnDefs;
