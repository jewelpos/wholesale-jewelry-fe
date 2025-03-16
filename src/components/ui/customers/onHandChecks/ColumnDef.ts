import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerChequeListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const onHandsColumnDefs: ColDef<CustomerChequeListType>[] = [
    {
        headerName: "Customer",
        field: "customerid",
    },
    { headerName: "Check number", field: "checkno" },
    { headerName: "Check amount", field: "checkamount", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Status", field: "checkstatus" },
    { headerName: "Warehouse name", field: "warehousename" },
    { headerName: "Remarks", field: "chkremarks" },
    {
        headerName: "Posting date",
        field: "checkpostingdate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
    {
        headerName: "Entry date",
        field: "checkentrydate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];
