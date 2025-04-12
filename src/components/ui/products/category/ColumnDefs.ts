import { ProductItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const categoryColumnDefs: ColDef<ProductItemCategoryType>[] = [
  { headerName: "Category", field: "categoryname" },
  { headerName: "Description", field: "categorydescription" },
  { headerName: "Code", field: "categorycode" },
  { headerName: "Outlet", field: "outletid" },
  { headerName: "Warehouse name", field: "warehousename" },
];
