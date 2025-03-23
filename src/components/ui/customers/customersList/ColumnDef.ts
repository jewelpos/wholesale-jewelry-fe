import { TIME_FORMAT } from "@/lib/config/constants";
import { CustomersListType } from "@/types/customer";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const customersListColumnDefs: ColDef<CustomersListType>[] = [
  {
    headerName: "Name",
    field: "fullname",
  },
  { headerName: "Company", field: "custcompanyname" },
  { headerName: "phone", field: "phone" },
  {
    headerName: "Number of sales",
    field: "numberofsales",
  },
  {
    headerName: "Balance due",
    field: "balancedue",
    cellRenderer: currencyFormattedCellRenderer,
  },
  {
    headerName: "Total sale",
    field: "totalsale",
    cellRenderer: currencyFormattedCellRenderer,
  },

  {
    headerName: "Open credit",
    field: "opencredit",
    cellRenderer: currencyFormattedCellRenderer,
  },
  { headerName: "Warehouse name", field: "warehousename" },
  {
    headerName: "Last sale on",
    field: "lastsaledate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
  },
  {
    headerName: "Last payment on",
    field: "lastpaymentdate",
    cellRenderer: (params: any) => dayjs(params.value).format(TIME_FORMAT),
  },
];
