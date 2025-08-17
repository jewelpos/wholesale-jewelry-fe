import { ProductItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const categoryColumnDefs: ColDef<ProductItemCategoryType>[] = [
  {
    headerName: "Category",
    field: "categoryname",
    filter: "agTextColumnFilter",
    flex: 1
  },
  {
    headerName: "Description",
    field: "categorydescription",
    filter: "agTextColumnFilter",
    flex: 1
  },
  { headerName: "Code", field: "categorycode", filter: "agTextColumnFilter", flex: 1 },
  // { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
    flex: 1
  },
];
