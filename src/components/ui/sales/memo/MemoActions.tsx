"use client";

import React from "react";
import Link from "next/link";
import { Edit, Eye } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { MemoSummary } from "@/types/sales";

interface MemoActionsProps {
  data: MemoSummary;
}

const MemoActions: React.FC<MemoActionsProps> = ({ data }) => {
  const { basePath } = useDefaultRoute();

  if (!data) return null;

  const canEdit =
    data.statusname !== "Shipped" &&
    data.statusname !== "Cancelled" &&
    Number(data.custcrediapplied) !== 1 &&
    Number(data.amountreceived) === 0;

  let editReason = "";
  if (!canEdit) {
    if (data.statusname === "Shipped")
      editReason = "Cannot edit: memo has been shipped";
    else if (data.statusname === "Cancelled")
      editReason = "Cannot edit: memo is cancelled";
    else if (Number(data.custcrediapplied) === 1)
      editReason = "Cannot edit: credit already applied";
    else if (Number(data.amountreceived) > 0)
      editReason = "Cannot edit: payment already received";
    else editReason = "Cannot edit in current status";
  }

  return (
    <div className="action-table-data">
      <div className="edit-delete-action" style={{ gap: "2px" }}>
        <Link
          className="p-1"
          href={`${basePath}/sales/memo/${data.memonumber}/view`}
          scroll={false}
          title="View"
        >
          <Eye size={14} />
        </Link>
        {canEdit ? (
          <Link
            className="p-1"
            href={`${basePath}/sales/memo/${data.memonumber}/edit`}
            scroll={false}
            title="Edit"
          >
            <Edit size={14} className="feather-edit" />
          </Link>
        ) : (
          <span
            className="p-1"
            title={editReason}
            style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}
          >
            <Edit size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
      </div>
    </div>
  );
};

export default MemoActions;
