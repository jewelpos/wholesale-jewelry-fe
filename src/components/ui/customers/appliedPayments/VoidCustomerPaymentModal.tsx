"use client";

import React from "react";
import VoidCustomerPaymentForm from "./VoidCustomerPaymentForm";

const VoidCustomerPaymentModal = ({
  setShowVoidModal,
  storeId,
  customerpaymentid,
  transactionno,
  custcompanyname,
}: {
  setShowVoidModal: (value: boolean) => void;
  storeId: number;
  customerpaymentid: number;
  transactionno: string;
  custcompanyname: string;
}) => {
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0 custom-modal-header">
            <div className="page-title">
              <h4>Void Payment</h4>
            </div>
            <button
              type="button"
              className="close"
              onClick={() => setShowVoidModal(false)}
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <div className="modal-body custom-modal-body pt-0 modal-min-height">
            <div className="card table-list-card mb-0">
              <div className="card-body modal-default-height pb-0">
                <VoidCustomerPaymentForm
                  storeId={storeId}
                  closePaymentModal={() => setShowVoidModal(false)}
                  customerpaymentid={customerpaymentid}
                  transactionno={transactionno}
                  custcompanyname={custcompanyname}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoidCustomerPaymentModal;
