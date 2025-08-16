import { ProductItemCategoryType } from "@/types/product";
import { ColDef } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";

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
      onEdit: (data: ProductItemCategoryType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: ProductItemCategoryType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: ProductItemCategoryType) => {
        console.log("View clicked", data);
      },
    },
  },
];
