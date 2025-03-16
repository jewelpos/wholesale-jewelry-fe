import { TIME_FORMAT } from "@/lib/config/constants";
import { SalesInvoiceListType } from "@/types/sales";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const salesInvoiceColumnDefs: ColDef<SalesInvoiceListType>[] = [
    { headerName: "Invoice number", field: "invoicenumber" },
    { headerName: "Customer", field: "customerid" },
    { headerName: "Company", field: "companyname" },
    { headerName: "Mode", field: "salemodename" },
    { headerName: "Total items", field: "numberofitems" },
    {
        headerName: "Total amount",
        field: "totalamount",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Discount amount",
        field: "discountamount",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Sub total",
        field: "subtotal",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Tax",
        field: "salestax",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Shipping",
        field: "shipping",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Net amount",
        field: "netamount",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Received amount",
        field: "amountreceived",
        cellRenderer: currencyFormattedCellRenderer,
    },
    {
        headerName: "Due balance",
        field: "balancedue",
        cellRenderer: currencyFormattedCellRenderer,
    },
    { headerName: "Terms", field: "termsname" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
        headerName: "Date",
        field: "saledate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];
