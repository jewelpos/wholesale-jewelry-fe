"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { REQUEST_RECOUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { RotateCcw } from "lucide-react";

interface Props {
  show: boolean;
  selectedIds: number[];
  batchId: number;
  onClose: () => void;
  onDone: () => void;
}

const RecountRequestModal = ({ show, selectedIds, batchId, onClose, onDone }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const [requestRecount] = useMutation(REQUEST_RECOUNT_MUTATION);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await requestRecount({
        variables: {
          storeid: parsedStoreId,
          batchid: batchId,
          countitemids: selectedIds,
        },
      });
      if (res.data?.requestRecount?.success) {
        dispatch(showNotification({
          message: `Recount requested for ${selectedIds.length} item(s)`,
          type: NOTIFICATION_TYPES.SUCCESS,
        }));
        onDone();
      } else {
        dispatch(showNotification({
          message: res.data?.requestRecount?.error || "Failed",
          type: NOTIFICATION_TYPES.ERROR,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setLoading(false);
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
      <div className="card" style={{ width: 400 }}>
        <div className="card-header d-flex align-items-center gap-2">
          <RotateCcw size={15} />
          <span className="fw-semibold">Request Recount</span>
        </div>
        <div className="card-body" style={{ fontSize: 13 }}>
          <p style={{ margin: 0 }}>
            Flag <strong>{selectedIds.length}</strong> selected item{selectedIds.length !== 1 ? "s" : ""} for
            recount. These items will be marked <span className="badge bg-warning text-dark">Recount</span> in
            the batch. A counter should physically recount them and enter revised quantities before approval.
          </p>
        </div>
        <div className="card-footer d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-sm btn-warning" onClick={handleConfirm} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-1" />Requesting…</> : "Flag for Recount"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecountRequestModal;
