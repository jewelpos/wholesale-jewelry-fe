"use client";

import React from "react";
import NewPaymentForm from "./NewPaymentForm";
import VoidPaymentForm from "./VoidPaymentForm";
import CreditAdjustmentForm from "./CreditAdjustmentForm";
import { useParams } from "next/navigation";
import { paymentModalTypes } from "@/lib/config/constants";
import { DollarSign, RefreshCw, XCircle } from "react-feather";

const MODAL_CONFIG = {
  payment: {
    title: "Apply Payment",
    subtitle: "Record a payment and allocate it to outstanding invoices",
    accent: "#3b82f6",
    bg: "#eff6ff",
    icon: <DollarSign size={18} />,
  },
  credit: {
    title: "Credit Adjustment",
    subtitle: "Apply a supplier credit invoice to reduce outstanding balances",
    accent: "#f59e0b",
    bg: "#fffbeb",
    icon: <RefreshCw size={18} />,
  },
  void: {
    title: "Void Payment",
    subtitle: "Reverse a previously recorded payment",
    accent: "#ef4444",
    bg: "#fef2f2",
    icon: <XCircle size={18} />,
  },
};

const PaymentModal = ({
  setPaymentModal,
  paymentModal,
}: {
  setPaymentModal: (value: string) => void;
  paymentModal: string;
}) => {
  const { storeId: storeIdParam, outletId } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const isPayment = paymentModal.includes(paymentModalTypes.add_supplier_payment);
  const isVoid    = paymentModal.includes(paymentModalTypes.add_void_payment);
  const isCredit  = paymentModal.includes(paymentModalTypes.add_credit_adjustment);

  const cfg = isPayment ? MODAL_CONFIG.payment : isVoid ? MODAL_CONFIG.void : MODAL_CONFIG.credit;

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal modal-dialog-scrollable">
        <div className="modal-content" style={{ borderRadius: 12, border: "none", overflow: "hidden" }}>

          {/* Accent stripe */}
          <div style={{ height: 4, background: cfg.accent }} />

          {/* Header */}
          <div className="modal-header border-0 pb-0" style={{ padding: "20px 24px 12px" }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 40, height: 40, background: cfg.bg, color: cfg.accent }}
              >
                {cfg.icon}
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 16, color: "#0f172a" }}>{cfg.title}</h5>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{cfg.subtitle}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymentModal("")}
              style={{
                background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
                padding: "4px 10px", fontSize: 12, color: "#64748b", cursor: "pointer", lineHeight: 1.5,
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: "16px 24px 24px" }}>
            {isPayment && (
              <NewPaymentForm storeId={parsedStoreId} outletId={parsedOutletId} closePaymentModal={() => setPaymentModal("")} />
            )}
            {isVoid && (
              <VoidPaymentForm storeId={parsedStoreId} closePaymentModal={() => setPaymentModal("")} />
            )}
            {isCredit && (
              <CreditAdjustmentForm storeId={parsedStoreId} outletId={parsedOutletId} closePaymentModal={() => setPaymentModal("")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
