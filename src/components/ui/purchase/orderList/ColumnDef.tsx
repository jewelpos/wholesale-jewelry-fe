"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import dayjs from "dayjs";
import { PurchaseOrderItemsListType } from "@/types/purchase";

const dateRenderer = (params: ICellRendererParams) => {
  if (!params.value) return "";
  const asNum = Number(params.value);
  const d = isNaN(asNum) ? dayjs(params.value) : dayjs(asNum);
  return d.isValid() ? d.format("MM/DD/YYYY") : "";
};

export const orderListColumnDefs: ColDef<PurchaseOrderItemsListType>[] = [
  { headerName: "PO #", field: "ponumber", filter: "agNumberColumnFilter" },
  { headerName: "Item Code", field: "itemcode", filter: "agTextColumnFilter" },
  { headerName: "Description", field: "itemdescription", filter: "agTextColumnFilter", minWidth: 180 },
  { headerName: "Supplier", field: "suppliername", filter: "agTextColumnFilter", minWidth: 160 },
  { headerName: "Status", field: "status", filter: "agTextColumnFilter" },
  { headerName: "Qty Ordered", field: "qtyordered", filter: "agNumberColumnFilter" },
  { headerName: "Qty Received", field: "itemqtyreceived", filter: "agNumberColumnFilter" },
  { headerName: "Qty Backorder", field: "itemqtybackorder", filter: "agNumberColumnFilter" },
  {
    headerName: "Unit Cost",
    field: "orderunitcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Discount %",
    field: "orddiscount",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Ext. Price",
    field: "ordextendedprice",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Add. Cost",
    field: "additionalcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Final Cost",
    field: "finalunitcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  { headerName: "Warehouse", field: "warehouse", filter: "agTextColumnFilter" },
  {
    headerName: "Backorder Adjusted",
    field: "pobackorderadjusteddate",
    cellRenderer: dateRenderer,
    filter: "agDateColumnFilter",
  },
  { headerName: "Adjusted By", field: "adjustedby", filter: "agTextColumnFilter" },
  {
    headerName: "Last Modified",
    field: "lastmodifieddate",
    cellRenderer: dateRenderer,
    filter: "agDateColumnFilter",
  },
  { headerName: "Supplier ID", field: "supplierid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Warehouse ID", field: "warehouseid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Outlet ID", field: "outletid", filter: "agNumberColumnFilter", hide: true },
];
