"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";
import { ProductActivityList } from "@/types/product";

const productActivityColumnDefs: ColDef<ProductActivityList>[] = [
  {
    headerName: "Item Code",
    field: "itemcode",
    filter: "agTextColumnFilter",
    cellRenderer: "agGroupCellRenderer",
    flex: 1,
    hide: false,
  },
  {
    headerName: "Description",
    field: "itemdescription",
    filter: "agTextColumnFilter",
    flex: 1.5,
    hide: false,
  },
  {
    headerName: "Transaction Type",
    field: "transaction_type",
    filter: "agTextColumnFilter",
    flex: 1.2,
    hide: false,
  },
  {
    headerName: "Transaction Date",
    field: "transation_date",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
    flex: 1.2,
    hide: false,
  },
  {
    headerName: "Reference",
    field: "reference",
    filter: "agTextColumnFilter",
    flex: 1,
    hide: false,
  },
  {
    headerName: "Quantity",
    field: "quantity",
    filter: "agNumberColumnFilter",
    flex: 1,
    hide: false,
  },
  {
    headerName: "Salesperson",
    field: "salesperson",
    filter: "agTextColumnFilter",
    flex: 1,
    hide: false,
  },
  {
    headerName: "Warehouse",
    field: "warehouse",
    filter: "agTextColumnFilter",
    flex: 1.2,
    hide: false,
  },
  // Hidden columns
  {
    headerName: "Item ID",
    field: "itemid",
    hide: true,
  },
  {
    headerName: "Item Barcode ID",
    field: "itembarcodeid",
    hide: true,
  },
  {
    headerName: "Warehouse ID",
    field: "warehouseid",
    hide: true,
  },
  {
    headerName: "Outlet ID",
    field: "outletid",
    hide: true,
  },
];

export default productActivityColumnDefs;
