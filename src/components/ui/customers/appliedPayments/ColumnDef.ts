import { CustomerPaymentListType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const appliedPaymentsColumnDefs: ColDef<CustomerPaymentListType>[] = [
  {
    headerName: "Transaction #",
    field: "transactionno",
    filter: "agNumberColumnFilter",
    cellRenderer: "agGroupCellRenderer",
  },
  {
    headerName: "Customer",
    colId: "customerid, custcompanyname",
    cellRenderer: (params: ICellRendererParams<CustomerPaymentListType>) =>
      params.data ? `${params.data.customerid} - ${params.data.custcompanyname}` : "",
    filter: "agTextColumnFilter",
    minWidth: 220,
  },
  {
    headerName: "Payment Date",
    field: "paymentdate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format("MM/DD/YYYY"),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Mode",
    field: "paymode",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Paid Amount",
    field: "amountpaid",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Status",
    field: "paymentstatus",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Check / Card #",
    field: "checkcardno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Applied By",
    field: "appliedby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Invoice #",
    field: "invoiceno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Payment Reference",
    field: "paymentreference",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Entry Date",
    field: "dateofentry",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format("MM/DD/YYYY"),
    filter: "agDateColumnFilter",
  },
];
