"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { CustomerPaymentListType } from "@/types/customer";
import CustomerAppliedPaymentComponent from "./CustomerAppliedPaymentComponent";

interface Props {
  payment: CustomerPaymentListType | null;
  onClose: () => void;
}

const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const useWindowWidth = () => {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
};

const AppliedPaymentDetailDrawer = ({ payment, onClose }: Props) => {
  const windowWidth = useWindowWidth();
  const isTablet = windowWidth <= 1024;
  const isOpen = !!payment;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.25)",
          zIndex: 1040,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: isTablet ? "100vw" : "min(700px, 58vw)",
          background: "#fff",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
          zIndex: 1050,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {payment && (
          <>
            {/* header */}
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px" }}>
                    PAYMENT
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    Txn #{payment.transactionno}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 16,
                    color: "#64748b",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* info chips */}
              <div className="d-flex flex-wrap gap-3">
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>CUSTOMER</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{payment.custcompanyname || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>DATE</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    {payment.paymentdate ? dayjs(payment.paymentdate).format("MM/DD/YYYY") : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>MODE</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>{payment.paymode || "—"}</div>
                </div>
                {payment.checkcardno && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>REF / CHECK #</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{payment.checkcardno}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>AMOUNT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{fmt(payment.amountpaid)}</div>
                </div>
                {payment.voidpayment && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px", marginBottom: 2 }}>STATUS</div>
                    <span style={{
                      display: "inline-block",
                      padding: "1px 9px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#991b1b",
                    }}>
                      Voided
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* body — same applied-invoices detail content as before, just in a drawer now */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <CustomerAppliedPaymentComponent data={payment} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AppliedPaymentDetailDrawer;
