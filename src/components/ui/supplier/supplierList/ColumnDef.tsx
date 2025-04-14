import { SupplierListType } from "@/types/supplier";
import { ColDef } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const suopplierListcolumnDefs: ColDef<SupplierListType>[] = [
  { headerName: "Company", field: "companyname", filter: "agTextColumnFilter" },
  { headerName: "Name", field: "contactname", filter: "agTextColumnFilter" },
  {
    headerName: "Account number",
    field: "accountno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Phone number",
    field: "phone",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Email ID",
    field: "emailaddress",
    filter: "agTextColumnFilter",
  },
  { headerName: "Web", field: "webaddress", filter: "agTextColumnFilter" },
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
      onEdit: (data: SupplierListType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: SupplierListType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: SupplierListType) => {
        console.log("View clicked", data);
      },
    },
  },
];
