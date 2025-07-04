import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerPaymentListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const appliedPaymentsColumnDefs: ColDef<CustomerPaymentListType>[] = [
  {
    headerName: "Transaction number",
    field: "transactionno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Company name",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Payment date",
    field: "paymentdate",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Invoice number",
    field: "invoiceno",
    filter: "agNumberColumnFilter",
  },
  { headerName: "Payment mode", field: "paymode", filter: "agTextColumnFilter" },
  {
    headerName: "Card number",
    field: "checkcardno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Paid amount",
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
    headerName: "Applied by",
    field: "appliedby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Payment reference",
    field: "paymentreference",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Customer id",
    field: "customerid",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Date of entry",
    field: "dateofentry",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
