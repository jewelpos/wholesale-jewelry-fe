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
        <Link
          className="p-1"
          href={`${basePath}/sales/memo/${data.memonumber}/edit`}
          scroll={false}
          title="Edit"
        >
          <Edit size={14} className="feather-edit" />
        </Link>
      </div>
    </div>
  );
};

export default MemoActions;
