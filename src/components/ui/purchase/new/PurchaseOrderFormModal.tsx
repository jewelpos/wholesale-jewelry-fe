"use client";

import React from "react";
import PurchaseOrderForm from "./PurchaseOrderForm";

const PurchaseOrderFormModal = ({
  setShowPurchaseOrderFormModal,
  ponumber,
  purchaseorderid,
  handleRefresh,
}: {
  setShowPurchaseOrderFormModal: (value: boolean) => void;
  ponumber?: number;
  purchaseorderid?: number;
  handleRefresh?: () => void;
}) => {
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal ">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>{ponumber ? "Edit" : "Add"} Purchase Order</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowPurchaseOrderFormModal(false)}
                >
                  <span aria-hidden="true">X</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body modal-height">
                <PurchaseOrderForm
                  ponumber={ponumber}
                  setShowPurchaseOrderFormModal={setShowPurchaseOrderFormModal}
                  handleRefresh={handleRefresh}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderFormModal;
