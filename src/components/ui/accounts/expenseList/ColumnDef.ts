import { TIME_FORMAT } from "@/lib/config/constants";
import { AccountsExpenseListType } from "@/types/accounts";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const getExpenseListColumnDefs = (
  onEdit: (data: AccountsExpenseListType) => void,
  onDelete: (data: AccountsExpenseListType) => void
): ColDef<AccountsExpenseListType>[] => [
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
  {
    headerName: "Approval Status",
    field: "approvalstatus",
    filter: "agTextColumnFilter",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => {
      const v = params.value;
      if (!v) return '<span style="color:#94a3b8;font-size:11px">—</span>';
      const color = v.toLowerCase().includes("approv") ? "#16a34a"
        : v.toLowerCase().includes("reject") || v.toLowerCase().includes("void") ? "#dc2626"
        : "#d97706";
      return `<span style="background:${color}18;color:${color};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">${v}</span>`;
    },
  },
  {
    headerName: "Approved Date",
    field: "approveddate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => params.value ? dayjs(params.value).format(TIME_FORMAT) : "—",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Actions",
    cellRenderer: ActionCellRenderer,
    maxWidth: 120,
    pinned: "right",
    suppressSizeToFit: false,
    sortable: false,
    filter: false,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      onEdit,
      onDelete,
    },
  },
];
