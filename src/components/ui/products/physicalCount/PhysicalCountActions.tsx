"use client";

import React from "react";
import Link from "next/link";
import { Eye, ClipboardList, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { CANCEL_PHYSICAL_COUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";

interface RowData {
  batchid: number;
  batchnumber: string;
  countstatus: string;
}

const PhysicalCountActions = ({ data, onRefresh }: { data: RowData; onRefresh?: () => void }) => {
  const params = useParams();
  const storeId = params.storeId as string;
  const outletId = params.outletId as string;
  const dispatch = useAppDispatch();
  const [cancelBatch] = useMutation(CANCEL_PHYSICAL_COUNT_MUTATION);

  const base = `/jw/${storeId}/${outletId}/products/physical_count`;
  const status = (data.countstatus ?? "").toUpperCase();
  const isPosted = status === "POSTED";
  const isCancelled = status === "CANCELLED";
  const isActive = status === "OPEN" || status === "REVIEW" || status === "APPROVED";

  const handleCancel = async () => {
    if (!confirm(`Cancel batch ${data.batchnumber}? This cannot be undone.`)) return;
    try {
      const res = await cancelBatch({ variables: { storeid: parseInt(storeId), batchid: data.batchid } });
      if (res.data?.cancelPhysicalCount?.success) {
        dispatch(showNotification({ message: "Batch cancelled", type: NOTIFICATION_TYPES.SUCCESS }));
        onRefresh?.();
      }
    } catch {
      dispatch(showNotification({ message: "Cancel failed", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div className="action-table-data">
      {isPosted || isCancelled ? (
        <Link href={`${base}/${data.batchid}/view`} title="View">
          <Eye size={14} />
        </Link>
      ) : (
        <Link href={`${base}/${data.batchid}/count`} title="Count">
          <ClipboardList size={14} />
        </Link>
      )}
      {isActive && (
        <span
          title="Cancel"
          style={{ cursor: "pointer", color: "#ef4444" }}
          onClick={handleCancel}
        >
          <XCircle size={14} />
        </span>
      )}
    </div>
  );
};

export default PhysicalCountActions;
