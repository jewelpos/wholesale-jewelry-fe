import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";
import { ItemAgingSummary } from "@/types/product";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";

export const productAgingColumnDefs: ColDef<ItemAgingSummary>[] = [
  { headerName: "Item ID", field: "itemid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Barcode ID", field: "itembarcodeid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Item code", field: "itemcode", filter: "agTextColumnFilter" }, // (V)
  { headerName: "Description", field: "itemdescription", filter: "agTextColumnFilter" }, // (V)
  { headerName: "Supplier", field: "supplier", filter: "agTextColumnFilter", hide: true },
  { headerName: "Qty in hand", field: "itemquantityinhand", filter: "agNumberColumnFilter" }, // (V)
  {
    headerName: "Unit cost",
    field: "unit_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total cost",
    field: "total_cost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Last inbound date", field: "last_inbound_date", filter: "agDateColumnFilter", cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : ""
  }, // (V)
  { headerName: "Purchase age days", field: "age_days", filter: "agNumberColumnFilter" }, // (V)
  { headerName: "Inbound aging bucket", field: "inbound_aging_bucket", filter: "agTextColumnFilter" }, // (V)
  {
    headerName: "Sale price",
    field: "sale_price",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Total sale value",
    field: "total_sale_value",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  { headerName: "Last sale date", field: "last_sale_date", filter: "agDateColumnFilter" }, // (V)
  { headerName: "Last sale days", field: "last_sale_days", filter: "agNumberColumnFilter" }, // (V)
  { headerName: "Sales aging bucket", field: "sales_aging_bucket", filter: "agTextColumnFilter" }, // (V)
  { headerName: "Warehouse", field: "warehousename", filter: "agTextColumnFilter", hide: true },
];
