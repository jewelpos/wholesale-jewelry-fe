"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { AgGridReact } from "ag-grid-react";
import { GridReadyEvent, RowClassParams } from "ag-grid-community";
import "ag-grid-enterprise";
import { GET_PHYSICAL_COUNT_BATCH_QUERY, GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY } from "@/lib/graphql/query/physicalcount";
import { APPROVE_PHYSICAL_COUNT_MUTATION, CANCEL_PHYSICAL_COUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import POSGrid from "@/components/ui/grid/POSGrid";
import PostConfirmModal from "./PostConfirmModal";
import RecountRequestModal from "./RecountRequestModal";
import { Printer, CheckCircle2, RotateCcw, ClipboardList } from "lucide-react";

interface BatchItem {
  countitemid: number;
  itemid: number;
  itemcode: string | null;
  itemdescription: string | null;
  categoryname: string | null;
  subcategoryname: string | null;
  itemlocation: string | null;
  itemtype: string | null;
  bookqty: number;
  countedqty: number | null;
  recountqty: number | null;
  finalqty: number | null;
  variance: number | null;
  variancecost: number | null;
  bookcost: number;
  isrecountneeded: boolean;
  isskipped: boolean;
  currentliveqty?: number | null;
}

type FilterTab = "all" | "variance" | "large";

interface Props {
  readOnly?: boolean;
}

const currFmt = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qtyFmt = (v: number | null | undefined) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: 4 });

