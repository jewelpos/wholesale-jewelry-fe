import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomerBalanceReportType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceReportColumnDefs: ColDef<CustomerBalanceReportType>[] = [
  {
    headerName: "Customer",
    field: "customername",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Company name",
    field: "companyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Number of sale",
    field: "number_of_sale",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total sale",
    field: "total_sale",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Received amount",
    field: "amount_received",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total due",
    field: "total_due",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last sale date",
    field: "last_sale_date",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
