import { ProductSubItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const subCategoryColumnDefs: ColDef<ProductSubItemCategoryType>[] = [
  { headerName: "Sub category", field: "subcategoryname" },
  { headerName: "Description", field: "subcategorydescription" },
  { headerName: "Outlet", field: "outletid" },
  { headerName: "Warehouse name", field: "warehousename" },
];
