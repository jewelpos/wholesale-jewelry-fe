"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { PurchaseOrder } from "@/types/purchase";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../grid/POSGrid";
import PODetailDrawer from "./PODetailDrawer";
import POStatsCards from "./POStatsCards";
import CustomFilterSections from "../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY } from "@/lib/graphql/query/purchase";
import { purchaseOrderColumnDefs } from "./ColumnDef";
import PurchaseOrderListHeader from "./PurchaseOrderListHeader";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import api from "@/lib/axios";
import PurchaseOrderActions from "./PurchaseOrderActions";
import { exportGridToExcel } from "@/lib/utils/exportGrid";
import { useSummaryPanel } from "@/hooks/useSummaryPanel";
import SummaryPanelWrapper from "../grid/SummaryPanelWrapper";

type DatePreset = "all" | "today" | "week" | "month" | "quarter" | "year";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "All",
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Qtr",
  year: "This Year",
};

function getDateRange(preset: DatePreset): { startdate: string; enddate: string } | null {
  if (preset === "all") return null;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (preset === "today") return { startdate: today, enddate: today };
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startdate: fmt(start), enddate: today };
  }
  if (preset === "month") {
    return { startdate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, enddate: today };
  }
  if (preset === "quarter") {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { startdate: fmt(qStart), enddate: today };
  }
  return { startdate: `${now.getFullYear()}-01-01`, enddate: today };
}

const PurchaseOrderListComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [getPurchaseOrdersList] = useLazyQuery(
    GET_SUPPLIER_PURCHASE_ORDER_LIST_QUERY
  );
  const dispatch = useAppDispatch();
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(
    -1
  );
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);
  const [selectedPOs, setSelectedPOs] = useState<number[]>([]);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const knownStatusesRef = useRef(new Set<string>());
  const [knownStatuses, setKnownStatuses] = useState<string[]>([]);

  const handleOnGridReady = (params: GridReadyEvent<PurchaseOrder>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  // Refs so datasource closure always reads the latest filter values without recreating
  const debouncedSearchRef = useRef(debouncedSearch);
  const selectedSupplierRef = useRef(selectedSupplier);
  const statusFilterRef = useRef(statusFilter);
  const datePresetRef = useRef(datePreset);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { selectedSupplierRef.current = selectedSupplier; }, [selectedSupplier]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { datePresetRef.current = datePreset; }, [datePreset]);

  // Stable datasource — created once, reads filters from refs
  const datasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const filters = filterVariables(
          params,
          debouncedSearchRef.current,
          "ponumber, suppliername"
        );
        if (statusFilterRef.current) {
          filters.filters = [
            ...filters.filters,
            { key: "status", value: { filterType: "text", type: "equals", filter: statusFilterRef.current } },
          ];
        }
        const dateRange = getDateRange(datePresetRef.current);
        if (dateRange) {
          filters.filters = [
            ...filters.filters,
            { key: "podate", value: { filterType: "date", type: "inRange", dateFrom: dateRange.startdate, dateTo: dateRange.enddate } },
          ];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let variables: any = { storeid: parsedStoreId };
        if (selectedSupplierRef.current !== -1) {
          variables = { ...variables, supplierid: selectedSupplierRef.current };
        }
        const result = await handleTryCatch(async () => {
          const { data } = await getPurchaseOrdersList({
            variables: { ...variables, ...filters },
          });
          if (data.getSupplierPurchaseOrderList) {
            const rows: PurchaseOrder[] = data.getSupplierPurchaseOrderList.data;
            params.success({
              rowData: rows,
              rowCount: data.getSupplierPurchaseOrderList.total,
            });
            if (!rows.length) {
              gridRef.current?.api?.showNoRowsOverlay();
            } else {
              gridRef.current?.api?.hideOverlay();
            }
            // Accumulate unique statuses for dynamic pills
            const prevSize = knownStatusesRef.current.size;
            rows.forEach((r) => { if (r.status) knownStatusesRef.current.add(r.status); });
            if (knownStatusesRef.current.size > prevSize) {
              setKnownStatuses([...knownStatusesRef.current].sort());
            }
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
    [parsedStoreId, dispatch, getPurchaseOrdersList]
  );

  const handleDeleteSuccess = useCallback(() => {
    if (gridReady) {
      gridRef.current?.api?.refreshServerSide({ purge: true });
    }
  }, [gridReady]);

  const columnDefs = useMemo<ColDef<PurchaseOrder>[]>(
    () => [
      ...purchaseOrderColumnDefs,
      {
        headerName: "Actions",
        colId: "actions",
        cellRenderer: (params: ICellRendererParams<PurchaseOrder>) =>
          params.data ? (
            <PurchaseOrderActions
              data={params.data}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ) : null,
        width: 200,
        minWidth: 200,
        sortable: false,
        filter: false,
        pinned: "right",
        suppressAutoSize: true,
        suppressSizeToFit: true,
        suppressMovable: true,
        suppressHeaderMenuButton: true,
        enableRowGroup: false,
      },
    ],
    [handleDeleteSuccess]
  );

  // Set datasource once when grid ready — stable datasource so this only fires once
  useEffect(() => {
    if (parsedStoreId && gridReady && gridRef.current?.api) {
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [gridReady, datasource, parsedStoreId]);

  // Refresh data when filters change — initial load handled by Effect 1 (setGridOption triggers it)
  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSupplier, statusFilter, datePreset]);

  const { isAdmin, isCollapsed, toggle } = useSummaryPanel("purchase-list");

  const handleExport = async (poNumbers: number[], type: string) => {
    setLoading(true);
    const updatedPayload = {
      storeid: parsedStoreId,
      ponumbers: poNumbers,
    };
    const result = await handleTryCatch(
      async () => {
        dispatch(
          showNotification({
            message: "Processing request...",
            type: NOTIFICATION_TYPES.INFO,
          })
        );
        const response = await api.post(
          `/store/purchase-order/print`,
          updatedPayload,
          {
            responseType: "blob", // <== CRITICAL
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { data } = response;
        if (data) {
          if (type === "export") {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "purchase_orders.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else {
            const url = window.URL.createObjectURL(data);
            setPdfPreview({ url, filename: "purchase_orders.pdf" });
          }
          dispatch(
            showNotification({
              message: data.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );

    if (result.error) {
      setLoading(false);
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
        <PurchaseOrderListHeader
          selectedPOs={selectedPOs}
          handleExport={handleExport}
          onExport={() => exportGridToExcel(gridRef.current?.api, { fileName: "purchase-orders", sheetName: "Purchase Orders" })}
          onEmail={() => setShowEmailModal(true)}
        />
        {isAdmin && (
          <SummaryPanelWrapper isCollapsed={isCollapsed} onToggle={toggle} title="Purchase Order Summary">
            <POStatsCards storeid={parsedStoreId} supplierid={selectedSupplier} />
          </SummaryPanelWrapper>
        )}
        <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
          <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <CustomFilterSections
              gridRef={gridRef}
              search={search}
              setSearch={setSearch}
              selectedSupplier={selectedSupplier}
              setSelectedSupplier={setSelectedSupplier}
            />
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginBottom: 8 }}>
              {/* Status pills — left */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {knownStatuses.length > 0 && [null, ...knownStatuses].map((s) => {
                  const isActive = statusFilter === s;
                  return (
                    <button
                      key={s ?? "__all__"}
                      type="button"
                      onClick={() => setStatusFilter(isActive ? null : s)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: isActive ? "var(--accent)" : "var(--surface-muted)",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                      }}
                    >
                      {s ?? "All"}
                    </button>
                  );
                })}
              </div>
              {/* Date preset pills — right */}
              <div className="btn-group btn-group-sm">
                {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn ${datePreset === p ? "btn-secondary" : "btn-outline-secondary"}`}
                    style={{ fontSize: 11, padding: "3px 10px" }}
                    onClick={() => setDatePreset(p)}
                  >
                    {DATE_PRESET_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <POSGrid
                ref={gridRef}
                columnDefs={columnDefs}
                onGridReady={handleOnGridReady}
                fillHeight
                rowSelection={{
                  mode: "multiRow",
                  checkboxes: true,
                  headerCheckbox: true,
                  suppressRowClickSelection: true,
                }}
                onSelectionChanged={() => {
                  const selected =
                    gridRef.current?.api
                      ?.getSelectedRows()
                      ?.map?.((row: PurchaseOrder) => Number(row.ponumber)) || [];
                  setSelectedPOs(selected);
                }}
                onRowClicked={(e) => {
                  const target = e.event?.target as HTMLElement | null;
                  if (target?.closest(".ag-selection-checkbox")) return;
                  if (target?.closest(".action-table-data")) return;
                  if (e.data) setSelectedPO(e.data as PurchaseOrder);
                }}
                getRowStyle={(params) =>
                  params.data?.ponumber === selectedPO?.ponumber
                    ? { background: "#eff6ff" }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>

      <PODetailDrawer
        po={selectedPO}
        storeid={parsedStoreId}
        onClose={() => setSelectedPO(null)}
      />

      {showEmailModal && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="PURCHASE_ORDER"
          documentNumbers={selectedPOs}
          onClose={() => setShowEmailModal(false)}
          onSent={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS }))}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
      {pdfPreview && (
        <PdfPreviewModal
          pdfUrl={pdfPreview.url}
          filename={pdfPreview.filename}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </>
  );
};

export default PurchaseOrderListComponent;
