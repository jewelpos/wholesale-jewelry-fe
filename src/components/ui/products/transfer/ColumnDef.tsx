import React from "react";
import { ColDef } from "ag-grid-community";
import { InventoryTransfer } from "@/types/product";

export const STATUS_LABEL: Record<number, string> = {
  1: "Pending",
  2: "Approved",
  3: "Ready to Receive",
  5: "Cancelled",
};

export const statusBadgeStyle = (statusId: number): React.CSSProperties => {
  switch (statusId) {
    case 1:
      return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    case 2:
      return { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
    case 3:
      return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" };
    case 5:
      return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
    default:
      return { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
  }
};

const isNewTransfer = (transferdatetime?: string): boolean => {
  if (!transferdatetime) return false;
  return Date.now() - new Date(transferdatetime).getTime() < 24 * 60 * 60 * 1000;
};

export const inventoryTransferColumnDefs: ColDef<InventoryTransfer>[] = [
  {
    headerName: "Transfer ID",
    field: "inventoryitemtransferid",
    sortable: true,
    sort: "desc",
    filter: "agNumberColumnFilter",
    width: 150,
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      innerRenderer: (params: { data?: InventoryTransfer; value?: number }) => {
        const id = params.value ?? params.data?.inventoryitemtransferid;
        const showNew = isNewTransfer(params.data?.transferdatetime);
        return (
          <span className="d-flex align-items-center gap-2">
            <span>{id}</span>
            {showNew && (
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  lineHeight: "16px",
                  letterSpacing: "0.03em",
                }}
              >
                NEW
              </span>
            )}
          </span>
        );
      },
    },
  },
  {
    headerName: "Transfer Mode",
    field: "transfermode",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {
    headerName: "Source",
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
    headerName: "Items",
    field: "totalitemtransfered",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 90,
    type: "numericColumn",
    valueFormatter: (params) =>
      params.value != null ? params.value.toLocaleString() : "0",
  },
  {
    headerName: "Total Qty",
    field: "totalquantities",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 110,
    type: "numericColumn",
    valueFormatter: (params) =>
      params.value != null ? params.value.toLocaleString() : "0",
  },
  {
    headerName: "Created By",
    field: "username",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 130,
  },
  {
    headerName: "Status",
    field: "transferstatus",
    sortable: true,
    filter: "agTextColumnFilter",
    width: 145,
    cellRenderer: (params: { data?: InventoryTransfer; value?: string }) => {
      const statusId = Number(params.data?.transferstatusid ?? 0);
      const label = params.value || STATUS_LABEL[statusId] || "—";
      const style: React.CSSProperties = {
        ...statusBadgeStyle(statusId),
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "20px",
      };
      return <span style={style}>{label}</span>;
    },
  },
  {
    headerName: "Transfer Date",
    field: "transferdatetime",
    sortable: true,
    filter: "agDateColumnFilter",
    width: 130,
    valueFormatter: (params) => {
      if (params.value) {
        return new Date(params.value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
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
