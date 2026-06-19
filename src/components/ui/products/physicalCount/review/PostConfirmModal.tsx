"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { POST_PHYSICAL_COUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { AlertTriangle, ClipboardCheck } from "lucide-react";

interface BatchItem {
  countitemid: number;
  itemcode: string | null;
  itemdescription: string | null;
  variance: number | null;
  variancecost: number | null;
  isskipped: boolean;
  finalqty: number | null;
}

interface Batch {
  batchid: number;
  batchnumber: string;
  warehousename?: string;
  countstatus: string;
}

interface Props {
  show: boolean;
  batch: Batch | null;
  items: BatchItem[];
  onClose: () => void;
  onPosted: () => void;
}

const currFmt = (v: number | null | undefined) =>
  v == null ? "0.00" : Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PostConfirmModal = ({ show, batch, items, onClose, onPosted }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const [posting, setPosting] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [postCount] = useMutation(POST_PHYSICAL_COUNT_MUTATION);

  const itemsWithVariance = items.filter(i => !i.isskipped && i.variance !== null && i.variance !== 0);
  const totalLoss = items.reduce((s, i) => s + (i.variancecost != null && i.variancecost < 0 ? i.variancecost : 0), 0);
  const totalGain = items.reduce((s, i) => s + (i.variancecost != null && i.variancecost > 0 ? i.variancecost : 0), 0);
  const skippedCount = items.filter(i => i.isskipped).length;

  const handlePost = async () => {
    setPosting(true);
    try {
      const res = await postCount({
        variables: {
          input: {
            storeid: parsedStoreId,
            batchid: batch?.batchid,
            remarks: remarks || null,
          },
        },
      });
      if (res.data?.postPhysicalCount?.success) {
        dispatch(showNotification({
          message: `Adjustments posted — ${res.data.postPhysicalCount.message || "Stock updated"}`,
          type: NOTIFICATION_TYPES.SUCCESS,
        }));
        onPosted();
      } else {
        dispatch(showNotification({
          message: res.data?.postPhysicalCount?.error || "Post failed",
          type: NOTIFICATION_TYPES.ERROR,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setPosting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1060,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div className="card" style={{ width: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="card-header d-flex align-items-center gap-2">
          <ClipboardCheck size={16} />
          <span className="fw-semibold">Confirm Post Adjustments</span>
        </div>
        <div className="card-body">
          <div className="alert alert-warning d-flex gap-2 align-items-start" style={{ fontSize: 13 }}>
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              This will permanently update stock quantities for all counted items in
              <strong> {batch?.warehousename}</strong>. This action <strong>cannot be undone</strong>.
            </div>
          </div>

          <div className="row g-2 mb-3" style={{ fontSize: 13 }}>
            <div className="col-6">
              <div className="border rounded p-2 text-center">
                <div style={{ fontWeight: 700, fontSize: 20, color: "#6366f1" }}>{itemsWithVariance.length}</div>
                <div style={{ color: "#64748b" }}>Items to adjust</div>
              </div>
            </div>
            <div className="col-6">
              <div className="border rounded p-2 text-center">
                <div style={{ fontWeight: 700, fontSize: 20, color: "#94a3b8" }}>{skippedCount}</div>
                <div style={{ color: "#64748b" }}>Skipped (no adjust)</div>
              </div>
            </div>
            <div className="col-6">
              <div className="border rounded p-2 text-center">
                <div style={{ fontWeight: 700, fontSize: 18, color: "#ef4444" }}>-${currFmt(totalLoss)}</div>
                <div style={{ color: "#64748b" }}>Shrinkage Cost</div>
              </div>
            </div>
            <div className="col-6">
              <div className="border rounded p-2 text-center">
                <div style={{ fontWeight: 700, fontSize: 18, color: "#10b981" }}>+${currFmt(totalGain)}</div>
                <div style={{ color: "#64748b" }}>Overage Cost</div>
              </div>
            </div>
          </div>

          {itemsWithVariance.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: "auto", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, marginBottom: 12 }}>
              <table className="table table-sm table-hover mb-0">
                <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", fontSize: 11 }}>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Counted</th>
                    <th style={{ textAlign: "right" }}>Variance</th>
                    <th style={{ textAlign: "right" }}>Cost $</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithVariance.map(item => (
                    <tr key={item.countitemid}>
                      <td>{item.itemcode} <span style={{ color: "#94a3b8" }}>{item.itemdescription}</span></td>
                      <td style={{ textAlign: "right" }}>{item.finalqty ?? "—"}</td>
                      <td style={{ textAlign: "right", color: (item.variance ?? 0) < 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                        {(item.variance ?? 0) > 0 ? "+" : ""}{item.variance}
                      </td>
                      <td style={{ textAlign: "right", color: (item.variancecost ?? 0) < 0 ? "#ef4444" : "#10b981" }}>
                        {(item.variancecost ?? 0) > 0 ? "+" : ""}{currFmt(item.variancecost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Post Remarks (optional)</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="e.g. Year-end count audit…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={posting}>
            Cancel
          </button>
          <button className="btn btn-sm btn-danger" onClick={handlePost} disabled={posting}>
            {posting ? <><span className="spinner-border spinner-border-sm me-1" />Posting…</> : "Post Adjustments"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostConfirmModal;
