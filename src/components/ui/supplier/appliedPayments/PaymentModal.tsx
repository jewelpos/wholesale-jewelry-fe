"use client";

import React, { useState } from "react";
import NewPaymentForm from "./NewPaymentForm";
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
    {
      id: "new",
      title: "New Payment",
    },
    {
      id: "void",
      title: "Void Payment",
    },
    {
      id: "Credit adj",
      title: "Credit Adjustment",
    },
  ];
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
                  {tabs.map((tab) => (
                    <div
                      className={`tab-pane fade ${
                        tab.id === selectedTab ? "show active" : ""
                      }`}
                      id={tab.id}
                      role="tabpanel"
                      aria-labelledby={tab.id + "-tab"}
                      key={tab.id}
                    >
                      {tab.id === "new" && (
                        <NewPaymentForm
                          storeId={parsedStoreId}
                          closePaymentModal={() => setShowPaymentModal(false)}
                        />
                      )}
                      {/* {tab.id === "void" && <div>Void Payment</div>}
                          {tab.id === "Credit adj" && (
                            <div>Credit Adjustment</div>
                          )} */}
                    </div>
                  ))}
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
