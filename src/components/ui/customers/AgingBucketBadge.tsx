"use client";

import React from "react";

export type InvoiceAgingRow = {
  invoicenumber: number;
  salemodeid: number | null;
  saledate: string | null;
  netamount: number;
  balancedue: number;
  daysoverdue: number;
  agingbucket: string;
};

// Same bucket boundaries as vw_customer_balance_aging_report (0-30/31-60/61-90/91-120/120+),
// computed server-side in getCustomerInvoiceAging — this is display-only.
const bucketStyle = (bucket: string) => {
  switch (bucket) {
    case "0-30":
      return { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
    case "31-60":
      return { bg: "#fef3c7", border: "#fde68a", color: "#92400e" };
    case "61-90":
      return { bg: "#ffedd5", border: "#fdba74", color: "#9a3412" };
    case "91-120":
      return { bg: "#fee2e2", border: "#fca5a5", color: "#991b1b" };
    default:
      return { bg: "#fecaca", border: "#f87171", color: "#7f1d1d" }; // 120+
  }
};

export const AgingBucketBadge = ({ bucket }: { bucket: string }) => {
  const s = bucketStyle(bucket);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {bucket} days
    </span>
  );
};

export const SALEMODE_DOC_LABEL: Record<number, string> = {
  2: "Invoice",
  5: "Credit Invoice",
  6: "Memo",
  8: "Credit Memo",
};
