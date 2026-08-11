import React from "react";
import { CustomerBalanceAgingType } from "@/types/customer";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { currencyFormattedCellRenderer } from "../../products/list/columnDef";

export const getBalanceAgingColumnDefs = (
  onViewInvoices: (customerid: number, companyname: string) => void
): ColDef<CustomerBalanceAgingType>[] => [
  {
    headerName: "Customer",
    colId: "customerid, companyname",
    cellRenderer: (params: ICellRendererParams<CustomerBalanceAgingType>) => {
      if (!params.data) return "";
      const { customerid, companyname } = params.data;
      return (
        <button
          type="button"
          onClick={() => onViewInvoices(Number(customerid), companyname ?? "")}
          title="View invoice-level aging"
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
    headerName: "Total sale",
    field: "total_sale",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 0 to 30",
    field: "due_0_30",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 31 to 60",
    field: "due_31_60",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 61 to 90",
    field: "due_61_90",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 91 to 120",
    field: "due_91_120",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Due 120 plus",
    field: "due_120_plus",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Total due",
    field: "total_due",
    cellRenderer: currencyFormattedCellRenderer,
    filter: "agNumberColumnFilter",
  },
];
