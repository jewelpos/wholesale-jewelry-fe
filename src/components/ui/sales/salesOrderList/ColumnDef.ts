import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesOrderListType } from "@/types/sales";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const salesOrderColumnDefs: ColDef<SalesOrderListType>[] = [
    { headerName: "Sales order number", field: "salesorderno" },
    { headerName: "Items", field: "numberofitems" },
    {
        headerName: "Net amount", field: "netamount",
        cellRenderer: currencyFormattedCellRenderer
    },
    { headerName: "Shipping method", field: "invshippingmethod" },
    { headerName: "Status", field: "statusname" },
    { headerName: "Terms", field: "termsname" },
    { headerName: "Warehouse name", field: "warehousename" },
    { headerName: "outletid", field: "outletid" },
    {
        headerName: "Order date",
        field: "orderdate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
    {
        headerName: "Order processed date",
        field: "orderprocesseddate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];