"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardPlus } from "lucide-react";

const PhysicalCountListHeader = () => {
  const params = useParams();
  const storeId = params.storeId as string;
  const outletId = params.outletId as string;
  const base = `/jw/${storeId}/${outletId}/products/physical_count`;

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div>
        <h5 className="mb-0 fw-semibold">Physical Inventory Count</h5>
        <div className="text-muted" style={{ fontSize: 12 }}>Manage cycle count batches</div>
      </div>
      <div className="d-flex gap-2">
        <Link href={`${base}/new`} className="btn btn-sm btn-primary d-flex align-items-center gap-1">
          <ClipboardPlus size={14} />
          New Count
        </Link>
      </div>
    </div>
  );
};

export default PhysicalCountListHeader;
