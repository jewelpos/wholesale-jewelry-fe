import React from "react";
import { detectUserCurrency } from "@/lib/utils/currencyFormat";
import { ProductListType } from "@/types/product";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { SetFilterValuesFuncParams } from "ag-grid-enterprise";
import ActionCellRenderer from "../../grid/ActionRenderer";
import dayjs from "dayjs";
import { TIME_FORMAT } from "@/lib/config/constants";
import ItemCodeCellRenderer from "./ItemCodeCellRenderer";
import { ApolloClient } from "@apollo/client";
import { GET_DISTINCT_PRODUCT_LIST_VALUES } from "@/lib/graphql/query/products";

export const currencyFormattedCellRenderer = (params: ICellRendererParams) => {
  if (params.value === null || params.value === undefined) return null;
  return (
    <span style={{ display: "block", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
      {detectUserCurrency().format(params.value)}
    </span>
  );
};

const dateRenderer = (params: ICellRendererParams) =>
  params.value ? dayjs(Number(params.value)).format(TIME_FORMAT) : "";

const makeSetValues = (
  outletIdRef: React.RefObject<number | undefined>,
  field: string,
  clientRef: React.RefObject<ApolloClient<any>>,
) =>
  (params: SetFilterValuesFuncParams) => {
    const outletId = outletIdRef.current ?? 0;
    const client = clientRef.current;
    if (!outletId || !client) { params.success([]); return; }
    client.query({
      query: GET_DISTINCT_PRODUCT_LIST_VALUES,
      variables: { outletid: outletId, field },
      fetchPolicy: "network-only",
    }).then(r => {
      try { params.success(r.data?.getDistinctProductListValues ?? []); } catch (_) {}
    }).catch(() => { try { params.success([]); } catch (_) {} });
  };

export function makeProductColumnDefs(
  outletIdRef: React.RefObject<number | undefined>,
  apolloClientRef: React.RefObject<ApolloClient<any>>,
): ColDef<ProductListType>[] {
  return [
    { headerName: "Item ID",            field: "itemid",             filter: "agNumberColumnFilter", hide: true, sort: "desc" },
    { headerName: "Item Code",          field: "itemcode",           filter: "agTextColumnFilter",   hide: false, cellRenderer: ItemCodeCellRenderer, width: 160, minWidth: 120 },
    { headerName: "Description",        field: "itemdescription",    filter: "agTextColumnFilter",   hide: false, resizable: true, tooltipField: "itemdescription" },
    { headerName: "Barcode ID",         field: "itembarcodeid",      filter: "agTextColumnFilter",   hide: false },
    {
      headerName: "Unit", field: "itemunit", hide: false, width: 80, maxWidth: 90,
      filter: "agSetColumnFilter",
      filterParams: { values: ["Pc", "Wt"], suppressSorting: false },
    },
    { headerName: "Sell Price",         field: "itemsellprice",      filter: "agNumberColumnFilter", hide: false, cellRenderer: currencyFormattedCellRenderer },
    {
      headerName: "Category", field: "categoryname", hide: true,
      filter: "agSetColumnFilter",
      filterParams: { values: makeSetValues(outletIdRef, "categoryname", apolloClientRef), refreshValuesOnOpen: true },
    },
    { headerName: "Location",           field: "itemlocation",       filter: "agTextColumnFilter",   hide: true },
    { headerName: "Qty In Hand",        field: "itemquantityinhand", filter: "agNumberColumnFilter", hide: false },
    { headerName: "Memo Qty",           field: "memoqty",            filter: "agNumberColumnFilter", hide: false },
    { headerName: "SO Quantity",        field: "soquantity",         filter: "agNumberColumnFilter", hide: false },
    { headerName: "Available Qty",      field: "availableqty",       filter: "agNumberColumnFilter", hide: false },
    { headerName: "Overall Qty",        field: "overall_qty",        filter: "agNumberColumnFilter", hide: false },
    {
      headerName: "Status", field: "itemstatus", hide: true,
      filter: "agSetColumnFilter",
      filterParams: { values: ["Active", "Inactive"], suppressSorting: false },
    },
    {
      headerName: "Subcategory", field: "subcategoryname", hide: true,
      filter: "agSetColumnFilter",
      filterParams: { values: makeSetValues(outletIdRef, "subcategoryname", apolloClientRef), refreshValuesOnOpen: true },
    },
    { headerName: "Company",            field: "companyname",        filter: "agTextColumnFilter",   hide: true },
    { headerName: "Created Date",       field: "createddate",        filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    { headerName: "Last Sale Date",     field: "lastsaledate",       filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    { headerName: "Last Purchase Date", field: "lastpurchasedate",   filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    { headerName: "Last Modified Date", field: "lastmodifieddate",   filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    {
      headerName: "Warehouse", field: "warehousename", hide: true,
      filter: "agSetColumnFilter",
      filterParams: { values: makeSetValues(outletIdRef, "warehousename", apolloClientRef), refreshValuesOnOpen: true },
    },
    { headerName: "Total Cost Value",   field: "totalcostvalue",     filter: "agNumberColumnFilter", hide: true, cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Total Sale Value",   field: "totalsalevalue",     filter: "agNumberColumnFilter", hide: true, cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Average Cost",       field: "itemaveragecost",    filter: "agNumberColumnFilter", hide: true, cellRenderer: currencyFormattedCellRenderer },
    { headerName: "Created By",         field: "createdby",          filter: "agTextColumnFilter",   hide: true },
    { headerName: "Modified By",        field: "modifiedby",         filter: "agTextColumnFilter",   hide: true },
    { headerName: "Adj Date",           field: "adjdate",            filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    { headerName: "Adjusted By",        field: "adjustedby",         filter: "agTextColumnFilter",   hide: true },
    { headerName: "Last Transfer Date", field: "lasttransferdate",   filter: "agDateColumnFilter",   hide: true, cellRenderer: dateRenderer },
    { headerName: "Transfer By",        field: "transferby",         filter: "agTextColumnFilter",   hide: true },
    { headerName: "Image Path",         field: "itemimagepath",      filter: "agTextColumnFilter",   hide: true },
    {
      headerName: "Actions",
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      suppressSizeToFit: false,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRendererParams: {
        editPath: "/products/edit",
        onDelete: (data: ProductListType) => {
          console.log("Delete clicked", data);
        },
      },
    },
  ];
}
