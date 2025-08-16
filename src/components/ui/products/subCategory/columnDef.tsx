import { ProductSubItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const subCategoryColumnDefs: ColDef<ProductSubItemCategoryType>[] = [
  {
    headerName: "Sub category",
    field: "subcategoryname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Description",
    field: "subcategorydescription",
    filter: "agTextColumnFilter",
  },
  // { headerName: "Outlet", field: "outletid", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
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
      onEdit: (data: ProductSubItemCategoryType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: ProductSubItemCategoryType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: ProductSubItemCategoryType) => {
        console.log("View clicked", data);
      },
    },
  },
];
