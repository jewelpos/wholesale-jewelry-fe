import { TIME_FORMAT } from "@/lib/config/constants";
import { SupplierLedgerListType } from "@/types/supplier";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const supplierLedgerColumnDefs: ColDef<SupplierLedgerListType>[] = [
    { headerName: "Ledger", field: "ledgerid" },
    { headerName: "Code", field: "ledgercode" },
    { headerName: "Description", field: "ledgerdescription" },
    {
        headerName: "Debit amount", field: "ledamountdebit",
        cellRenderer: currencyFormattedCellRenderer
    },
    { headerName: "Credit amount", field: "ledamountcredit", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Running balance", field: "running_balance", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Reference", field: "ledgerreference" },
    { headerName: "Bank", field: "ledgerbankid" },
    { headerName: "Outlet", field: "outletid" },
    { headerName: "Warehouse name", field: "warehousename" },
    {
        headerName: "Date",
        field: "ledgerdate",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];
