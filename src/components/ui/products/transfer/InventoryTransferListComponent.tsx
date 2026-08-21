"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { ColDef, GridReadyEvent, IServerSideGetRowsParams, ICellRendererParams } from "ag-grid-community";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import "ag-grid-enterprise";
import { InventoryTransfer, UpdateInventoryTransferStatusInput } from "@/types/product";
import { filterVariables } from "@/lib/utils/gridFilters";
import POSGrid from "../../grid/POSGrid";
import InventoryTransferItemsComponent from "./transferItems/InventoryTransferItemsComponent";
import CustomFilterSections from "../../grid/CustomFilterSections";
import { useDebounce } from "@/hooks/useDebounce";
import { useParams } from "next/navigation";
import { GET_INVENTORY_TRANSFER_LIST_QUERY } from "@/lib/graphql/query/products";
import { inventoryTransferColumnDefs, statusBadgeStyle, STATUS_LABEL } from "./ColumnDef";
import InventoryTransferListHeader from "./InventoryTransferListHeader";
import CancelTransferModal from "./CancelTransferModal";
import { CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION } from "@/lib/graphql/mutations/products";

const STATUS_PILLS = [
  { label: "All", value: null },
  { label: "Pending", value: 1 },
  { label: "Approved", value: 2 },
  { label: "Ready to Receive", value: 3 },
  { label: "Cancelled", value: 5 },
];

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

