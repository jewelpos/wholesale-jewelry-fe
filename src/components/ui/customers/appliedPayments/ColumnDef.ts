import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerPaymentListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const appliedPaymentsColumnDefs: ColDef<CustomerPaymentListType>[] = [
    {
        headerName: "Customer",
        field: "customerid",
    },
    { headerName: "Transaction number", field: "transactionno" },
    { headerName: "Invoice number", field: "invoiceno" },
    { headerName: "Payment mode", field: "paymode" },
    {
        headerName: "Paid amount", field: "amountpaid",
        cellRenderer: currencyFormattedCellRenderer,

    },
    { headerName: "Status", field: "paymentstatus" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
        headerName: "Payment date",
        field: "paymentdate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
    {
        headerName: "Date of entry",
        field: "dateofentry",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];