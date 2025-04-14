import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerPaymentListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import ActionCellRenderer from "../../grid/ActionRenderer";

export const appliedPaymentsColumnDefs: ColDef<CustomerPaymentListType>[] = [
  {
    headerName: "Customer",
    field: "customerid",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Transaction number",
    field: "transactionno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Invoice number",
    field: "invoiceno",
    filter: "agNumberColumnFilter",
  },
  { headerName: "Payment mode", field: "paymode" },
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
    headerName: "Warehouse name",
    field: "warehousename",
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
    headerName: "Date of entry",
    field: "dateofentry",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
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
      onEdit: (data: CustomerPaymentListType) => {
        console.log("Edit clicked", data);
      },
      onDelete: (data: CustomerPaymentListType) => {
        console.log("Delete clicked", data);
      },
      onView: (data: CustomerPaymentListType) => {
        console.log("View clicked", data);
      },
    },
  },
];
