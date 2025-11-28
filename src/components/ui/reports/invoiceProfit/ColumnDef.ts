import { ColDef } from "ag-grid-community";
import { InvoiceItem, InvoiceSummary } from "@/types/reports";
import { currencyFormattedCellRenderer } from "@/components/ui/products/list/columnDef";

export const invoiceProfitColumnDefs: ColDef<InvoiceSummary>[] = [
  { headerName: "Invoice #", field: "invoicenumber", filter: "agTextColumnFilter", cellRenderer: "agGroupCellRenderer", }, // (V)
  { headerName: "Customer ID", field: "customerid", filter: "agTextColumnFilter" }, // (V)
  {
    headerName: "Customer Name",
    field: "custcompanyname",
    filter: "agTextColumnFilter",
  }, // (V)
  { headerName: "Sale Date", field: "saledate", filter: "agDateColumnFilter" }, // (V)
  {
    headerName: "Sale Mode",
    field: "salemodename",
    filter: "agTextColumnFilter",
  }, // (V)
  {
    headerName: "Subtotal",
    field: "subtotal",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Total Cost",
    field: "totalcost",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Profit",
    field: "profit",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Profit %",
    field: "profit_margin_percent",
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Warehouse",
    field: "warehousename",
    filter: "agTextColumnFilter",
  }, // (V)
  {
    headerName: "Total Amount",
    field: "totalamount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Discount Amount",
    field: "discountamount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Sales Tax",
    field: "salestax",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Shipping",
    field: "shipping",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Net Amount",
    field: "netamount",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Amount Received",
    field: "amountreceived",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Balance Due",
    field: "balancedue",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Taxable Sale",
    field: "taxablesale",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  {
    headerName: "Non-taxable Sale",
    field: "nontaxablesale",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
    hide: true,
  },
  { headerName: "Status", field: "statusname", filter: "agTextColumnFilter", hide: true },
  { headerName: "Terms", field: "termsname", filter: "agTextColumnFilter", hide: true },
  { headerName: "Warehouse ID", field: "warehouseid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Outlet ID", field: "outletid", filter: "agNumberColumnFilter", hide: true },
];

export const invoiceProfitItemsColumnDefs: ColDef<InvoiceItem>[] = [
  { headerName: "Invoice Item ID", field: "invoiceitemid", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Invoice #", field: "invoicenumber", filter: "agNumberColumnFilter", hide: true },
  { headerName: "Item Code", field: "itemcode", filter: "agTextColumnFilter" }, // (V)
  {
    headerName: "Description",
    field: "itemdescription",
    filter: "agTextColumnFilter",
  }, // (V)
  {
    headerName: "Quantity",
    field: "itemquantity",
    filter: "agNumberColumnFilter",
  }, // (V)
  {
    headerName: "Unit Price",
    field: "unitprice",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Extended Price",
    field: "extendedprice",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Item Cost",
    field: "itemcost",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Total Cost",
    field: "totalcost",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Profit",
    field: "profit",
    filter: "agNumberColumnFilter",
    cellRenderer: currencyFormattedCellRenderer,
  }, // (V)
  {
    headerName: "Profit %",
    field: "profit_percent",
    filter: "agNumberColumnFilter",
  }, // (V)
  { headerName: "Item ID", field: "itemid", filter: "agTextColumnFilter", hide: true },
  { headerName: "Warehouse ID", field: "warehouseid", filter: "agNumberColumnFilter", hide: true },
];

