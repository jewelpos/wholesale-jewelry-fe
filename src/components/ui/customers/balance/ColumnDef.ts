import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerBalanceReportType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceReportColumnDefs: ColDef<CustomerBalanceReportType>[] = [
    {
        headerName: "Customer",
        field: "customername",
    },
    { headerName: "Company name", field: "companyname" },
    { headerName: "Number of sale", field: "number_of_sale" },
    { headerName: "Total sale", field: "total_sale", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Received amount", field: "amount_received", cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Total due", field: "total_due", cellRenderer: currencyFormattedCellRenderer },
    {
        headerName: "Last sale date",
        field: "last_sale_date",
        cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    },
];