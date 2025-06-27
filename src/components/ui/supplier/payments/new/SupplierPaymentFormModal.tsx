"use client";

import React from "react";

interface SupplierPaymentFormModalProps {
  setShowPaymentFormModal: (show: boolean) => void;
}

export default function SupplierPaymentFormModal({
  setShowPaymentFormModal,
}: SupplierPaymentFormModalProps) {
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Add Payment</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowPaymentFormModal(false)}
                >
                  <span aria-hidden="true">X</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body modal-height">
                {/* Payment form will be added here */}
                <div>Payment form content will go here</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