const VarianceReport = ({ readOnly = false }: Props) => {
  const { storeId: storeIdParam, outletId: outletIdParam, batchId } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedBatchId = parseInt(batchId as string, 10);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showPostModal, setShowPostModal] = useState(false);
  const [showRecountModal, setShowRecountModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approvingLoading, setApprovingLoading] = useState(false);

  const { data: batchData, loading: batchLoading, refetch: refetchBatch } = useQuery(GET_PHYSICAL_COUNT_BATCH_QUERY, {
    variables: { storeid: parsedStoreId, batchid: parsedBatchId },
    skip: !parsedStoreId || !parsedBatchId,
  });

  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY, {
    variables: { storeid: parsedStoreId, batchid: parsedBatchId },
    skip: !parsedStoreId || !parsedBatchId,
  });

  const [approveCount] = useMutation(APPROVE_PHYSICAL_COUNT_MUTATION);
  const [cancelCount] = useMutation(CANCEL_PHYSICAL_COUNT_MUTATION);

  const batch = batchData?.getPhysicalCountBatch;
  const allItems: BatchItem[] = itemsData?.getPhysicalCountBatchItems ?? [];

  const filteredItems = useMemo(() => {
    if (filterTab === "variance") return allItems.filter(i => i.variance !== null && i.variance !== 0);
    if (filterTab === "large") return allItems.filter(i => {
      if (!i.bookqty || i.variance == null) return false;
      return Math.abs(i.variance / i.bookqty) > 0.05;
    });
    return allItems;
  }, [allItems, filterTab]);

  // Summary cards
  const totalVarianceCost = allItems.reduce((s, i) => s + (i.variancecost ?? 0), 0);
  const itemsWithVariance = allItems.filter(i => i.variance != null && i.variance !== 0).length;
  const accuracy = allItems.length > 0
    ? Math.round(((allItems.length - itemsWithVariance) / allItems.length) * 100)
    : 0;

  const colDefs = useMemo(() => [
    {
      headerName: "",
      field: "sel",
      checkboxSelection: !readOnly,
      headerCheckboxSelection: !readOnly,
      width: 36,
      pinned: "left" as const,
      filter: false,
      sortable: false,
    },
    { headerName: "Item Code", field: "itemcode", width: 110, filter: "agTextColumnFilter" },
    { headerName: "Description", field: "itemdescription", flex: 1, minWidth: 160, filter: "agTextColumnFilter" },
    { headerName: "Location", field: "itemlocation", width: 100, filter: "agTextColumnFilter" },
    { headerName: "Category", field: "categoryname", width: 120, filter: "agTextColumnFilter" },
    {
      headerName: "Book Qty",
      field: "bookqty",
      width: 90,
      type: "numericColumn",
      valueFormatter: (p: { value: number | null }) => qtyFmt(p.value),
    },
    {
      headerName: "Live Qty",
      field: "currentliveqty",
      width: 90,
      type: "numericColumn",
      valueFormatter: (p: { value: number | null }) => qtyFmt(p.value),
      cellStyle: { color: "#64748b" },
    },
    {
      headerName: "Movement",
      width: 100,
      type: "numericColumn",
      valueGetter: (p: { data: BatchItem }) => {
        if (!p.data) return null;
        const live = p.data.currentliveqty;
        if (live == null) return null;
        return p.data.bookqty - live;
      },
      valueFormatter: (p: { value: number | null }) => qtyFmt(p.value),
      headerTooltip: "Units sold/adjusted since batch opened (bookqty − live qty)",
      cellStyle: (p: { value: number | null }) => ({ color: (p.value ?? 0) > 0 ? "#f59e0b" : "inherit" }),
    },
    {
      headerName: "Expected",
      width: 100,
      type: "numericColumn",
      valueGetter: (p: { data: BatchItem }) => {
        if (!p.data) return null;
        const live = p.data.currentliveqty;
        if (live == null) return null;
        const movement = p.data.bookqty - live;
        return p.data.bookqty - movement;
      },
      valueFormatter: (p: { value: number | null }) => qtyFmt(p.value),
      headerTooltip: "bookqty − movement = what should be on shelf",
      cellStyle: { color: "#64748b" },
    },
    {
      headerName: "Counted Qty",
      field: "finalqty",
      width: 110,
      type: "numericColumn",
      valueFormatter: (p: { value: number | null }) => p.value == null ? "—" : qtyFmt(p.value),
      cellStyle: { fontWeight: 700 },
    },
    {
      headerName: "True Variance",
      width: 120,
      type: "numericColumn",
      valueGetter: (p: { data: BatchItem }) => {
        if (!p.data) return null;
        const live = p.data.currentliveqty;
        if (live == null || p.data.finalqty == null) return p.data.variance;
        const expected = live;
        return p.data.finalqty - expected;
      },
      valueFormatter: (p: { value: number | null }) => qtyFmt(p.value),
      cellStyle: (p: { value: number | null }) => ({
        color: (p.value ?? 0) < 0 ? "#ef4444" : (p.value ?? 0) > 0 ? "#10b981" : "#64748b",
        fontWeight: 600,
      }),
    },
    {
      headerName: "Unit Cost",
      field: "bookcost",
      width: 90,
      type: "numericColumn",
      valueFormatter: (p: { value: number | null }) => currFmt(p.value),
    },
    {
      headerName: "Variance $",
      field: "variancecost",
      width: 110,
      type: "numericColumn",
      valueFormatter: (p: { value: number | null }) => currFmt(p.value),
      cellStyle: (p: { value: number | null }) => ({
        color: (p.value ?? 0) < 0 ? "#ef4444" : (p.value ?? 0) > 0 ? "#10b981" : "#64748b",
        fontWeight: 600,
      }),
    },
    {
      headerName: "Recount",
      field: "isrecountneeded",
      width: 80,
      cellRenderer: (p: { value: boolean }) => p.value
        ? <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Recount</span>
        : null,
    },
    {
      headerName: "Skipped",
      field: "isskipped",
      width: 75,
      cellRenderer: (p: { value: boolean }) => p.value
        ? <span className="badge bg-secondary" style={{ fontSize: 10 }}>Skip</span>
        : null,
    },
  ], [readOnly]);

  const handleGridReady = useCallback((e: GridReadyEvent) => {
    e.api.setGridOption("rowData", filteredItems);
  }, [filteredItems]);

  const handleApprove = async () => {
    if (!confirm("Approve this count? This will allow posting of stock adjustments.")) return;
    setApprovingLoading(true);
    try {
      const res = await approveCount({ variables: { storeid: parsedStoreId, batchid: parsedBatchId } });
      if (res.data?.approvePhysicalCount?.success) {
        dispatch(showNotification({ message: "Count approved", type: NOTIFICATION_TYPES.SUCCESS }));
        refetchBatch();
      } else {
        dispatch(showNotification({ message: res.data?.approvePhysicalCount?.error || "Failed", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this count batch? This cannot be undone.")) return;
    try {
      await cancelCount({ variables: { storeid: parsedStoreId, batchid: parsedBatchId } });
      dispatch(showNotification({ message: "Count cancelled", type: NOTIFICATION_TYPES.SUCCESS }));
      router.push(`/jw/${storeIdParam}/${outletIdParam}/products/physical_count/list`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleSelectionChanged = () => {
    const rows = gridRef.current?.api?.getSelectedRows() ?? [];
    setSelectedIds(rows.map((r: BatchItem) => r.countitemid));
  };

  const countstatus = batch?.countstatus ?? "";
  const isApproved = countstatus === "APPROVED";
  const isReview = countstatus === "REVIEW";
  const isPosted = countstatus === "POSTED";

  if (batchLoading || itemsLoading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}><div className="spinner-border spinner-border-sm" /></div>;
  }

  const printDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-header { display: block !important; }
          body { font-size: 10pt; }
          .card { border: 1px solid #000 !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 3px 6px; font-size: 9pt; }
          .signature-block { page-break-before: always; margin-top: 40px; }
        }
        .print-header { display: none; }
      ` }} />

      {/* Print header (hidden on screen, visible on print) */}
      <div className="print-header" style={{ marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>Physical Count Variance Report</h4>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          <strong>Batch:</strong> {batch?.batchnumber} &nbsp;|&nbsp;
          <strong>Warehouse:</strong> {batch?.warehousename} &nbsp;|&nbsp;
          <strong>Count Date:</strong> {batch?.countdate} &nbsp;|&nbsp;
          <strong>Status:</strong> {batch?.countstatus} &nbsp;|&nbsp;
          <strong>Printed:</strong> {printDate}
        </div>
      </div>

      {/* Screen header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3 no-print">
        <div>
          <h5 className="mb-0 fw-semibold">{readOnly ? "View Count" : "Review Count"} — {batch?.batchnumber}</h5>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {batch?.warehousename} · {batch?.scope} · {batch?.countdate}
            {" "}
            <span
              className={`badge ms-1 ${
                isPosted ? "bg-success" :
                isApproved ? "bg-purple" :
                isReview ? "bg-warning text-dark" :
                "bg-secondary"
              }`}
              style={isApproved ? { backgroundColor: "#7c3aed" } : {}}
            >
              {countstatus}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Print Report
          </button>
          {!readOnly && isReview && (
            <>
              <button
                className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    dispatch(showNotification({ message: "Select items to request recount", type: NOTIFICATION_TYPES.ERROR }));
                    return;
                  }
                  setShowRecountModal(true);
                }}
              >
                <RotateCcw size={13} />
                Request Recount {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </button>
              <button
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                onClick={handleApprove}
                disabled={approvingLoading}
              >
                {approvingLoading ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle2 size={13} />}
                Approve Count
              </button>
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </>
          )}
          {!readOnly && isApproved && (
            <button
              className="btn btn-sm btn-success d-flex align-items-center gap-1"
              onClick={() => setShowPostModal(true)}
            >
              <ClipboardList size={13} />
              Post Adjustments →
            </button>
          )}
          {!readOnly && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => router.push(`/jw/${storeIdParam}/${outletIdParam}/products/physical_count/${batchId}/count`)}
            >
              ← Back to Count
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { label: "Total Items", value: allItems.length, color: "#6366f1" },
          { label: "Items with Variance", value: itemsWithVariance, color: itemsWithVariance > 0 ? "#ef4444" : "#10b981" },
          { label: "Variance Cost", value: `$${currFmt(totalVarianceCost)}`, color: totalVarianceCost < 0 ? "#ef4444" : "#10b981" },
          { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 95 ? "#10b981" : accuracy >= 80 ? "#f59e0b" : "#ef4444" },
        ].map(card => (
          <div key={card.label} className="col-6 col-md-3">
            <div className="card border-0" style={{ backgroundColor: "#f8fafc" }}>
              <div className="card-body py-2">
                <div style={{ fontSize: 11, color: "#64748b" }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-2 no-print">
        {(["all", "variance", "large"] as FilterTab[]).map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${filterTab === tab ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setFilterTab(tab)}
            style={{ fontSize: 12 }}
          >
            {tab === "all" ? `All (${allItems.length})` :
             tab === "variance" ? `With Variance (${itemsWithVariance})` :
             "Large Variance (>5%)"}
          </button>
        ))}
      </div>

      {/* Variance Grid */}
      <div style={{ height: "calc(100vh - 460px)", minHeight: 300 }}>
        <POSGrid
          ref={gridRef}
          columnDefs={colDefs}
          rowData={filteredItems}
          onGridReady={handleGridReady}
          rowModelType="clientSide"
          rowHeight={28}
          headerHeight={32}
          rowSelection={readOnly ? undefined : "multiple"}
          onSelectionChanged={handleSelectionChanged}
          getRowStyle={(p: RowClassParams<BatchItem>) => {
            if (!p.data) return undefined;
            const v = p.data.variance;
            if ((v ?? 0) < 0) return { backgroundColor: "#fef2f2" } as const;
            if ((v ?? 0) > 0) return { backgroundColor: "#f0fdf4" } as const;
            return undefined;
          }}
        />
      </div>

      {/* Print-only variance table */}
      <table style={{ display: "none" }} className="print-only-table">
        <thead>
          <tr>
            <th>Item Code</th><th>Description</th><th>Location</th>
            <th>Book Qty</th><th>Counted Qty</th><th>Variance</th>
            <th>Unit Cost</th><th>Variance $</th><th>Recount?</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map(item => (
            <tr key={item.countitemid}>
              <td>{item.itemcode}</td>
              <td>{item.itemdescription}</td>
              <td>{item.itemlocation ?? "—"}</td>
              <td style={{ textAlign: "right" }}>{qtyFmt(item.bookqty)}</td>
              <td style={{ textAlign: "right" }}>{qtyFmt(item.finalqty)}</td>
              <td style={{ textAlign: "right" }}>{qtyFmt(item.variance)}</td>
              <td style={{ textAlign: "right" }}>{currFmt(item.bookcost)}</td>
              <td style={{ textAlign: "right" }}>{currFmt(item.variancecost)}</td>
              <td>{item.isrecountneeded ? "Yes" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature block (print only) */}
      <div className="signature-block" style={{ display: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, marginTop: 60 }}>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontSize: 11 }}>Counted By</div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontSize: 11 }}>Verified By</div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 6, fontSize: 11 }}>Date</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PostConfirmModal
        show={showPostModal}
        batch={batch}
        items={allItems}
        onClose={() => setShowPostModal(false)}
        onPosted={() => {
          setShowPostModal(false);
          refetchBatch();
          refetchItems();
        }}
      />

      <RecountRequestModal
        show={showRecountModal}
        selectedIds={selectedIds}
        batchId={parsedBatchId}
        onClose={() => setShowRecountModal(false)}
        onDone={() => {
          setShowRecountModal(false);
          refetchItems();
          setSelectedIds([]);
          gridRef.current?.api?.deselectAll();
        }}
      />
    </div>
  );
};

export default VarianceReport;
