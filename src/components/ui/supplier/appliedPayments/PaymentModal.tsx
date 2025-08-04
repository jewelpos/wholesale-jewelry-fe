"use client";

import React, { useState } from "react";
import NewPaymentForm from "./NewPaymentForm";
import VoidPaymentForm from "./VoidPaymentForm";
import CreditAdjustmentForm from "./CreditAdjustmentForm";
import { useParams } from "next/navigation";

const PaymentModal = ({
  setShowPaymentModal,
}: {
  setShowPaymentModal: (value: boolean) => void;
}) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [selectedTab, setSelectedTab] = useState("new");
  const tabs = [
    { id: "new", title: "New Payment" },
    { id: "void", title: "Void Payment" },
    { id: "credit", title: "Credit Adjustment" },
  ];
  console.log("sas", selectedTab);

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0 custom-modal-header">
            <div className="page-title">
              <h4>Apply AP Payments</h4>
            </div>
            <button
              type="button"
              className="close"
              onClick={() => setShowPaymentModal(false)}
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <ul className="nav nav-pills justify-content-center mt-2">
            {tabs.map((tab) => (
              <li className="nav-item" role="presentation" key={tab.id}>
                <button
                  className={`nav-link ${
                    tab.id === selectedTab ? "active" : ""
                  }`}
                  id={tab.id + "-tab"}
                  data-bs-toggle="pill"
                  data-bs-target={`#${tab.id}`}
                  type="button"
                  role="tab"
                  aria-controls={tab.id}
                  aria-selected={tab.id === selectedTab}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  {tab.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="modal-body custom-modal-body pt-0 modal-min-height">
            <div className="tab-content" id="pills-tabContent">
              <div className="card table-list-card mb-0">
                <div className="card-body modal-default-height pb-0">
                  {selectedTab === "new" && (
                    <div
                      className={`tab-pane fade ${
                        selectedTab === "new" ? "show active" : ""
                      }`}
                    >
                      <NewPaymentForm
                        storeId={parsedStoreId}
                        closePaymentModal={() => setShowPaymentModal(false)}
                      />
                    </div>
                  )}
                  {selectedTab === "void" && (
                    <div
                      className={`tab-pane fade ${
                        selectedTab === "void" ? "show active" : ""
                      }`}
                    >
                      <VoidPaymentForm
                        storeId={parsedStoreId}
                        closePaymentModal={() => setShowPaymentModal(false)}
                      />
                    </div>
                  )}
                  {selectedTab === "credit" && (
                    <div
                      className={`tab-pane fade ${
                        selectedTab === "credit" ? "show active" : ""
                      }`}
                    >
                      <CreditAdjustmentForm
                        storeId={parsedStoreId}
                        closePaymentModal={() => setShowPaymentModal(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
