import { ColDef } from "ag-grid-community";
import { InventoryItemTransferDetail } from "@/types/product";

const inventoryTransferItemsColumnDefs: ColDef<InventoryItemTransferDetail>[] = [
  {
    headerName: "Item Code",
    field: "itemcode",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 150,
  },
  {
    headerName: "Item Description",
    field: "itemdescription",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 200,
    flex: 1,
  },
  {
    headerName: "Transfer Quantity",
    field: "transferquantity",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 150,
    type: "numericColumn",
    valueFormatter: (params) => {
      if (params.value !== null && params.value !== undefined) {
        return params.value.toLocaleString();
      }
      return "0";
    },
  },
  {
    headerName: "Transfer Date",
    field: "transferdate",
    sortable: true,
    filter: "agDateColumnFilter",
    width: 150,
    valueFormatter: (params) => {
      if (params.value) {
        return new Date(params.value).toLocaleDateString();
      }
      return "";
    },
  },
  {
    headerName: "User Name",
    field: "username",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {
    headerName: "Warehouse Name",
    field: "warehousename",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 150,
  },
  {
    headerName: "Last Modified",
    field: "lastmodifieddate",
    sortable: true,
    filter: "agDateColumnFilter",
    width: 150,
    valueFormatter: (params) => {
      if (params.value) {
        return new Date(params.value).toLocaleDateString();
      }
      return "";
    },
  },
];

export default inventoryTransferItemsColumnDefs;
