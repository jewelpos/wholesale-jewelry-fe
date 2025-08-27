"use client";

import React from "react";
import NewPaymentForm from "./NewPaymentForm";
import VoidPaymentForm from "./VoidPaymentForm";
import CreditAdjustmentForm from "./CreditAdjustmentForm";
import { useParams } from "next/navigation";
import { paymentModalTypes } from "@/lib/config/constants";

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

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0 custom-modal-header">
            <div className="page-title">
              <h4>
                {paymentModal.includes(paymentModalTypes.add_supplier_payment)
                  ? "Apply Payment"
                  : "Credit Adjustment"}
              </h4>
            </div>
            <button
              type="button"
              className="close"
              onClick={() => setPaymentModal("")}
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <div className="modal-body custom-modal-body pt-0 modal-min-height">
            {paymentModal.includes(paymentModalTypes.add_supplier_payment) && (
              <NewPaymentForm
                storeId={parsedStoreId}
                outletId={parsedOutletId}
                closePaymentModal={() => setPaymentModal("")}
              />
            )}
            {paymentModal.includes(paymentModalTypes.add_void_payment) && (
              <VoidPaymentForm
                storeId={parsedStoreId}
                closePaymentModal={() => setPaymentModal("")}
              />
            )}
            {paymentModal.includes(paymentModalTypes.add_credit_adjustment) && (
              <CreditAdjustmentForm
                storeId={parsedStoreId}
                closePaymentModal={() => setPaymentModal("")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
