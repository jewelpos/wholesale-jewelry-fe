"use client";

import React, { useState } from "react";
import ButtonLoader from "@/components/ui/ButtonLoader";

type Props = {
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  loading?: boolean;
};

const CancelTransferModal = ({ onClose, onConfirm, loading }: Props) => {
  const [remarks, setRemarks] = useState("");
  const trimmed = remarks.trim();

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 custom-modal-header">
            <div className="page-title">
              <h4>Cancel Transfer Request</h4>
            </div>
            <button type="button" className="close" onClick={onClose}>
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <div className="modal-body custom-modal-body pt-0">
            <div className="input-blocks mb-0">
              <label className="form-label">
                Cancellation Reason <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={remarks}
                autoFocus
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Why is this transfer request being cancelled?"
              />
            </div>
          </div>
          <div className="modal-footer border-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <ButtonLoader
              type="button"
              loading={!!loading}
              btnText="Confirm Cancel"
              loadingText="Cancelling..."
              className="btn btn-danger"
              disabled={!trimmed}
              onClick={() => onConfirm(trimmed)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelTransferModal;
