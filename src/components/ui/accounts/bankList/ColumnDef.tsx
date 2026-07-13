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
    width: 100,
    minWidth: 100,
    pinned: "right",
    suppressAutoSize: true,
    suppressSizeToFit: true,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      onEdit: (_data: AccountsBankListType) => {},
      onDelete: (_data: AccountsBankListType) => {},
      onView: (_data: AccountsBankListType) => {},
    },
  },
];
