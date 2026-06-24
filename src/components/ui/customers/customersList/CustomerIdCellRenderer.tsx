"use client";

import React from "react";
import { ICellRendererParams } from "ag-grid-community";
import { CustomersListType } from "@/types/customer";

const NEW_DAYS = 30;

function isNewCustomer(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const ts = new Date(dateStr).getTime();
  if (isNaN(ts)) return false;
  return Date.now() - ts < NEW_DAYS * 24 * 60 * 60 * 1000;
}

const CustomerIdCellRenderer = (params: ICellRendererParams<CustomersListType>) => {
  const data = params.data;
  if (!data) return null;

  const isNew = isNewCustomer(data.custregistrationdate);

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", gap: 5 }}>
      <span style={{ fontSize: 12 }}>{data.customerid}</span>
      {isNew && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
          color: "#fff", background: "#22c55e",
          borderRadius: 3, padding: "1px 4px", lineHeight: "14px",
          flexShrink: 0, textTransform: "uppercase",
        }}>
          NEW
        </span>
      )}
    </div>
  );
};

export default CustomerIdCellRenderer;
