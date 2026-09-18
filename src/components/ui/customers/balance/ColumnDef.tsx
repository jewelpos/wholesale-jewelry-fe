import React from "react";
import { CustomerBalanceReportType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import dayjs from "dayjs";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const getBalanceReportColumnDefs = (
  onViewInvoices: (customerid: number, companyname: string, onhandNoOfChecks?: number, onhandTotalCheckAmount?: number) => void
): ColDef<CustomerBalanceReportType>[] => [
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    cellRenderer: (params: ICellRendererParams<CustomerBalanceReportType>) => {
      if (!params.data) return "";
      const { customerid, companyname, onhand_noofchecks, onhand_totalcheckamount } = params.data;
      return (
        <button
          type="button"
          onClick={() => onViewInvoices(Number(customerid), companyname ?? "", onhand_noofchecks, onhand_totalcheckamount)}
          title="View invoices with balance due"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "#1e40af",
            fontWeight: 600,
            textDecoration: "underline",
            textDecorationStyle: "dotted",
          }}
        >
          {customerid} - {companyname}
        </button>
      );
    },
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
    headerName: "Credit Applied",
    field: "credit_applied",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Amount Paid",
    field: "amount_received",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Balance Due",
    field: "total_due",
    cellRenderer: currencyFormattedCellRenderer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellStyle: (params: any) =>
      params.value > 0 ? { color: "#dc3545", fontWeight: 600 } : null,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "On-Hand Checks",
    field: "onhand_noofchecks",
    headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "On-Hand Check Amount",
    field: "onhand_totalcheckamount",
    cellRenderer: currencyFormattedCellRenderer,
    headerClass: "ag-right-aligned-header", cellClass: "ag-right-aligned-cell",
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
