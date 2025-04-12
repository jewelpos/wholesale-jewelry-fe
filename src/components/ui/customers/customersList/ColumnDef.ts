import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomersListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const customersListColumnDefs: ColDef<CustomersListType>[] = [
  {
    headerName: "Name",
    field: "fullname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Company",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  },
  { headerName: "phone", field: "phone", filter: "agNumberColumnFilter" },
  {
    headerName: "Number of sales",
    field: "numberofsales",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Balance due",
    field: "balancedue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total sale",
    field: "totalsale",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },

  {
    headerName: "Open credit",
    field: "opencredit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Last sale on",
    field: "lastsaledate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Last payment on",
    field: "lastpaymentdate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
