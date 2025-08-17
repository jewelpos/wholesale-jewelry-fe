import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { ProductListType } from "@/types/product";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const currencyFormattedCellRenderer = (params: ICellRendererParams) => {
  return params.value !== null
    ? `${detectUserCurrency().format(params.value)}`
    : params.value;
};

export const productListColumnDefs: ColDef<ProductListType>[] = [
  // Visible columns
  { 
    headerName: "Item Code", 
    field: "itemcode", 
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    headerName: "Description",
    field: "itemdescription",
    maxWidth: 200,
    resizable: true,
    tooltipField: "itemdescription",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    headerName: "Barcode ID",
    field: "itembarcodeid",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    headerName: "Price",
    field: "itemsellprice",
    minWidth: 100,
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Quantity In Stock",
    field: "itemquantityinhand",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Memo Qty",
    field: "memoqty",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "SO Quantity",
    field: "soquantity",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Available Qty",
    field: "availableqty",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Total Quantity",
    field: "overall_qty",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Last Sale Date",
    field: "lastsaledate",
    filter: "agDateColumnFilter",
    hide: false,
  },
  {
    headerName: "Last Purchase Date",
    field: "lastpurchasedate",
    filter: "agDateColumnFilter",
    hide: false,
  },
  // Hidden columns
  {
    headerName: "Category",
    field: "categoryname",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Location",
    field: "itemlocation",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Subcategory",
    field: "subcategoryname",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Supplier",
    field: "companyname",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Status",
    field: "itemstatus",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Warehouse Name",
    field: "warehousename",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Warehouse ID",
    field: "itemwarehouseid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Outlet ID",
    field: "outletid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Item ID",
    field: "itemid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Image Path",
    field: "itemimagepath",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Actions",
    cellRenderer: ActionCellRenderer,
    maxWidth: 150,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      editPath: "/products/edit",
      onDelete: (data: ProductListType) => {
        console.log("Delete clicked", data);
      },
    },
  },
];
