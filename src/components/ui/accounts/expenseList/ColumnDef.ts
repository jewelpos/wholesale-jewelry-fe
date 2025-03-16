import { TIME_FORMAT } from "@/lib/config/constants";
import { AccountsExpenseListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const expenseListColumnDefs: ColDef<AccountsExpenseListType>[] = [
    { headerName: "Amount", field: "expenseamount", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Expense detail", field: "expensedetail" },
    { headerName: "Description", field: "accountdescription" },
    { headerName: "Mode", field: "expensemode" },
    { headerName: "Notes", field: "expensenotes" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
        headerName: "Date",
        field: "expensedate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];