const pillStyle = (active: boolean, statusId: number | null): React.CSSProperties => {
  if (!active) {
    return {
      padding: "4px 14px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      border: "1px solid #e5e7eb",
      background: "white",
      color: "#6b7280",
      cursor: "pointer",
    };
  }
  const colorMap: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    2: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    3: { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
    5: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  };
  const c = statusId != null ? colorMap[statusId] : null;
  return {
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${c?.border ?? "#6366f1"}`,
    background: c?.bg ?? "#eef2ff",
    color: c?.color ?? "#3730a3",
    cursor: "pointer",
  };
};

const InventoryTransferListComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [getInventoryTransferList] = useLazyQuery(GET_INVENTORY_TRANSFER_LIST_QUERY);
  const dispatch = useAppDispatch();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<number | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const gridRef = useRef<AgGridReact>(null);
  const [gridReady, setGridReady] = useState<boolean>(false);

  // Same "does this user actually have more than one outlet to look at" check as the
  // header's store/outlet switcher (StoreDropdown.tsx) — no point showing an outlet
  // picker to someone who only ever sees their own single outlet's transfers anyway.
  const isOwner = !!useAppSelector((state) => state.user.data?.issysgenmasteraccount);
  const storeOutlets = useAppSelector((state) => state.store.data?.outlets) ?? [];
  const enabledOutlets = useMemo(() => storeOutlets.filter((o) => o.isenabled), [storeOutlets]);
  const showOutletFilter = isOwner || enabledOutlets.length > 1;

  // Refs so getRows always reads the latest filter state without needing a new datasource
  const selectedStatusRef = useRef(selectedStatus);
  const selectedOutletRef = useRef(selectedOutlet);
  const datePresetRef = useRef(datePreset);
  const debouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => { selectedStatusRef.current = selectedStatus; }, [selectedStatus]);
  useEffect(() => { selectedOutletRef.current = selectedOutlet; }, [selectedOutlet]);
  useEffect(() => { datePresetRef.current = datePreset; }, [datePreset]);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

  const [changeStatus] = useMutation(CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION);

  const handleOnGridReady = (params: GridReadyEvent<InventoryTransfer>) => {
    setGridReady(true);
    params?.api?.autoSizeAllColumns?.();
  };

  const getRows = useCallback(async (params: IServerSideGetRowsParams) => {
    let filtersMain = filterVariables(
      params,
      debouncedSearchRef.current,
      "transfersource, destination, transfertype, username"
    );
    // The backend already scopes this list to transfers the caller's own outlet(s) are
    // party to (fromwarhouse OR towarehouse) — this picker only exists for owners/multi-
    // outlet users to narrow further to ONE specific outlet, on either side of the
    // transfer (fromoutletid/tooutletid), not the ambiguous single-sided warehouseid.
    const outlet = selectedOutletRef.current;
    if (outlet !== undefined) {
      filtersMain = {
        ...filtersMain,
        filters: [
          ...filtersMain.filters,
          { key: "fromoutletid,tooutletid", value: { filterType: "text", type: "equals", filter: outlet } },
        ],
      };
    }
    const status = selectedStatusRef.current;
    if (status !== null) {
      filtersMain = {
        ...filtersMain,
        filters: [
          ...filtersMain.filters,
          { key: "transferstatusid", value: { filterType: "text", type: "equals", filter: status } },
        ],
      };
    }
    const dateRange = getDateRange(datePresetRef.current);
    if (dateRange) {
      filtersMain = {
        ...filtersMain,
        filters: [
          ...filtersMain.filters,
          { key: "transferdatetime", value: { filterType: "date", type: "inRange", dateFrom: dateRange.startdate, dateTo: `${dateRange.enddate} 23:59:59` } },
        ],
      };
    }
    const result = await handleTryCatch(async () => {
      const { data } = await getInventoryTransferList({
        variables: { storeid: parsedStoreId, ...filtersMain },
      });
      if (data?.getInventoryTransferList) {
        params.success({
          rowData: data.getInventoryTransferList.data,
          rowCount: data.getInventoryTransferList.total,
        });
        if (!data.getInventoryTransferList.data.length) {
          gridRef.current?.api?.showNoRowsOverlay();
        } else {
          gridRef.current?.api?.hideOverlay();
        }
      } else {
        params.success({ rowData: [], rowCount: 0 });
        gridRef.current?.api?.showNoRowsOverlay();
      }
      return true;
    });
    if (result.error) {
      gridRef.current?.api?.showNoRowsOverlay();
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      params.fail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable datasource object — never recreated so AG Grid never resets mid-fetch
  const datasource = useRef({ getRows }).current;

  const refreshGrid = useCallback(() => {
    if (gridReady) gridRef.current?.api?.refreshServerSide({ purge: true });
  }, [gridReady]);

  const handleChangeStatus = async (
    inventoryitemtransferid: number,
    transferstatusid: number,
    remarks?: string
  ) => {
    if (!parsedStoreId) return;

    const payload: UpdateInventoryTransferStatusInput = {
      storeid: parsedStoreId,
      inventoryitemtransferid,
      transferstatusid,
      ...(remarks ? { remarks } : {}),
    };

    setActionLoadingId(inventoryitemtransferid);
    const result = await handleTryCatch(async () => {
      const response = await changeStatus({
        variables: { changeInventoryTransferStatusInput: payload },
      });
      const successData = response.data?.changeInventoryTransferStatus;
      if (successData) {
        dispatch(showNotification({
          message: successData.message,
          type: successData.success ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.ERROR,
        }));
        if (successData.success) {
          refreshGrid();
          setCancelTargetId(null);
        }
      }
      return true;
    });

    setActionLoadingId(null);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleConfirmCancel = (remarks: string) => {
    if (cancelTargetId == null) return;
    handleChangeStatus(cancelTargetId, 5, remarks);
  };

  const columnDefs = useMemo(() => {
    const actionsCol: ColDef<InventoryTransfer> = {
      headerName: "Actions",
      field: "inventoryitemtransferid",
      sortable: false,
      filter: false,
      width: 180,
      pinned: "right",
      cellRenderer: (params: ICellRendererParams<InventoryTransfer>) => {
        const row = params.data;
        if (!row) return null;
        const id = Number(row.inventoryitemtransferid);
        const statusId = Number(row.transferstatusid);

        if (statusId === 1) {
          const disabled = actionLoadingId === id;
          // Approval is a source-outlet decision (their own stock is on the line) —
          // the requesting/destination outlet can't approve its own request. Backend
          // already enforces this (assertUserCanActOnTransfer); this just keeps the
          // button from being clickable only to bounce off a "not authorized" error.
          const isRequestingOutlet =
            Number.isFinite(parsedOutletId) && Number(row.tooutletid) === parsedOutletId;
          return (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                disabled={disabled || isRequestingOutlet}
                title={
                  isRequestingOutlet
                    ? "Only the supplying outlet can approve this request"
                    : "Review requested quantities and confirm below"
                }
                // Approving may need to happen for less than what was requested (source
                // doesn't have it, or doesn't want to send all of it) — so this expands
                // the row to the editable Approve Qty panel instead of approving blind.
                onClick={() => params.node.setExpanded(true)}
              >
                Review &amp; Approve
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={disabled}
                onClick={() => setCancelTargetId(id)}
              >
                Cancel
              </button>
            </div>
          );
        }

        const label = row.transferstatus || STATUS_LABEL[statusId] || "—";
        return (
          <span
            style={{
              ...statusBadgeStyle(statusId),
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: "20px",
            }}
          >
            {label}
          </span>
        );
      },
    };
    return [...inventoryTransferColumnDefs, actionsCol];
  }, [actionLoadingId, refreshGrid, parsedOutletId]);

  // Set datasource once when grid is ready
  useEffect(() => {
    if (parsedStoreId && gridReady) {
      gridRef.current!.api!.setGridOption("serverSideDatasource", datasource);
    }
  }, [parsedStoreId, gridReady, datasource]);

  // Refresh (not reset datasource) when filters change
  useEffect(() => {
    if (!gridReady) return;
    if (debouncedSearch) gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.refreshServerSide({ purge: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedOutlet, datePreset, debouncedSearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <InventoryTransferListHeader />
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
          />

          {/* Status + date filter pills */}
          <div className="d-flex align-items-center justify-content-between px-2 pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {STATUS_PILLS.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  style={pillStyle(selectedStatus === pill.value, pill.value)}
                  onClick={() => setSelectedStatus(pill.value)}
                >
                  {pill.label}
                </button>
              ))}
              {showOutletFilter && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", fontSize: 12 }}
                  value={selectedOutlet ?? ""}
                  onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Outlets</option>
                  {enabledOutlets.map((o) => (
                    <option key={o.outletid} value={o.outletid}>
                      {o.outletname}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
            <POSGrid gridKey="inventory-transfer-list"
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={handleOnGridReady}
              fillHeight
              masterDetail
              detailCellRenderer={InventoryTransferItemsComponent}
              detailCellRendererParams={{ onApproved: refreshGrid }}
              detailRowAutoHeight
            />
          </div>
        </div>
      </div>

      {cancelTargetId != null && (
        <CancelTransferModal
          onClose={() => setCancelTargetId(null)}
          onConfirm={handleConfirmCancel}
          loading={actionLoadingId === cancelTargetId}
        />
      )}
    </div>
  );
};

export default InventoryTransferListComponent;
