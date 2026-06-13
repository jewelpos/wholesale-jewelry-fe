import { TIME_FORMAT } from "@/lib/config/constants";
import { SupplierListType } from "@/types/supplier";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const supplierListcolumnDefs: ColDef<SupplierListType>[] = [
  {
    headerName: "Supplier ID",
    field: "supplierid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Company Name",
    field: "companyname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Store Phone",
    field: "phone1",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "Cell Phone",
    field: "cellphone",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Contact Name",
    field: "contactname",
    filter: "agTextColumnFilter",
  },
  {
    headerName: "# Purchases",
    field: "numberofpurchase",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Purchase",
    field: "totalpurchase",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Balance Due",
    field: "balancedue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Open Credit",
    field: "opencredit",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total Sale Value",
    field: "totalsalevalue",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Last Purchase",
    field: "lastpurchasedate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(params.value).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Last Payment",
    field: "lastpaymentdate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(params.value).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
  },
  {
    headerName: "Days Since Last Purchase",
    field: "days_since_last_purchase",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Post Check Amount",
    field: "postchkamount",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Account No",
    field: "accountno",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Terms Name",
    field: "termsname",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Phone 2",
    field: "phone2",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "City",
    field: "city",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Email Address",
    field: "emailaddress",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Shipping Method",
    field: "shippimgmethod",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Discount Rate",
    field: "discountrate",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Supplier Status",
    field: "supplierstatus",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Remarks",
    field: "remarks",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Last Modified",
    field: "lastmodifieddate",
    cellRenderer: (params: ICellRendererParams) =>
      params.value ? dayjs(params.value).format(TIME_FORMAT) : "",
    filter: "agDateColumnFilter",
    hide: true,
  },
  {
    headerName: "Modified By",
    field: "modifiedby",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Warehouse Name",
    field: "warehousename",
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    headerName: "Warehouse ID",
    field: "warehouseid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
  {
    headerName: "Outlet ID",
    field: "outletid",
    filter: "agNumberColumnFilter",
    hide: true,
  },
];
