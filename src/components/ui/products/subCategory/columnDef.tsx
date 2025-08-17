import { ProductSubItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";

export const subCategoryColumnDefs: ColDef<ProductSubItemCategoryType>[] = [
  {
    headerName: "Sub category",
    field: "subcategoryname",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  {
    headerName: "Description",
    field: "subcategorydescription",
    filter: "agTextColumnFilter",
    flex: 1,
  },
  // { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
    flex: 1,
  },
];
