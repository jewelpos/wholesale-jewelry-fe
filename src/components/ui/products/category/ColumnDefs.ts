import { ProductItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const categoryColumnDefs: ColDef<ProductItemCategoryType>[] = [
  {
    headerName: "Category",
    field: "categoryname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Description",
    field: "categorydescription",
    filter: "agTextColumnFilter",
  },
  { headerName: "Code", field: "categorycode", filter: "agTextColumnFilter" },
  { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
];
