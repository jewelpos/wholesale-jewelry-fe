"use client";

import React from "react";
import { ICellRendererParams } from "ag-grid-community";

const STATUS_MAP: { keywords: string[]; bg: string; text: string }[] = [
  { keywords: ["paid", "complete", "fulfilled", "invoiced", "shipped", "picked", "closed", "ready"], bg: "var(--status-paid-bg)",      text: "var(--status-paid-text)" },
  { keywords: ["partial"],                                                                            bg: "var(--status-partial-bg)",   text: "var(--status-partial-text)" },
  { keywords: ["open", "pending", "active", "confirmed"],                                            bg: "var(--status-open-bg)",      text: "var(--status-open-text)" },
  { keywords: ["hold"],                                                                               bg: "var(--status-hold-bg)",      text: "var(--status-hold-text)" },
  { keywords: ["void", "refund", "cancel", "return", "reject"],                                      bg: "var(--status-void-bg)",      text: "var(--status-void-text)" },
  { keywords: ["backorder", "back order"],                                                            bg: "var(--status-backorder-bg)", text: "var(--status-backorder-text)" },
];

export function getStatusColor(status: string): { bg: string; text: string } {
  const lower = status.toLowerCase();
  for (const entry of STATUS_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return { bg: entry.bg, text: entry.text };
    }
  }
  return { bg: "var(--status-default-bg)", text: "var(--status-default-text)" };
}

const StatusPillRenderer: React.FC<ICellRendererParams> = (params) => {
  if (params.node.rowPinned || !params.value) return null;
  const { bg, text } = getStatusColor(String(params.value));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: text,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {params.value}
    </span>
  );
};

export default StatusPillRenderer;
