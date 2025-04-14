import { AccountsBankListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const bankListColumnDefs: ColDef<AccountsBankListType>[] = [
  {
    headerName: "Bank name",
    field: "bankname",
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
      onEdit: (data: AccountsBankListType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: AccountsBankListType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: AccountsBankListType) => {
        console.log("View clicked", data);
      },
    },
  },
];
