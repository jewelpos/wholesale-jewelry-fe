import { TIME_FORMAT } from "@/lib/config/constants";
import { AccountsExpenseListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import ExpenseActionRenderer from "./ExpenseActionRenderer";
import StatusPillRenderer from "../../grid/StatusPillRenderer";

export const getExpenseListColumnDefs = (
  onView: (data: AccountsExpenseListType) => void,
  onEdit: (data: AccountsExpenseListType) => void,
  onApprove: (data: AccountsExpenseListType) => void,
  onReject: (data: AccountsExpenseListType) => void,
  onPaid: (data: AccountsExpenseListType) => void
): ColDef<AccountsExpenseListType>[] => [
  {
    headerName: "Id",
    field: "expenseid",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Expense Code",
    field: "accountdescription",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Expense Detail",
    field: "expensedetail",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Amount",
    field: "expenseamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Date",
    field: "expensedate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueFormatter: (params: any) => params.value ? dayjs(params.value).format(TIME_FORMAT) : "—",
    filter: "agDateColumnFilter",
  },
  { headerName: "Paymode", field: "expensemode", filter: "agTextColumnFilter" },
  {
    headerName: "Status",
    field: "approvalstatus",
    filter: "agTextColumnFilter",
    cellRenderer: StatusPillRenderer,
  },
  {
    headerName: "Approved Date",
    field: "approveddate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueFormatter: (params: any) => params.value ? dayjs(params.value).format(TIME_FORMAT) : "—",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Approved by",
    field: "approvedby",
    filter: "agTextColumnFilter",
  },
  { headerName: "Notes", field: "expensenotes", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Actions",
    cellRenderer: ExpenseActionRenderer,
    maxWidth: 180,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      onView,
      onEdit,
      onApprove,
      onReject,
      onPaid,
    },
  },
];
