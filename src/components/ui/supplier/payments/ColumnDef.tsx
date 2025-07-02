import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";
import { TIME_FORMAT } from "@/lib/config/constants";
import { SupplierPayment } from "@/types/supplier";

export const supplierPaymentColumnDefs: ColDef<SupplierPayment>[] = [
  {
    headerName: "Company",
    field: "companyname",
    filter: "agTextColumnFilter",
    cellRenderer: "agGroupCellRenderer",
  },
  {
    headerName: "Payment ID",
    field: "paymentid",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Amount",
    field: "amountpaid",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Posting Date",
    field: "postingdate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(Number(params.value)).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Reference",
    field: "reference",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Payment Mode",
    field: "paymode",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Status",
    field: "checkstatus",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Check/Card No",
    field: "checkcardno",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Description",
    field: "chk_description",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Applied By",
    field: "appliedby",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Bank",
    field: "bankname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Last Modified By",
    field: "username",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Last Modified",
    field: "lastmodifieddate",
    cellRenderer: (params: ICellRendererParams) =>
      dayjs(Number(params.value)).format(TIME_FORMAT),
    filter: "agDateColumnFilter",
  },
];
