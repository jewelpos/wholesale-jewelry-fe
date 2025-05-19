import React, { useState } from "react";
import SelectMonth from "../forms/SelectMonth";

const PrintModal = ({
  children,
  setShowPrintModal,
}: {
  children: React.ReactNode;
  setShowPrintModal: (value: boolean) => void;
}) => {
  const [month, setMonth] = useState<number | null>(null);
  const [showAll, setShowAll] = useState<boolean>(true);
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Print Customer Statement</h4>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowPrintModal(false)}
            />
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">{children}</div>
              <div className="col-md-6">
                <div className="border p-3 rounded shadow-sm">
                  <h6 className="text-primary fw-bold mb-3">
                    Statement Period
                  </h6>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Quick Date Set</label>
                    <div className="d-flex align-items-center gap-2">
                      <SelectMonth
                        value={month}
                        onChange={setMonth}
                        className="form-select form-select-sm"
                        trigger={() => {}}
                        disableField={showAll}
                      />
                      <div className="form-check form-check-md ">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={showAll}
                          onChange={(e) => setShowAll(e.target.checked)}
                        />
                      </div>
                      <label className="form-label">Show all</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">From :</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      defaultValue="2025-05-01"
                      disabled={showAll}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Period ending :
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      defaultValue="2025-05-31"
                      disabled={showAll}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includeInvoices"
                        defaultChecked
                        disabled={showAll}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="includeInvoices"
                      >
                        Include paid invoices
                      </label>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includeInvoices"
                        defaultChecked
                        disabled={showAll}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="includeInvoices"
                      >
                        Include payments
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-3 mt-3 text-center">
              <button className="btn btn-primary btn-w-lg" type="button">
                <i data-feather="printer" className="feather-printer me-2" />
                Print Statement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;
