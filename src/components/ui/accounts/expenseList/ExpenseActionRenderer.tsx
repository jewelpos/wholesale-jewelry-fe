import { ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import React from "react";
import { Edit, CheckCircle, XCircle, Eye, DollarSign } from "react-feather";
import { AccountsExpenseListType } from "@/types/accounts";

export interface ExpenseActionCellRendererParams extends ICellRendererParams<AccountsExpenseListType> {
  onView: (data: AccountsExpenseListType) => void;
  onEdit: (data: AccountsExpenseListType) => void;
  onApprove: (data: AccountsExpenseListType) => void;
  onReject: (data: AccountsExpenseListType) => void;
  onPaid: (data: AccountsExpenseListType) => void;
}

const disabledStyle: React.CSSProperties = { opacity: 0.3, cursor: "not-allowed", pointerEvents: "none" };

const ExpenseActionRenderer = ({ data, onView, onEdit, onApprove, onReject, onPaid }: ExpenseActionCellRendererParams) => {
  if (!data) return null;

  const status = (data.approvalstatus || "").toLowerCase();
  const isPending = status === "pending";
  const isApproved = status === "approved";

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>

        <Link className="me-2 p-2" href="#" onClick={() => onView(data)} scroll={false} title="View">
          <Eye className="feather-view" />
        </Link>

        <Link
          className="me-2 p-2"
          href="#"
          onClick={() => isPending && onEdit(data)}
          scroll={false}
          title={isPending ? "Edit" : "Only pending expenses can be edited"}
          style={isPending ? undefined : disabledStyle}
        >
          <Edit className="feather-edit" />
        </Link>

        <Link
          className="me-2 p-2"
          href="#"
          onClick={() => isPending && onApprove(data)}
          scroll={false}
          title={isPending ? "Approve" : "Only pending expenses can be approved"}
          style={isPending ? undefined : disabledStyle}
        >
          <CheckCircle size={14} style={{ color: "#28a745" }} />
        </Link>

        <Link
          className="confirm-text me-2 p-2"
          href="#"
          onClick={() => isPending && onReject(data)}
          scroll={false}
          title={isPending ? "Reject" : "Only pending expenses can be rejected"}
          style={isPending ? undefined : disabledStyle}
        >
          <XCircle size={14} style={{ color: "#dc3545" }} />
        </Link>

        <Link
          className="p-2"
          href="#"
          onClick={() => isApproved && onPaid(data)}
          scroll={false}
          title={isApproved ? "Mark as Paid" : "Only approved expenses can be marked paid"}
          style={isApproved ? undefined : disabledStyle}
        >
          <DollarSign size={14} style={{ color: "#0d6efd" }} />
        </Link>
      </div>
    </div>
  );
};

export default ExpenseActionRenderer;
