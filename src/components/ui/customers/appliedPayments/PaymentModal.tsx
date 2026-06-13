"use client";

import React from "react";
import { useParams } from "next/navigation";
import { paymentModalTypes } from "@/lib/config/constants";
import NewPaymentForm from "./NewPaymentForm";
import CreditAdjustmentForm from "./CreditAdjustmentForm";
import VoidCustomerPaymentForm from "./VoidCustomerPaymentForm";
import { CustomerPaymentListType } from "@/types/customer";

const PaymentModal = ({
  setPaymentModal,
  paymentModal,
  voidRow,
}: {
  setPaymentModal: (value: string) => void;
  paymentModal: string;
  voidRow?: CustomerPaymentListType | null;
}) => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

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
                {paymentModal.includes(paymentModalTypes.add_customer_payment)
                  ? "Apply Payment"
                  : paymentModal.includes(paymentModalTypes.add_void_payment)
                    ? "Void Payment"
                    : "Credit Adjustment"}
              </h4>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setPaymentModal("")}
            />
          </div>
          <div className="modal-body custom-modal-body pt-0 modal-min-height">
            {paymentModal.includes(paymentModalTypes.add_customer_payment) && (
              <NewPaymentForm
                storeId={parsedStoreId}
                outletId={parsedOutletId}
                closePaymentModal={() => setPaymentModal("")}
              />
            )}
            {(paymentModal.includes(paymentModalTypes.add_credit_adjustment) ||
              paymentModal.includes(
                paymentModalTypes.add_invoice_credit_payment
              )) && (
              <CreditAdjustmentForm
                storeId={parsedStoreId}
                outletId={parsedOutletId}
                startWithCreditTypeSelection={paymentModal.includes(
                  paymentModalTypes.add_invoice_credit_payment
                )}
                closePaymentModal={() => setPaymentModal("")}
              />
            )}

            {paymentModal.includes(paymentModalTypes.add_void_payment) &&
              voidRow && (
                <VoidCustomerPaymentForm
                  storeId={parsedStoreId}
                  closePaymentModal={() => setPaymentModal("")}
                  customerpaymentid={voidRow.customerpaymentid}
                  transactionno={voidRow.transactionno}
                  custcompanyname={voidRow.custcompanyname}
                  amountpaid={voidRow.amountpaid}
                  paymode={voidRow.paymode}
                  paymentdate={voidRow.paymentdate}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
