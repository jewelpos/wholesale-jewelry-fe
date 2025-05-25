"use client";

import React from "react";
import SupplierInvoiceForm from "./SupplierInvoiceForm";

const SupplierInvoiceFormModal = ({
  setShowInvoiceFormModal,
  supplierinvoiceid,
  handleRefreshInvoice,
}: {
  setShowInvoiceFormModal: (value: boolean) => void;
  supplierinvoiceid?: number;
  handleRefreshInvoice?: () => void;
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
                  <h4>{supplierinvoiceid ? "Edit" : "Add"} Invoice</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowInvoiceFormModal(false)}
                >
                  <span aria-hidden="true">X</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body modal-height">
                <SupplierInvoiceForm
                  setShowInvoiceFormModal={setShowInvoiceFormModal}
                  supplierinvoiceid={supplierinvoiceid}
                  handleRefreshInvoice={handleRefreshInvoice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierInvoiceFormModal;
