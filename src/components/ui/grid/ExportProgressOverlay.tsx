"use client";

import React from "react";
import { createPortal } from "react-dom";

interface ExportProgressOverlayProps {
  fetched: number;
  total: number;
}

const ExportProgressOverlay = ({ fetched, total }: ExportProgressOverlayProps) => {
  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="bg-white rounded shadow-lg d-flex flex-column align-items-center"
        style={{ padding: "2rem 2.5rem", gap: 16, minWidth: 320 }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: 52, height: 52, borderWidth: 5 }}
          role="status"
        />
        <div className="fw-semibold" style={{ fontSize: 17 }}>Exporting…</div>
        <div className="text-muted small">
          {total > 0
            ? `Fetched ${fetched.toLocaleString()} of ${total.toLocaleString()} rows…`
            : "Preparing export…"}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ExportProgressOverlay;
