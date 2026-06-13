"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
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
    cellRenderer: (params: ICellRendererParams) => {
      if (!params.value) return "";
      const asNum = Number(params.value);
      const d = isNaN(asNum) ? dayjs(params.value) : dayjs(asNum);
      return d.isValid() ? d.format("MM/DD/YYYY") : "";
    },
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
    hide: true,
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
