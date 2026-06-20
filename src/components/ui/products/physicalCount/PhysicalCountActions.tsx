"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, ClipboardList, XCircle, Download } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useLazyQuery } from "@apollo/client";
import { CANCEL_PHYSICAL_COUNT_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import { GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY } from "@/lib/graphql/query/physicalcount";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";

interface RowData {
  batchid: number;
  batchnumber: string;
  countstatus: string;
  warehousename?: string;
  countdate?: string;
}

const fmt = (v: number | null | undefined) =>
  v == null ? "" : Number(v).toFixed(4).replace(/\.?0+$/, "");

const exportToCSV = (batchnumber: string, items: Record<string, unknown>[]) => {
  const headers = [
    "Item Code", "Description", "Category", "Sub-Category", "Location",
    "Type", "Book Qty", "Counted Qty", "Final Qty", "Variance",
    "Unit Cost", "Variance Cost $", "Recount?", "Skipped?", "Remarks",
  ];
  const rows = items.map(i => [
    i.itemcode ?? "",
    i.itemdescription ?? "",
    i.categoryname ?? "",
    i.subcategoryname ?? "",
    i.itemlocation ?? "",
    i.itemtype ?? "",
    fmt(i.bookqty as number),
    fmt(i.countedqty as number),
    fmt(i.finalqty as number),
    fmt(i.variance as number),
    fmt(i.bookcost as number),
    fmt(i.variancecost as number),
    i.isrecountneeded ? "Yes" : "No",
    i.isskipped ? "Yes" : "No",
    i.remarks ?? "",
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `physical-count-${batchnumber}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const PhysicalCountActions = ({ data, onRefresh }: { data: RowData; onRefresh?: () => void }) => {
  const params = useParams();
  const storeId = params.storeId as string;
  const outletId = params.outletId as string;
  const dispatch = useAppDispatch();
  const [cancelBatch] = useMutation(CANCEL_PHYSICAL_COUNT_MUTATION);
  const [fetchItems] = useLazyQuery(GET_PHYSICAL_COUNT_BATCH_ITEMS_QUERY);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetchItems({
        variables: { storeid: parseInt(storeId), batchid: data.batchid },
        fetchPolicy: "network-only",
      });
      const items = res.data?.getPhysicalCountBatchItems ?? [];
      if (!items.length) {
        dispatch(showNotification({ message: "No items to export", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      exportToCSV(data.batchnumber, items);
      dispatch(showNotification({ message: `Exported ${items.length} items`, type: NOTIFICATION_TYPES.SUCCESS }));
    } catch {
      dispatch(showNotification({ message: "Export failed", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setExporting(false);
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
      <span
        title="Export CSV"
        style={{ cursor: exporting ? "wait" : "pointer", color: "#6366f1", opacity: exporting ? 0.5 : 1 }}
        onClick={exporting ? undefined : handleExport}
      >
        <Download size={14} />
      </span>
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
