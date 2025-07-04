import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../products/list/columnDef";
import { TIME_FORMAT } from "@/lib/config/constants";
import { PurchaseOrder } from "@/types/purchase";

export const purchaseOrderColumnDefs: ColDef<PurchaseOrder>[] = [
  {
    headerName: "PO Number",
    field: "ponumber",
    filter: "agNumberColumnFilter",
    cellRenderer: "agGroupCellRenderer",
  },
  {
    headerName: "Supplier",
    field: "suppliername",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "PO Date",
    field: "podate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Total",
    field: "pototal",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Status",
    field: "status",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Terms",
    field: "terms",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Shipping Method",
    field: "shippingmethod",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Warehouse",
    field: "warehouse",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Created By",
    field: "createdby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "PO Mode",
    field: "pomode",
    filter: "agTextColumnFilter",
  },
];
