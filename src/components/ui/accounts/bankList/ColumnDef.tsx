import { AccountsBankListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";

export const bankListColumnDefs: ColDef<AccountsBankListType>[] = [
  {
    headerName: "Bank name",
    field: "bankname",
    filter: "agTextColumnFilter",
  },
];
