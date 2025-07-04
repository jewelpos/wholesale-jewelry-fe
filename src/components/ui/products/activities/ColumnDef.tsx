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
  },
  {
    headerName: "Transaction Type",
    field: "transaction_type",
    filter: "agTextColumnFilter",
    flex: 1.2,
  },
  {
    headerName: "Transaction Date",
    field: "transation_date",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
    flex: 1.2,
  },
  {
    headerName: "Reference",
    field: "reference",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Quantity",
    field: "quantity",
    filter: "agNumberColumnFilter",
    flex: 1,
  },
  {
    headerName: "Warehouse",
    field: "warehouse",
    filter: "agTextColumnFilter",
    flex: 1.2,
  },
];

export default productActivityColumnDefs;
