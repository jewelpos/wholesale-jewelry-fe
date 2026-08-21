"use client";

import React from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { X } from "react-feather";
import { AccountsExpenseListType } from "@/types/accounts";
import { getStatusColor } from "../../grid/StatusPillRenderer";

interface Props {
  data: AccountsExpenseListType;
  onClose: () => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, color: "#1e293b" }}>{children || "—"}</div>
  </div>
);

const ExpenseViewModal: React.FC<Props> = ({ data, onClose }) => {
  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050 }} onClick={onClose} />

      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(600px, 96vw)", maxHeight: "90vh", overflowY: "auto",
          background: "#fff", borderRadius: 12, zIndex: 1055,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#0f172a", color: "#fff" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Expense Detail</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>#{data.expenseid}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Row label="Expense Code">{data.accountdescription}</Row>
            <Row label="Amount">{Number(data.expenseamount || 0).toFixed(2)}</Row>
            <Row label="Date">{data.expensedate ? dayjs(data.expensedate).format("MM/DD/YYYY") : ""}</Row>
            <Row label="Paymode">{data.expensemode}</Row>
            <Row label="Status">
              {data.approvalstatus && (
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 10,
                    fontSize: 11, fontWeight: 600, lineHeight: 1.6, whiteSpace: "nowrap",
                    background: getStatusColor(data.approvalstatus).bg,
                    color: getStatusColor(data.approvalstatus).text,
                  }}
                >
                  {data.approvalstatus}
                </span>
              )}
            </Row>
            <Row label="Warehouse">{data.warehousename}</Row>
            <Row label="Check / Reference Number">{data.expensechknumber}</Row>
            <Row label="Created By">{data.createdby}</Row>
            <Row label="Approved By">{data.approvedby}</Row>
            <Row label="Approved Date">{data.approveddate ? dayjs(data.approveddate).format("MM/DD/YYYY HH:mm") : ""}</Row>
            <Row label="Last Modified By">{data.modifiedby}</Row>
            <Row label="Last Modified Date">{data.lastmodifieddate ? dayjs(data.lastmodifieddate).format("MM/DD/YYYY HH:mm") : ""}</Row>
          </div>
          <Row label="Detail">{data.expensedetail}</Row>
          <Row label="Notes">{data.expensenotes}</Row>
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 6,
              background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ExpenseViewModal;
