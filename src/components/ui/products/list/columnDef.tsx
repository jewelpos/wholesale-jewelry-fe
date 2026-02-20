import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { ProductListType } from "@/types/product";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";

export const currencyFormattedCellRenderer = (params: ICellRendererParams) => {
  return params.value !== null
    ? `${detectUserCurrency().format(params.value)}`
    : params.value;
};

export const productListColumnDefs: ColDef<ProductListType>[] = [
  {
    headerName: "Item Code",
    field: "itemcode",
    filter: "agTextColumnFilter",
    hide: false,
  },
  {
    headerName: "Description",
    field: "itemdescription",
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
    headerName: "Sell Price",
    field: "itemsellprice",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Total Sale Value",
    field: "totalsalevalue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Total Cost Value",
    field: "totalcostvalue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Average Cost",
    field: "itemaveragecost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Quantity In Hand",
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
    headerName: "Overall Qty",
    field: "overall_qty",
    filter: "agNumberColumnFilter",
    hide: false,
  },
  {
    headerName: "Total Sold Qty",
    field: "totalsoldqty",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Last Sale Date",
    field: "lastsaledate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: false,
  },
  {
    headerName: "Last Purchase Date",
    field: "lastpurchasedate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: false,
  },
  {
    headerName: "Total Qty Purchased",
    field: "totalqtypurchased",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Calculated Avg Cost",
    field: "calculatedavgcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total Sold PCS",
    field: "totalsoldpcs",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total Sold Value",
    field: "totalsoldvalue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total Sold Cost",
    field: "totalsoldcost",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Total Sold Profit",
    field: "totalsoldprofit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
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
    field: "supplier",
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
    headerName: "Item ID",
    field: "itemid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Adjustment Date",
    field: "adjdate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: true,
  },
  {
    headerName: "Adjusted By",
    field: "adjustedby",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Last Transfer Date",
    field: "lasttransferdate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: true,
  },
  {
    headerName: "Transfer By",
    field: "transferby",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Created Date",
    field: "createddate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: true,
  },
  {
    headerName: "Created By",
    field: "createdby",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Last Modified Date",
    field: "lastmodifieddate",
    filter: "agDateColumnFilter",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "",
    hide: true,
  },
  {
    headerName: "Modified By",
    field: "modifiedby",
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
    headerName: "Image Path",
    field: "itemimagepath",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Actions",
    cellRenderer: ActionCellRenderer,
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
