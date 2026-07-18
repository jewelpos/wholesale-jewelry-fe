import React from "react";
import { ColDef } from "ag-grid-community";

export const getPromotionColumnDefs = (): ColDef[] => [
  {
    field: "promotionname",
    headerName: "Promotion Name",
    flex: 2,
    minWidth: 180,
  },
  {
    field: "promotiontype",
    headerName: "Type",
    width: 110,
    cellRenderer: (params: any) => {
      const t = params.value;
      return (
        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: t === "standard" ? "#e0f2fe" : "#fce7f3", color: t === "standard" ? "#0369a1" : "#9d174d" }}>
          {t}
        </span>
      );
    },
  },
  {
    field: "startdate",
    headerName: "Start",
    width: 130,
    valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : "—",
  },
  {
    field: "enddate",
    headerName: "End",
    width: 130,
    valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : "—",
  },
  {
    field: "isactive",
    headerName: "Status",
    width: 100,
    cellRenderer: (params: any) => {
      const active = params.value === 1;
      return (
        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: active ? "#dcfce7" : "#f1f5f9", color: active ? "#15803d" : "#64748b" }}>
          {active ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    field: "items",
    headerName: "Rules",
    width: 80,
    valueFormatter: (p: any) => `${p.value?.length ?? 0}`,
    sortable: false,
  },
  {
    headerName: "Actions",
    field: "promotionid",
    width: typeof window !== "undefined" && window.innerWidth < 992 ? 52 : 130,
    minWidth: 52,
    sortable: false,
    filter: false,
    cellRenderer: "promotionActionsRenderer",
    pinned: "right",
  },
];
