"use client";

import React, { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { CANCEL_INVOICE_MUTATION } from "@/lib/graphql/mutations/sales";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesInvoiceListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Eye, MessageCircle, Printer, Mail, Trash2, ChevronDown } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { IRowNode } from "ag-grid-community";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";

type PrintTemplate = 'compact' | 'thumbnail' | 'barcode' | 'packing_slip';

const TEMPLATE_LABELS: Record<PrintTemplate, string> = {
  compact:      'Standard',
  thumbnail:    'With Photos',
  barcode:      'With Barcodes',
  packing_slip: 'Packing Slip',
};

interface SalesActionsProps {
  data: SalesInvoiceListType;
  node: IRowNode<SalesInvoiceListType>;
}

const SalesActions: React.FC<SalesActionsProps> = ({ data, node }) => {
  const dispatch = useAppDispatch();
  const storeData = useAppSelector((state) => state.store.data);
  const [cancelInvoice] = useMutation(CANCEL_INVOICE_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [smsSending, setSmsSending] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const defaultTemplate = (storeData?.defaultprintlayout || 'compact') as PrintTemplate;

  const handleSendSMS = async () => {
    setSmsSending(true);
    try {
      await api.post(`/store/invoice/sms`, {
        storeid: parsedStoreId,
        invoicenumber: data.invoicenumber,
      });
      dispatch(showNotification({ message: `SMS sent for Invoice #${data.invoicenumber}`, type: NOTIFICATION_TYPES.SUCCESS }));
    } catch {
      dispatch(showNotification({ message: "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setSmsSending(false);
    }
  };

  const handlePrint = async (template: PrintTemplate = defaultTemplate) => {
    setShowTemplateMenu(false);
    setPrinting(true);
    try {
      const response = await api.post(
        `/store/invoice/print`,
        { storeid: parsedStoreId, invoicenumbers: [data.invoicenumber], template },
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

  const handleDelete = async () => {
    const result = await showConfirmationDialog({
      title: "Cancel this invoice?",
      text: "The invoice will be marked as Cancelled and cannot be edited.",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await cancelInvoice({
          variables: { input: { storeid: parsedStoreId, invoicenumber: data.invoicenumber } },
        });
        if (responseData?.cancelInvoice.success) {
          node.setData({ ...data, statusname: "Cancelled" });
          dispatch(showNotification({ message: responseData.cancelInvoice.message, type: NOTIFICATION_TYPES.SUCCESS }));
        }
        return true;
      });
      if (deleteResult.error) {
        dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    }
  };

  const isCreditInvoiceNotApplied = Number(data.salemodeid) === 5 && Number(data.custcrediapplied) === 0;
  const isReturnedWithCredit = data.statusname === "Returned" && Number(data.custcrediapplied) === 1;
  const canEdit =
    isCreditInvoiceNotApplied ||
    (data.statusname === "Ready" && Number(data.amountreceived) === 0 && !isReturnedWithCredit);
  const canCancel =
    !isCreditInvoiceNotApplied &&
    Number(data.amountreceived) === 0 &&
    data.statusname !== "Shipped" &&
    data.statusname !== "Picked up" &&
    data.statusname !== "Cancelled";
  const canSendSMS = data.statusname !== "Cancelled";

  let editReason = "";
  if (!canEdit) {
    if (Number(data.amountreceived) > 0) editReason = "Cannot edit: payment already received";
    else if (data.statusname === "Cancelled") editReason = "Cannot edit: invoice is cancelled";
    else if (data.statusname === "Shipped") editReason = "Cannot edit: invoice has been shipped";
    else if (data.statusname === "Picked up") editReason = "Cannot edit: invoice has been picked up";
    else if (Number(data.custcrediapplied) === 1) editReason = "Cannot edit: credit already applied";
    else editReason = "Cannot edit in current status";
  }

  let cancelReason = "";
  if (!canCancel) {
    if (isCreditInvoiceNotApplied) cancelReason = "Cannot cancel: this is an unapplied credit invoice";
    else if (Number(data.amountreceived) > 0) cancelReason = "Cannot cancel: payment already received";
    else if (data.statusname === "Shipped") cancelReason = "Cannot cancel: invoice has been shipped";
    else if (data.statusname === "Picked up") cancelReason = "Cannot cancel: invoice has been picked up";
    else if (data.statusname === "Cancelled") cancelReason = "Invoice is already cancelled";
    else cancelReason = "Cannot cancel in current status";
  }

  const iconBtn: React.CSSProperties = { lineHeight: 1 };
  const dimmed: React.CSSProperties = { cursor: "not-allowed", display: "inline-flex", alignItems: "center" };

  return (
    <>
      <div className="action-table-data">
        <div className="edit-delete-action" style={{ gap: "2px" }}>

          {/* SMS */}
          {canSendSMS ? (
            <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#198754" }}
              onClick={handleSendSMS} disabled={smsSending} title="Share Invoice Link">
              <MessageCircle size={14} />
            </button>
          ) : (
            <span className="p-1" title="Cannot share link: invoice is cancelled" style={dimmed}>
              <MessageCircle size={14} style={{ opacity: 0.35 }} />
            </span>
          )}

          {/* Print split-button */}
          <div ref={menuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
              onClick={() => handlePrint(defaultTemplate)} disabled={printing}
              title={`Print Invoice (${TEMPLATE_LABELS[defaultTemplate]})`}>
              <Printer size={14} />
            </button>
            <button type="button" className="p-0 btn btn-link" style={{ ...iconBtn, color: "#0d6efd", minWidth: 0, lineHeight: 1, paddingLeft: 1 }}
              onClick={() => setShowTemplateMenu(v => !v)} disabled={printing} title="Choose print layout">
              <ChevronDown size={10} />
            </button>
            {showTemplateMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #dee2e6", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,.12)", minWidth: 148, padding: "4px 0" }}
                onMouseLeave={() => setShowTemplateMenu(false)}>
                {(Object.keys(TEMPLATE_LABELS) as PrintTemplate[]).map(t => (
                  <button key={t} type="button" className="dropdown-item"
                    style={{ fontSize: 12, padding: "4px 12px", background: t === defaultTemplate ? "#f0f4ff" : undefined, fontWeight: t === defaultTemplate ? 600 : undefined }}
                    onClick={() => handlePrint(t)}>
                    {TEMPLATE_LABELS[t]}{t === defaultTemplate ? " ★" : ""}
                  </button>
                ))}
                <div style={{ borderTop: "1px solid #dee2e6", margin: "4px 0" }} />
                <Link href={`${basePath}/invoice-layout`} className="dropdown-item" scroll={false}
                  style={{ fontSize: 12, padding: "4px 12px", color: "#0d6efd" }}
                  onClick={() => setShowTemplateMenu(false)}>
                  Change default…
                </Link>
              </div>
            )}
          </div>

          {/* Email */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#6f42c1" }}
            onClick={() => setShowEmail(true)} title="Email Invoice">
            <Mail size={14} />
          </button>

          {/* View */}
          <Link className="p-1" href={`${basePath}/sales/${data.invoicenumber}/view`} scroll={false} title="View">
            <Eye size={14} />
          </Link>

          {/* Edit */}
          {canEdit ? (
            <Link className="p-1" href={`${basePath}/sales/${data.invoicenumber}/edit`} scroll={false} title="Edit">
              <Edit size={14} />
            </Link>
          ) : (
            <span className="p-1" title={editReason} style={dimmed}>
              <Edit size={14} style={{ opacity: 0.35 }} />
            </span>
          )}

          {/* Cancel */}
          {canCancel ? (
            <button type="button" className="confirm-text p-1 btn btn-link" style={{ ...iconBtn, color: "#dc3545" }}
              onClick={handleDelete} title="Cancel Invoice">
              <Trash2 size={14} />
            </button>
          ) : (
            <span className="p-1" title={cancelReason} style={dimmed}>
              <Trash2 size={14} style={{ opacity: 0.35 }} />
            </span>
          )}
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename={`invoice-${data.invoicenumber}.pdf`}
          onClose={() => setPdfUrl(null)}
        />
      )}

      {showEmail && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="INVOICE"
          documentNumbers={[Number(data.invoicenumber)]}
          onClose={() => setShowEmail(false)}
          onSent={(msg) => { setShowEmail(false); dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS })); }}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
    </>
  );
};

export default SalesActions;
