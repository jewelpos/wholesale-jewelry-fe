"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PHYSICAL_COUNT_BATCH_QUERY, GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY } from "@/lib/graphql/query/physicalcount";
import { SAVE_COUNT_ITEMS_MUTATION, COMPLETE_COUNT_MUTATION, CANCEL_PHYSICAL_COUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import CountProgressBar from "./CountProgressBar";
import BarcodeScannerModal from "./BarcodeScannerModal";
import { Camera, Save, CheckCircle2, XCircle } from "lucide-react";

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
  isskipped: boolean;
  isrecountneeded: boolean;
  remarks: string | null;
}

type ScanMode = "auto" | "manual";

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

const CountEntryPage = () => {
  const { storeId: storeIdParam, outletId: outletIdParam, batchId } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedBatchId = parseInt(batchId as string, 10);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Local qty / skip state (pending saves)
  const [localQty, setLocalQty] = useState<Record<number, string>>({});
  const [localSkip, setLocalSkip] = useState<Record<number, boolean>>({});
  const [localRemarks, setLocalRemarks] = useState<Record<number, string>>({});
  // Scan counts (auto mode: increments per scan session)
  const [scanCounts, setScanCounts] = useState<Record<number, number>>({});

  const [search, setSearch] = useState("");
  const [showUncountedOnly, setShowUncountedOnly] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("auto");
  const [showScanner, setShowScanner] = useState(false);
  const [qtyDialogItem, setQtyDialogItem] = useState<BatchItem | null>(null);
  const [qtyDialogValue, setQtyDialogValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const rowRefs = useRef<Record<number, HTMLTableRowElement | HTMLDivElement | null>>({});

  const { data: batchData, loading: batchLoading } = useQuery(GET_PHYSICAL_COUNT_BATCH_QUERY, {
    variables: { storeid: parsedStoreId, batchid: parsedBatchId },
    skip: !parsedStoreId || !parsedBatchId,
  });

  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY, {
    variables: { storeid: parsedStoreId, batchid: parsedBatchId },
    skip: !parsedStoreId || !parsedBatchId,
  });

  const [saveItems] = useMutation(SAVE_COUNT_ITEMS_MUTATION);
  const [completeCount] = useMutation(COMPLETE_COUNT_MUTATION);
  const [cancelBatch] = useMutation(CANCEL_PHYSICAL_COUNT_MUTATION);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const batch = batchData?.getPhysicalCountBatch;
  const allItems: BatchItem[] = itemsData?.getPhysicalCountBatchItems ?? [];
  const isReadOnly = batch && !["OPEN"].includes(batch.countstatus);

  // Sync initial values from server
  useEffect(() => {
    const qtyInit: Record<number, string> = {};
    const skipInit: Record<number, boolean> = {};
    const remInit: Record<number, string> = {};
    allItems.forEach(item => {
      qtyInit[item.countitemid] = item.countedqty !== null ? String(item.countedqty) : "";
      skipInit[item.countitemid] = item.isskipped ?? false;
      remInit[item.countitemid] = item.remarks ?? "";
    });
    setLocalQty(qtyInit);
    setLocalSkip(skipInit);
    setLocalRemarks(remInit);
  }, [allItems.length]);

  const persistItem = useCallback(async (countitemid: number) => {
    const qtyStr = localQty[countitemid];
    const skipped = localSkip[countitemid] ?? false;
    const remarks = localRemarks[countitemid] ?? "";
    const countedqty = qtyStr !== "" ? parseFloat(qtyStr) : null;
    try {
      await saveItems({
        variables: {
          input: {
            storeid: parsedStoreId,
            batchid: parsedBatchId,
            items: [{ countitemid, countedqty, isskipped: skipped, remarks: remarks || null }],
          },
        },
      });
    } catch {
      // silent — will retry on blur
    }
  }, [localQty, localSkip, localRemarks, parsedStoreId, parsedBatchId, saveItems]);

  const scheduleAutoSave = (countitemid: number, delayMs = 1500) => {
    if (saveTimers.current[countitemid]) clearTimeout(saveTimers.current[countitemid]);
    saveTimers.current[countitemid] = setTimeout(() => persistItem(countitemid), delayMs);
  };

  const handleQtyChange = (countitemid: number, val: string) => {
    setLocalQty(prev => ({ ...prev, [countitemid]: val }));
    scheduleAutoSave(countitemid);
  };

  const handleSkipChange = (countitemid: number, checked: boolean) => {
    setLocalSkip(prev => ({ ...prev, [countitemid]: checked }));
    if (checked) setLocalQty(prev => ({ ...prev, [countitemid]: "" }));
    scheduleAutoSave(countitemid, 300);
  };

  const handleBlur = (countitemid: number) => {
    if (saveTimers.current[countitemid]) clearTimeout(saveTimers.current[countitemid]);
    persistItem(countitemid);
  };

  // Barcode scanner handlers
  const handleItemFound = useCallback((item: BatchItem) => {
    const id = item.countitemid;
    if (item.itemtype === "Pc" && scanMode === "auto") {
      setScanCounts(prev => {
        const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
        const newQty = String(next[id]);
        setLocalQty(q => ({ ...q, [id]: newQty }));
        scheduleAutoSave(id);
        return next;
      });
    }
    // Highlight and scroll
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 2000);
    rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [scanMode]);

  const handleQtyEntry = useCallback((item: BatchItem) => {
    setQtyDialogItem(item);
    setQtyDialogValue("");
    setShowScanner(false);
  }, []);

  const confirmQtyDialog = () => {
    if (!qtyDialogItem) return;
    const id = qtyDialogItem.countitemid;
    const v = parseFloat(qtyDialogValue);
    if (isNaN(v) || v < 0) return;
    setLocalQty(prev => ({ ...prev, [id]: String(v) }));
    persistItem(id);
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 2000);
    rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setQtyDialogItem(null);
    setShowScanner(true);
  };

  const handleCancelBatch = async () => {
    setCancelling(true);
    try {
      const res = await cancelBatch({ variables: { storeid: parsedStoreId, batchid: parsedBatchId } });
      if (res.data?.cancelPhysicalCount?.success) {
        dispatch(showNotification({ message: "Batch cancelled", type: NOTIFICATION_TYPES.SUCCESS }));
        router.push(`/jw/${storeIdParam}/${outletIdParam}/products/physical_count/list`);
      } else {
        dispatch(showNotification({ message: res.data?.cancelPhysicalCount?.error || "Failed to cancel", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      const entries = allItems.map(item => ({
        countitemid: item.countitemid,
        countedqty: localQty[item.countitemid] !== "" ? parseFloat(localQty[item.countitemid] ?? "") : null,
        isskipped: localSkip[item.countitemid] ?? false,
        remarks: localRemarks[item.countitemid] || null,
      }));
      await saveItems({ variables: { input: { storeid: parsedStoreId, batchid: parsedBatchId, items: entries } } });
      dispatch(showNotification({ message: "Progress saved", type: NOTIFICATION_TYPES.SUCCESS }));
      refetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Mark count as complete? All items must be counted or skipped.")) return;
    setCompleting(true);
    try {
      await handleSaveProgress();
      const res = await completeCount({ variables: { storeid: parsedStoreId, batchid: parsedBatchId } });
      if (res.data?.completeCount?.success) {
        dispatch(showNotification({ message: "Count completed — moved to Review", type: NOTIFICATION_TYPES.SUCCESS }));
        router.push(`/jw/${storeIdParam}/${outletIdParam}/products/physical_count/${batchId}/review`);
      } else {
        dispatch(showNotification({ message: res.data?.completeCount?.error || "Failed", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setCompleting(false);
    }
  };

  const filteredItems = allItems.filter(item => {
    if (showUncountedOnly) {
      const qty = localQty[item.countitemid];
      const skip = localSkip[item.countitemid];
      if ((qty !== "" && qty !== undefined) || skip) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (item.itemcode ?? "").toLowerCase().includes(q) ||
        (item.itemdescription ?? "").toLowerCase().includes(q) ||
        (item.itemlocation ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countedCount = allItems.filter(i => {
    const qty = localQty[i.countitemid];
    return (qty !== "" && qty !== undefined) || localSkip[i.countitemid];
  }).length;

  const allDone = allItems.length > 0 && countedCount === allItems.length;

  if (batchLoading || itemsLoading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}><div className="spinner-border spinner-border-sm" /></div>;
  }

  return (
    <div>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 10,
          backgroundColor: "var(--surface-card, #fff)",
          borderBottom: "1px solid var(--border-subtle, #e2e8f0)",
          padding: "10px 16px",
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => router.push(`/jw/${storeIdParam}/${outletIdParam}/products/physical_count/list`)}
            >
              ← Back
            </button>
            <div>
              <h6 className="mb-0 fw-semibold">
                Count Entry — {batch?.batchnumber}
                <span className="ms-2 text-muted" style={{ fontSize: 12, fontWeight: 400 }}>
                  {batch?.warehousename} · {batch?.scope}
                </span>
              </h6>
            </div>
          </div>
          <CountProgressBar counted={countedCount} total={allItems.length} />
        </div>

        {/* Filter bar */}
        <div className="d-flex flex-wrap gap-2 mt-2">
          <input
            className="form-control form-control-sm"
            style={{ width: 200 }}
            placeholder="Search item…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="form-check d-flex align-items-center gap-1 ms-1">
            <input
              type="checkbox"
              className="form-check-input"
              id="uncounted"
              checked={showUncountedOnly}
              onChange={e => setShowUncountedOnly(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="uncounted" style={{ fontSize: 12 }}>Uncounted only</label>
          </div>

          {/* Scan mode toggle */}
          {!isReadOnly && (
            <div className="btn-group btn-group-sm ms-auto">
              <button
                className={`btn ${scanMode === "auto" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setScanMode("auto")}
                title="PC items: each scan = +1"
                style={{ fontSize: 11 }}
              >
                PC / Auto
              </button>
              <button
                className={`btn ${scanMode === "manual" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setScanMode("manual")}
                title="Weight items: prompt qty on scan"
                style={{ fontSize: 11 }}
              >
                Qty / Manual
              </button>
            </div>
          )}

          {!isReadOnly && (
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setShowScanner(true)}
            >
              <Camera size={13} />
              Scan
            </button>
          )}
        </div>
      </div>

      {/* Mobile layout: cards */}
      <div className="d-md-none p-2">
        {filteredItems.map(item => {
          const isHighlighted = highlightedId === item.countitemid;
          const scanCount = scanCounts[item.countitemid];
          return (
            <div
              key={item.countitemid}
              ref={el => { rowRefs.current[item.countitemid] = el; }}
              className="card mb-2"
              style={{
                border: isHighlighted ? "2px solid #6366f1" : "1px solid var(--border-subtle)",
                transition: "border-color 0.3s",
                backgroundColor: isHighlighted ? "#f0f0ff" : undefined,
              }}
            >
              <div className="card-body py-2 px-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.itemcode}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.itemdescription}</div>
                    {item.itemlocation && (
                      <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: 10 }}>
                        {item.itemlocation}
                      </span>
                    )}
                  </div>
                  {!batch?.blindcount && (
                    <div className="text-end" style={{ fontSize: 11, color: "#94a3b8", minWidth: 60 }}>
                      <div>Book: {item.bookqty}</div>
                      {scanCount ? <div style={{ color: "#6366f1", fontWeight: 600 }}>Scanned: {scanCount}</div> : null}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2 mt-2 align-items-center">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-control"
                    style={{ height: 44, fontSize: 18, fontWeight: 600, maxWidth: 120 }}
                    placeholder="0"
                    value={localQty[item.countitemid] ?? ""}
                    disabled={localSkip[item.countitemid] || isReadOnly}
                    onChange={e => handleQtyChange(item.countitemid, e.target.value)}
                    onBlur={() => handleBlur(item.countitemid)}
                  />
                  <label className="d-flex align-items-center gap-1" style={{ fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={localSkip[item.countitemid] ?? false}
                      disabled={isReadOnly}
                      onChange={e => handleSkipChange(item.countitemid, e.target.checked)}
                    />
                    Skip
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop layout: table */}
      <div className="d-none d-md-block" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
        <table className="table table-sm table-hover mb-0" style={{ fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 5 }}>
            <tr style={{ fontSize: 11, color: "#64748b" }}>
              <th>Item Code</th>
              <th>Description</th>
              <th>Location</th>
              <th>Category</th>
              {!batch?.blindcount && <th style={{ textAlign: "right" }}>Book Qty</th>}
              <th style={{ width: 120 }}>Counted Qty</th>
              <th style={{ width: 60 }}>Skip</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const isHighlighted = highlightedId === item.countitemid;
              const scanCount = scanCounts[item.countitemid];
              return (
                <tr
                  key={item.countitemid}
                  ref={el => { rowRefs.current[item.countitemid] = el; }}
                  style={{
                    backgroundColor: isHighlighted ? "#f0f0ff" : undefined,
                    outline: isHighlighted ? "2px solid #6366f1" : undefined,
                    transition: "all 0.3s",
                  }}
                >
                  <td style={{ fontWeight: 600 }}>{item.itemcode}</td>
                  <td style={{ color: "#475569" }}>{item.itemdescription}</td>
                  <td><span style={{ fontSize: 11, color: "#94a3b8" }}>{item.itemlocation ?? "—"}</span></td>
                  <td style={{ color: "#64748b" }}>{item.categoryname}</td>
                  {!batch?.blindcount && (
                    <td style={{ textAlign: "right" }}>
                      {item.bookqty}
                      {scanCount ? <span style={{ color: "#6366f1", marginLeft: 6, fontSize: 11 }}>({scanCount} scanned)</span> : null}
                    </td>
                  )}
                  <td>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="form-control form-control-sm"
                      style={{ width: 90 }}
                      placeholder="0"
                      value={localQty[item.countitemid] ?? ""}
                      disabled={localSkip[item.countitemid] || isReadOnly}
                      onChange={e => handleQtyChange(item.countitemid, e.target.value)}
                      onBlur={() => handleBlur(item.countitemid)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={localSkip[item.countitemid] ?? false}
                      disabled={isReadOnly}
                      onChange={e => handleSkipChange(item.countitemid, e.target.checked)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>No items match the current filter.</div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      {!isReadOnly && (
        <div
          style={{
            position: "sticky", bottom: 0, zIndex: 10,
            backgroundColor: "var(--surface-card, #fff)",
            borderTop: "1px solid var(--border-subtle, #e2e8f0)",
            padding: "10px 16px",
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 12 }}>
                {countedCount} / {allItems.length} done
              </span>
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelling}
              >
                {cancelling ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={13} />}
                Cancel Batch
              </button>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={handleSaveProgress}
                disabled={saving}
              >
                {saving ? <span className="spinner-border spinner-border-sm" /> : <Save size={13} />}
                Save Progress
              </button>
              <button
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                onClick={handleComplete}
                disabled={!allDone || completing}
                title={allDone ? "Complete and move to Review" : "Count all items first"}
              >
                {completing ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle2 size={13} />}
                Complete Count →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode scanner modal */}
      <BarcodeScannerModal
        show={showScanner}
        items={allItems}
        onClose={() => setShowScanner(false)}
        onItemFound={item => {
          const fullItem = item as unknown as BatchItem;
          if (scanMode === "manual" || (fullItem.itemtype ?? "").toLowerCase() === "wt") {
            handleQtyEntry(fullItem);
          } else {
            handleItemFound(fullItem);
          }
        }}
        onQtyEntry={item => handleQtyEntry(item as unknown as BatchItem)}
      />

      {/* Qt / manual qty entry dialog */}
      {qtyDialogItem && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1060,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setQtyDialogItem(null)}
        >
          <div
            className="card"
            style={{ width: 300, padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{qtyDialogItem.itemcode}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>{qtyDialogItem.itemdescription}</div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Enter Quantity / Weight</label>
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              className="form-control"
              style={{ fontSize: 20, height: 50, fontWeight: 700 }}
              value={qtyDialogValue}
              onChange={e => setQtyDialogValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmQtyDialog(); }}
            />
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => setQtyDialogItem(null)}>Cancel</button>
              <button className="btn btn-sm btn-primary flex-fill" onClick={confirmQtyDialog}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel batch confirmation modal */}
      {showCancelConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1070,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => !cancelling && setShowCancelConfirm(false)}
        >
          <div
            className="card"
            style={{ width: 360, padding: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <XCircle size={20} color="#ef4444" />
              <h6 className="mb-0 fw-semibold">Cancel Batch?</h6>
            </div>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>
              You are about to cancel batch <strong>{batch?.batchnumber}</strong>.
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
              All count entries will be discarded and the batch cannot be reopened.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                Keep Counting
              </button>
              <button
                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                onClick={handleCancelBatch}
                disabled={cancelling}
              >
                {cancelling ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={13} />}
                Yes, Cancel Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountEntryPage;
