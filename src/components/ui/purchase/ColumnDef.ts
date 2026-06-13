import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../products/list/columnDef";
import { PurchaseOrder } from "@/types/purchase";
import StatusPillRenderer from "@/components/ui/grid/StatusPillRenderer";

const formatDate = (params: ICellRendererParams) => {
  if (!params.value) return "";
  const asNum = Number(params.value);
  const d = isNaN(asNum) ? dayjs(params.value) : dayjs(asNum);
  return d.isValid() ? d.format("MM/DD/YYYY") : "";
};

export const purchaseOrderColumnDefs: ColDef<PurchaseOrder>[] = [
  {
    headerName: "PO #",
    field: "ponumber",
    filter: "agNumberColumnFilter",
    width: 90,
    sort: "desc",
  },
  {
    headerName: "Supplier",
    field: "suppliername",
    filter: "agTextColumnFilter",
    flex: 2,
  },
  {
    headerName: "PO Date",
    field: "podate",
    cellRenderer: formatDate,
    filter: "agDateColumnFilter",
    width: 115,
  },
  {
    headerName: "Total",
    field: "pototal",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    width: 120,
  },
  {
    headerName: "Status",
    field: "status",
    filter: "agTextColumnFilter",
    cellRenderer: StatusPillRenderer,
    width: 130,
  },
  {
    headerName: "Warehouse",
    field: "warehouse",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Created By",
    field: "createdby",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Request Date",
    field: "porequestdate",
    cellRenderer: formatDate,
    filter: "agDateColumnFilter",
    width: 120,
    hide: true,
  },
  {
    headerName: "Terms",
    field: "terms",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Shipping Method",
    field: "shippingmethod",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "PO Mode",
    field: "pomode",
    filter: "agTextColumnFilter",
    hide: true,
  },
];
