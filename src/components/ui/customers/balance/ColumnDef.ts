import { CustomerBalanceReportType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const balanceReportColumnDefs: ColDef<CustomerBalanceReportType>[] = [
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    cellRenderer: (params: ICellRendererParams<CustomerBalanceReportType>) =>
      params.data ? `${params.data.customerid} - ${params.data.companyname}` : "",
    filter: "agTextColumnFilter",
    minWidth: 220,
  },
  {
    headerName: "# Sales",
    field: "number_of_sale",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Sales",
    field: "total_sale",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Received",
    field: "amount_received",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Due",
    field: "total_due",
    sort: "desc",
    cellRenderer: currencyFormattedCellRenderer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellStyle: (params: any) =>
      params.value > 0 ? { color: "#dc3545", fontWeight: 600 } : null,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last Sale Date",
    field: "last_sale_date",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellRenderer: (params: any) => dayjs(params.value).format("MM/DD/YYYY"),
    filter: "agDateColumnFilter",
  },
];
