"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X } from "react-feather";
import SupplierInvoiceForm from "./SupplierInvoiceForm";

const SupplierInvoiceFormModal = ({
  setShowInvoiceFormModal,
  supplierinvoiceid,
  handleRefreshInvoice,
  readOnly,
}: {
  setShowInvoiceFormModal: (value: boolean) => void;
  supplierinvoiceid?: number;
  handleRefreshInvoice?: () => void;
  readOnly?: boolean;
}) => {
  const title = readOnly ? "View AP Invoice" : supplierinvoiceid ? "Edit AP Invoice" : "New AP Invoice";

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050 }}
        onClick={() => setShowInvoiceFormModal(false)}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(860px, 96vw)", maxHeight: "90vh",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
          color: "#fff", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 11, color: "#bbf7d0", marginTop: 2 }}>Accounts Payable</div>
          </div>
          <button
            onClick={() => setShowInvoiceFormModal(false)}
            style={{ background: "none", border: "none", color: "#bbf7d0", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: "auto", padding: "20px 24px 0", flex: 1 }}>
          <SupplierInvoiceForm
            setShowInvoiceFormModal={setShowInvoiceFormModal}
            supplierinvoiceid={supplierinvoiceid}
            handleRefreshInvoice={handleRefreshInvoice}
            readOnly={readOnly}
          />
        </div>
      </div>
    </>,
    document.body
  );
};

export default SupplierInvoiceFormModal;
