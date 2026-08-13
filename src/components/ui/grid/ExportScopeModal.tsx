"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Filter, Database } from "react-feather";

interface ExportScopeModalProps {
  onClose: () => void;
  onExportFiltered: () => void;
  onExportAll: () => void;
}

const ExportScopeModal = ({ onClose, onExportFiltered, onExportAll }: ExportScopeModalProps) => {
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
      <div className="bg-white rounded shadow-lg" style={{ width: "100%", maxWidth: 440 }}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h6 className="mb-0 fw-semibold">Export Data</h6>
          <button type="button" onClick={onClose} className="btn btn-link p-0" style={{ lineHeight: 0 }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-3 d-flex flex-column gap-2">
          <p className="text-muted small mb-1">
            You have filters applied. What would you like to export?
          </p>
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2 text-start"
            onClick={onExportFiltered}
          >
            <Filter size={16} />
            <span>
              <div className="fw-semibold">Export filtered results</div>
              <div className="small text-muted">Only rows matching your current filters</div>
            </span>
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2 text-start"
            onClick={onExportAll}
          >
            <Database size={16} />
            <span>
              <div className="fw-semibold">Export everything</div>
              <div className="small text-muted">All rows, ignoring current filters</div>
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ExportScopeModal;
