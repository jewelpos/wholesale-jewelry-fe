import { TIME_FORMAT } from "@/lib/config/constants";
import { AccountsExpenseListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const expenseListColumnDefs: ColDef<AccountsExpenseListType>[] = [
  {
    headerName: "Amount",
    field: "expenseamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Expense detail",
    field: "expensedetail",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Description",
    field: "accountdescription",
    filter: "agTextColumnFilter",
  },
  { headerName: "Mode", field: "expensemode", filter: "agTextColumnFilter" },
  { headerName: "Notes", field: "expensenotes", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Date",
    field: "expensedate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
