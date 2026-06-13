"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "@/components/ui/grid/POSGrid";
import { GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { PurchaseOrder, PurchaseOrderItem } from "@/types/purchase";
import purchaseOrderItemsColumnDefs from "./orderItems/ColumnDef";
import dayjs from "dayjs";
import Link from "next/link";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { ExternalLink } from "react-feather";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const fmtDate = (v?: string) => {
  if (!v) return "—";
  const asNum = Number(v);
  const d = isNaN(asNum) ? dayjs(v) : dayjs(asNum);
  return d.isValid() ? d.format("MM/DD/YYYY") : "—";
};

const statusStyle = (value?: string) => {
  const lower = (value ?? "").toLowerCase();
  if (lower.includes("open") || lower.includes("draft"))
    return { bg: "#dbeafe", border: "#93c5fd", color: "#1e40af" };
  if (lower.includes("partial"))
    return { bg: "#fef9c3", border: "#fde047", color: "#854d0e" };
  if (lower.includes("closed") || lower.includes("received") || lower.includes("complete"))
    return { bg: "#dcfce7", border: "#86efac", color: "#166534" };
  if (lower.includes("cancel") || lower.includes("void"))
    return { bg: "#fee2e2", border: "#fca5a5", color: "#991b1b" };
  return { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
};

interface Props {
  po: PurchaseOrder | null;
  storeid: number;
  onClose: () => void;
}

const useWindowWidth = () => {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
};

const PODetailDrawer = ({ po, storeid, onClose }: Props) => {
  const [getPurchaseOrderItemsList] = useLazyQuery(GET_SUPPLIER_PURCHASE_ORDER_ITEMS_LIST_QUERY);
  const dispatch = useAppDispatch();
  const { basePath } = useDefaultRoute();
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState(false);
  const windowWidth = useWindowWidth();
  const isTablet = windowWidth <= 1024;

  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        if (!po) return;
        const filters = filterVariables(params);
        const result = await handleTryCatch(async () => {
          const { data } = await getPurchaseOrderItemsList({
            variables: { ponumber: parseInt(po.ponumber, 10), storeid, ...filters },
          });
          if (data.getSupplierPurchaseOrderItemsList) {
            const { data: rows, total } = data.getSupplierPurchaseOrderItemsList;
            params.success({ rowData: rows, rowCount: total });
            if (!rows.length) gridRef.current?.api?.showNoRowsOverlay();
            else gridRef.current?.api?.hideOverlay();
          }
          return true;
        });
        if (result.error) {
          gridRef.current?.api?.showNoRowsOverlay();
          dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
          params.fail();
        }
      },
    }),
    [po, storeid, getPurchaseOrderItemsList, dispatch]
  );

  // Set datasource on grid ready — reliable because the API is guaranteed valid here.
  // Grid mounts fresh each time the drawer opens (po goes null → value), so this
  // covers the initial load. The effect below covers switching POs while open.
  const handleOnGridReady = (params: GridReadyEvent<PurchaseOrderItem>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
    if (po?.ponumber && storeid) {
      params.api.setGridOption("serverSideDatasource", datasource);
    }
  };

  useEffect(() => {
    if (po?.ponumber && storeid && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [datasource, gridReady, po?.ponumber, storeid]);

  const isOpen = !!po;
  const ss = statusStyle(po?.status);

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.25)",
          zIndex: 1040,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: isTablet ? "100vw" : "min(700px, 58vw)",
          background: "#fff",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
          zIndex: 1050,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {po && (
          <>
            {/* ── header ─────────────────────────────── */}
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px" }}>
                    PURCHASE ORDER
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    PO #{po.ponumber}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    href={`${basePath}/purchases/${po.ponumber}/view`}
                    onClick={onClose}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "none",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#3b82f6",
                      textDecoration: "none",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ExternalLink size={12} />
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: "none",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 16,
                      color: "#64748b",
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* info chips */}
              <div className="d-flex flex-wrap gap-3">
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>SUPPLIER</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{po.suppliername || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>PO DATE</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>{fmtDate(po.podate)}</div>
                </div>
                {po.porequestdate && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>REQUEST DATE</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{fmtDate(po.porequestdate)}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>TOTAL</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    {po.pototal != null ? fmt(po.pototal) : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px", marginBottom: 2 }}>STATUS</div>
                  {po.status ? (
                    <span style={{
                      display: "inline-block",
                      padding: "1px 9px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      background: ss.bg,
                      color: ss.color,
                      border: `1px solid ${ss.border}`,
                    }}>
                      {po.status}
                    </span>
                  ) : "—"}
                </div>
                {po.warehouse && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>WAREHOUSE</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{po.warehouse}</div>
                  </div>
                )}
                {po.createdby && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>CREATED BY</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{po.createdby}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── items title ─────────────────────────── */}
            <div style={{ padding: "8px 20px 6px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.3px" }}>
                ORDER ITEMS
              </div>
            </div>

            {/* ── items grid ─────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "4px 8px 8px" }}>
              <POSGrid
                ref={gridRef}
                columnDefs={purchaseOrderItemsColumnDefs}
                onGridReady={handleOnGridReady}
                domLayout="autoHeight"
                defaultColDef={{ filter: false, floatingFilter: false }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PODetailDrawer;
