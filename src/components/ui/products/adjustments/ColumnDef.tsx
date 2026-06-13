import { ColDef, ICellRendererParams } from "ag-grid-community";
import { InventoryAdjustment } from "@/types/product";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../list/columnDef";

export const inventoryAdjustmentColumnDefs: ColDef<InventoryAdjustment>[] = [
  { headerName: "Item Code", field: "itemcode", filter: "agTextColumnFilter" },
  {
    headerName: "Description",
    field: "description",
    filter: "agTextColumnFilter",
    tooltipField: "description",
  },
  {
    headerName: "Adjusted Date",
    field: "adjusted_date",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format("MM/DD/YYYY") : "",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Qty Adjusted",
    field: "qty_adjusted",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Cost Adjusted",
    field: "cost_adjusted",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  { headerName: "New Qty", field: "new_qty", filter: "agNumberColumnFilter" },
  {
    headerName: "New Cost",
    field: "new_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Updated By",
    field: "updated_by",
    filter: "agTextColumnFilter",
  },
  { headerName: "Warehouse", field: "warehouse", filter: "agTextColumnFilter" },
];
