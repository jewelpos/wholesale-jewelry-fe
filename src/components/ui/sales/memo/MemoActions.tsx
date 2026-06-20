"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, Eye, Mail, Printer } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { MemoSummary } from "@/types/sales";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";

interface MemoActionsProps {
  data: MemoSummary;
}

const MemoActions: React.FC<MemoActionsProps> = ({ data }) => {
  const { basePath } = useDefaultRoute();
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const config = getEnvironmentConfig();

  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  if (!data) return null;

  const canEdit =
    data.statusname !== "Shipped" &&
    data.statusname !== "Cancelled" &&
    Number(data.custcrediapplied) !== 1 &&
    Number(data.amountreceived) === 0;

  let editReason = "";
  if (!canEdit) {
    if (data.statusname === "Shipped") editReason = "Cannot edit: memo has been shipped";
    else if (data.statusname === "Cancelled") editReason = "Cannot edit: memo is cancelled";
    else if (Number(data.custcrediapplied) === 1) editReason = "Cannot edit: credit already applied";
    else if (Number(data.amountreceived) > 0) editReason = "Cannot edit: payment already received";
    else editReason = "Cannot edit in current status";
  }

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await api.post(
        `${config.apiUrl}/store/memo/print`,
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

  return (
    <>
      <div className="action-table-data">
        <div className="edit-delete-action" style={{ gap: "2px" }}>

          {/* Print */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
            onClick={handlePrint} disabled={printing} title="Print Memo">
            <Printer size={14} />
          </button>

          {/* Email */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#6f42c1" }}
            onClick={() => setShowEmail(true)} title="Email Memo">
            <Mail size={14} />
          </button>

          {/* View */}
          <Link className="p-1" href={`${basePath}/sales/memo/${data.memonumber}/view`} scroll={false} title="View">
            <Eye size={14} />
          </Link>

          {/* Edit */}
          {canEdit ? (
            <Link className="p-1" href={`${basePath}/sales/memo/${data.memonumber}/edit`} scroll={false} title="Edit">
              <Edit size={14} className="feather-edit" />
            </Link>
          ) : (
            <span className="p-1" title={editReason} style={dimmed}>
              <Edit size={14} style={{ opacity: 0.35 }} />
            </span>
          )}
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename={`memo-${data.memonumber}.pdf`}
          onClose={() => setPdfUrl(null)}
        />
      )}

      {showEmail && (
        <DocumentEmailModal
          storeId={parsedStoreId}
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
