import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { ProductListType } from "@/types/product";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import ActionCellRenderer from "./ActionRenderer";

export const currencyFormattedCellRenderer = (params: ICellRendererParams) => {
  return params.value !== null
    ? `${detectUserCurrency().format(params.value)}`
    : params.value;
};

export const productListColumnDefs: ColDef<ProductListType>[] = [
  { headerName: "Product", field: "itemcode", filter: "agTextColumnFilter" },
  {
    headerName: "Description",
    field: "itemdescription",
    maxWidth: 200,
    resizable: true,
    tooltipField: "itemdescription",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Price",
    field: "itemsellprice",
    minWidth: 100,
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Category",
    field: "categoryname",
    filter: "agTextColumnFilter",
  },
  { headerName: "Company", field: "companyname", filter: "agTextColumnFilter" },
  {
    headerName: "Quantity instock",
    field: "itemquantityinhand",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total quantity",
    field: "overall_qty",
    filter: "agNumberColumnFilter",
  },
  { headerName: "Status", field: "itemstatus", filter: "agTextColumnFilter" },
  { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Actions",
    cellRenderer: ActionCellRenderer, // use the registered component name
    maxWidth: 125,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    suppressMenu: true,
  },
];
