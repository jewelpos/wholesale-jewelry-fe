import { ColDef } from "ag-grid-community";
import { InventoryTransfer } from "@/types/product";

export const inventoryTransferColumnDefs: ColDef<InventoryTransfer>[] = [
  {
    headerName: "Transfer ID",
    field: "inventoryitemtransferid",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 120,
    cellRenderer: "agGroupCellRenderer",
  },
  {
    headerName: "Transfer Mode",
    field: "transfermode",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {
    headerName: "Transfer Source",
    field: "transfersource",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 150,
  },
  {
    headerName: "Destination",
    field: "destination",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 150,
  },
  {
    headerName: "Transfer Type",
    field: "transfertype",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {
    headerName: "Items Transferred",
    field: "totalitemtransfered",
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
    headerName: "Total Quantities",
    field: "totalquantities",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 140,
    type: "numericColumn",
    valueFormatter: (params) => {
      if (params.value !== null && params.value !== undefined) {
        return params.value.toLocaleString();
      }
      return "0";
    },
  },
  {
    headerName: "User Name",
    field: "username",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {headerName: "Status", field: "transferstatus", sortable: true, filter: "agTextColumnFilter", width: 130},
  {
    headerName: "Transfer Date",
    field: "transferdatetime",
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
    headerName: "Warehouse",
    field: "warehousename",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 150,
  },
  {
    headerName: "Remarks",
    field: "remarks",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 200,
    flex: 1,
  },
];
