import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { ProductListType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const currencyFormattedCellRenderer = (params: any) => {
  return params.value !== null
    ? `${detectUserCurrency().format(params.value)}`
    : params.value;
};

export const productListColumnDefs: ColDef<ProductListType>[] = [
  { headerName: "Product", field: "itemcode" },
  {
    headerName: "Description",
    field: "itemdescription",
    maxWidth: 200,
    resizable: true,
    tooltipField: "itemdescription",
  },
  {
    headerName: "Price",
    field: "itemsellprice",
    minWidth: 100,
    cellRenderer: currencyFormattedCellRenderer,
  },
  { headerName: "Category", field: "categoryname" },
  { headerName: "Company", field: "companyname" },
  { headerName: "Quantity instock", field: "itemquantityinhand" },
  { headerName: "Total quantity", field: "overall_qty" },
  { headerName: "Status", field: "itemstatus" },
  { headerName: "Outlet", field: "outletid" },
  { headerName: "Warehouse name", field: "warehousename" },
];
