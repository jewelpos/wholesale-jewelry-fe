"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, Eye, Mail, Printer, Trash2 } from "react-feather";
import { useMutation } from "@apollo/client";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { MemoSummary } from "@/types/sales";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";
import { DELETE_MEMO_MUTATION } from "@/lib/graphql/mutations/sales";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";

interface MemoActionsProps {
  data: MemoSummary;
  onDeleted?: () => void;
}

const MemoActions: React.FC<MemoActionsProps> = ({ data, onDeleted }) => {
  const { basePath } = useDefaultRoute();
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [deleteMemo] = useMutation(DELETE_MEMO_MUTATION);

  if (!data) return null;

  const isCreditMemo = data.salemodename === "Memo Credit";
  // deleteMemo stamps voiddate (and invoicestatusid=15 "Memo Cancelled", not the literal
  // string "Cancelled" a plain invoice gets) on a voided memo — check voiddate directly
  // rather than matching statusname, so this doesn't miss that distinct label.
  const isVoided = !!data.voiddate;

  const canEdit =
    !isCreditMemo &&
    !isVoided &&
    data.statusname !== "Shipped" &&
    Number(data.custcrediapplied) !== 1 &&
    Number(data.amountreceived) === 0 &&
    !data.isinvoiced &&
    !data.hascreditreturn;

  let editReason = "";
  if (!canEdit) {
    if (isCreditMemo) editReason = "Cannot edit: credit memos cannot be edited";
    else if (isVoided) editReason = "Cannot edit: memo is cancelled";
    else if (data.statusname === "Shipped") editReason = "Cannot edit: memo has been shipped";
    else if (Number(data.custcrediapplied) === 1) editReason = "Cannot edit: credit already applied";
    else if (Number(data.amountreceived) > 0) editReason = "Cannot edit: payment already received";
    else if (data.isinvoiced) editReason = "Cannot edit: memo has already been invoiced";
    else if (data.hascreditreturn) editReason = "Cannot edit: a credit memo has been created against this memo";
    else editReason = "Cannot edit in current status";
  }

  // Delete is a soft void (see deleteMemo on the backend), so it's only offered while the
  // memo is still fully open: not already voided, no invoice or credit created from it
  // yet (same isinvoiced/hascreditreturn signal as above), and never for a Credit Memo
  // document at all.
  const canDelete = !isCreditMemo && !isVoided && !data.isinvoiced && !data.hascreditreturn;

  let deleteReason = "";
  if (!canDelete) {
    if (isCreditMemo) deleteReason = "Cannot delete: credit memos cannot be deleted";
    else if (isVoided) deleteReason = "Memo is already cancelled";
    else if (data.isinvoiced) deleteReason = "Cannot delete: memo has already been invoiced";
    else if (data.hascreditreturn) deleteReason = "Cannot delete: a credit memo has been created against this memo";
  }

  const handleDelete = async () => {
    const result = await showConfirmationDialog({
      title: `Delete memo #${data.memonumber}?`,
      text: "This permanently removes the memo and cannot be undone.",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;
    const deleteResult = await handleTryCatch(async () => {
      const { data: responseData } = await deleteMemo({
        variables: { input: { storeid: parsedStoreId, memonumber: Number(data.memonumber) } },
      });
      if (responseData?.deleteMemo?.success) {
        dispatch(showNotification({ message: responseData.deleteMemo.message, type: NOTIFICATION_TYPES.SUCCESS }));
        onDeleted?.();
      }
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await api.post(
        `/store/memo/print`,
        { storeid: parsedStoreId, memonumbers: [Number(data.memonumber)] },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch {
      dispatch(showNotification({ message: "Failed to generate PDF", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setPrinting(false);
    }
  };

  const iconBtn: React.CSSProperties = { lineHeight: 1 };
  const dimmed: React.CSSProperties = { cursor: "not-allowed", display: "inline-flex", alignItems: "center" };

  const items: RowActionItem[] = [
    { key: 'view', label: 'View', icon: <Eye size={14} />, href: `${basePath}/sales/memo/${data.memonumber}/view` },
    canEdit
      ? { key: 'edit', label: 'Edit', icon: <Edit size={14} />, href: `${basePath}/sales/memo/${data.memonumber}/edit` }
      : { key: 'edit', label: 'Edit', icon: <Edit size={14} />, disabled: true, disabledReason: editReason },
    { key: 'print', label: 'Print', icon: <Printer size={14} />, onClick: handlePrint, disabled: printing },
    { key: 'email', label: 'Email', icon: <Mail size={14} />, onClick: () => setShowEmail(true) },
    canDelete
      ? { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, onClick: handleDelete }
      : { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, disabled: true, disabledReason: deleteReason },
  ];

  return (
    <>
      <RowActionsWrapper items={items}>
        <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
          onClick={handlePrint} disabled={printing} title="Print Memo">
          <Printer size={14} />
        </button>
        <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#6f42c1" }}
          onClick={() => setShowEmail(true)} title="Email Memo">
          <Mail size={14} />
        </button>
        <Link className="p-1" href={`${basePath}/sales/memo/${data.memonumber}/view`} scroll={false} title="View">
          <Eye size={14} />
        </Link>
        {canEdit ? (
          <Link className="p-1" href={`${basePath}/sales/memo/${data.memonumber}/edit`} scroll={false} title="Edit">
            <Edit size={14} className="feather-edit" />
          </Link>
        ) : (
          <span className="p-1" title={editReason} style={dimmed}>
            <Edit size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
        {canDelete ? (
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#dc3545" }}
            onClick={handleDelete} title="Delete Memo">
            <Trash2 size={14} />
          </button>
        ) : (
          <span className="p-1" title={deleteReason} style={dimmed}>
            <Trash2 size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
      </RowActionsWrapper>

      {pdfUrl && (
        <PdfPreviewModal pdfUrl={pdfUrl} filename={`memo-${data.memonumber}.pdf`} onClose={() => setPdfUrl(null)} />
      )}
      {showEmail && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          outletId={parsedOutletId}
          documentType="MEMO"
          documentNumbers={[Number(data.memonumber)]}
          onClose={() => setShowEmail(false)}
          onSent={(msg) => { setShowEmail(false); dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS })); }}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
    </>
  );
};

export default MemoActions;
