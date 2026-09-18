"use client";

import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useMutation } from "@apollo/client";
import { CANCEL_INVOICE_MUTATION, UPDATE_INVOICE_STATUS_MUTATION } from "@/lib/graphql/mutations/sales";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesInvoiceListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Eye, MessageCircle, Printer, Mail, Trash2, ChevronDown, Package, Truck } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { IRowNode } from "ag-grid-community";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

type PrintTemplate = 'compact' | 'thumbnail' | 'barcode' | 'packing_slip' | 'memo_invoice' | 'barcode_below' | 'barcode_replace';

const TEMPLATE_LABELS: Record<PrintTemplate, string> = {
  compact:         'Standard',
  thumbnail:       'With Photos',
  barcode:         'With Barcodes',
  packing_slip:    'Packing Slip',
  memo_invoice:    'Memo Invoice',
  barcode_below:   'Item Code + Barcode ID',
  barcode_replace: 'Barcode ID Only',
};

// Fulfillment statuses a regular invoice can be manually moved through — see
// updateInvoiceStatus on the backend. Ready(2), Cancelled(9), Returned(10), and every
// Memo-only status are never offered here.
const MANUAL_STATUS_LABELS: Record<number, string> = {
  3: "Processing",
  4: "Ready to Ship",
  5: "Shipped",
  6: "Partially Shipped",
  7: "Picked up",
  8: "Completed",
};

interface SalesActionsProps {
  data: SalesInvoiceListType;
  node: IRowNode<SalesInvoiceListType>;
}

const SalesActions: React.FC<SalesActionsProps> = ({ data, node }) => {
  const dispatch = useAppDispatch();
  const storeData = useAppSelector((state) => state.store.data);
  const [cancelInvoice] = useMutation(CANCEL_INVOICE_MUTATION);
  const [updateInvoiceStatus] = useMutation(UPDATE_INVOICE_STATUS_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [smsSending, setSmsSending] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templateMenuPos, setTemplateMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const statusChevronRef = useRef<HTMLButtonElement>(null);

  const toggleTemplateMenu = () => {
    if (!showTemplateMenu && chevronRef.current) {
      const r = chevronRef.current.getBoundingClientRect();
      setTemplateMenuPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX });
    }
    setShowTemplateMenu((v) => !v);
  };

  const toggleStatusMenu = () => {
    if (!showStatusMenu && statusChevronRef.current) {
      const r = statusChevronRef.current.getBoundingClientRect();
      setStatusMenuPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX });
    }
    setShowStatusMenu((v) => !v);
  };

  const defaultTemplate = (storeData?.defaultprintlayout || 'compact') as PrintTemplate;

  const handleSendSMS = async () => {
    setSmsSending(true);
    try {
      await api.post(`/store/invoice/sms`, { storeid: parsedStoreId, invoicenumber: data.invoicenumber });
      api.post('/store/comm-count/increment', { storeid: parsedStoreId, outletid: parsedOutletId, type: 'sms' }).catch(() => {});
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
    } catch (err: any) {
      let msg = "Failed to generate PDF";
      try {
        if (err?.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed?.message || msg;
        }
      } catch { /* ignore */ }
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
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

  const handleChangeStatus = async (invoicestatusid: number, statusname: string) => {
    setShowStatusMenu(false);
    setStatusUpdating(true);
    const result = await handleTryCatch(async () => {
      const { data: responseData } = await updateInvoiceStatus({
        variables: { input: { storeid: parsedStoreId, invoicenumber: data.invoicenumber, invoicestatusid } },
      });
      if (responseData?.updateInvoiceStatus?.success) {
        node.setData({ ...data, statusname });
        dispatch(showNotification({ message: responseData.updateInvoiceStatus.message, type: NOTIFICATION_TYPES.SUCCESS }));
      }
      return true;
    });
    setStatusUpdating(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const isCreditInvoiceNotApplied = Number(data.salemodeid) === 5 && Number(data.custcrediapplied) === 0;
  const hasPaymentReceived = Number(data.amountreceived) > 0;
  const hasCreditApplied = Number(data.custcrediapplied) === 1 || Number(data.creditamountapplied) > 0;
  // Shipped/Picked up invoices are still editable as long as nothing's actually been
  // collected against them yet (no payment, no credit applied — both already gated
  // above) and there's still a real balance due. The invoice's own status is never
  // touched to make this true — it stays Shipped/Picked up either way.
  const hasBalanceDue = Number(data.balancedue) > 0;
  const isMemoDerived = !!data.frommemonumber;
  const canEdit =
    !hasPaymentReceived &&
    !hasCreditApplied &&
    (isCreditInvoiceNotApplied ||
      data.statusname === "Ready" ||
      ((data.statusname === "Shipped" || data.statusname === "Picked up") && hasBalanceDue));
  // linkedmemocreditapplied: this invoice's own custcrediapplied/creditamountapplied say
  // nothing about it — it's the hidden shadow return-memo createInvoiceFromMemo creates
  // alongside a regular invoice-from-memo conversion (refcreditmemocreated) that has its
  // own, separate applied flag. cancelInvoice blocks cancellation once that shadow credit
  // has been spent elsewhere; mirrored here so Cancel is disabled with a clear reason
  // instead of failing only after the click.
  const canCancel =
    !isCreditInvoiceNotApplied &&
    Number(data.balancedue) !== 0 &&
    Number(data.amountreceived) === 0 &&
    Number(data.creditamountapplied) === 0 &&
    !data.custcrediapplied &&
    !data.linkedmemocreditapplied &&
    data.statusname !== "Shipped" &&
    data.statusname !== "Picked up" &&
    data.statusname !== "Cancelled";
  const canSendSMS = data.statusname !== "Cancelled";
  // Matches updateInvoiceStatus's own backend gate exactly: only a regular invoice
  // (salemodeid=2 — not Void/Memo/Credit Memo/standalone Credit Invoice) that's never
  // been voided can have its fulfillment status changed this way.
  const canChangeStatus = Number(data.salemodeid) === 2 && !data.voiddate;
  // The generic edit page can't tell a credit invoice from a regular one on its own
  // (same route for both) — it relies on this query param to load SalesInvoiceForm
  // in the right mode. Without it, edits silently ran as a regular invoice: new
  // lines defaulted to positive qty and the qty input refused negative values.
  const editHref = `${basePath}/sales/${data.invoicenumber}/edit${Number(data.salemodeid) === 5 ? "?credit=1" : ""}`;

  let editReason = "";
  if (!canEdit) {
    if (hasPaymentReceived) editReason = "Cannot edit: payment already received";
    else if (hasCreditApplied) editReason = "Cannot edit: credit already applied";
    else if (data.statusname === "Cancelled") editReason = "Cannot edit: invoice is cancelled";
    else if ((data.statusname === "Shipped" || data.statusname === "Picked up") && !hasBalanceDue) editReason = "Cannot edit: invoice is fully paid";
    else editReason = "Cannot edit in current status";
  }
  // Edit itself is still allowed on a memo-derived invoice (header fields, non-memo
  // lines) — only its memo-linked lines are locked once inside the form, and no new
  // lines can be added at all (see isEditingMemoDerivedInvoice in SalesInvoiceForm). This
  // is just a heads-up shown on the still-enabled icon, not a block reason.
  const editTitle = canEdit && isMemoDerived ? "Invoice created from memo — limited edit" : "Edit";

  let cancelReason = "";
  if (!canCancel) {
    if (isCreditInvoiceNotApplied) cancelReason = "Cannot cancel: this is an unapplied credit invoice";
    else if (data.statusname === "Cancelled") cancelReason = "Invoice is already cancelled";
    else if (hasPaymentReceived) cancelReason = "Cannot cancel: payment already received";
    else if (hasCreditApplied) cancelReason = "Cannot cancel: credit has been applied";
    else if (data.linkedmemocreditapplied) cancelReason = "Cannot cancel: its associated memo credit has already been applied";
    else if (Number(data.balancedue) === 0) cancelReason = "Cannot cancel: balance is zero";
    else if (data.statusname === "Shipped") cancelReason = "Cannot cancel: invoice has been shipped";
    else if (data.statusname === "Picked up") cancelReason = "Cannot cancel: invoice has been picked up";
    else cancelReason = "Cannot cancel in current status";
  }

  const iconBtn: React.CSSProperties = { lineHeight: 1 };
  const dimmed: React.CSSProperties = { cursor: "not-allowed", display: "inline-flex", alignItems: "center" };

  const items: RowActionItem[] = [
    { key: 'view', label: 'View', icon: <Eye size={14} />, href: `${basePath}/sales/${data.invoicenumber}/view` },
    canEdit
      ? { key: 'edit', label: isMemoDerived ? 'Edit (limited — from memo)' : 'Edit', icon: <Edit size={14} />, href: editHref }
      : { key: 'edit', label: 'Edit', icon: <Edit size={14} />, disabled: true, disabledReason: editReason },
    { key: 'print', label: 'Print', icon: <Printer size={14} />, onClick: () => handlePrint(defaultTemplate), disabled: printing },
    { key: 'packing-slip', label: 'Packing Slip', icon: <Package size={14} />, onClick: () => handlePrint('packing_slip'), disabled: printing },
    { key: 'email', label: 'Email', icon: <Mail size={14} />, onClick: () => setShowEmail(true) },
    ...(canSendSMS ? [{ key: 'sms', label: 'Share SMS', icon: <MessageCircle size={14} />, onClick: handleSendSMS, disabled: smsSending }] : []),
    ...(canChangeStatus
      ? Object.entries(MANUAL_STATUS_LABELS).map(([id, label]) => ({
          key: `status-${id}`,
          label: `Set: ${label}`,
          icon: <Truck size={14} />,
          onClick: () => handleChangeStatus(Number(id), label),
          disabled: statusUpdating,
        }))
      : []),
    canCancel
      ? { key: 'cancel', label: 'Cancel Invoice', icon: <Trash2 size={14} />, onClick: handleDelete, dangerous: true }
      : { key: 'cancel', label: 'Cancel Invoice', icon: <Trash2 size={14} />, disabled: true, disabledReason: cancelReason, dangerous: true },
  ];

  return (
    <>
      <RowActionsWrapper items={items}>
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

        {/* Change Status split-button */}
        {canChangeStatus ? (
          <div ref={statusMenuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
              onClick={toggleStatusMenu} disabled={statusUpdating} title="Change Status">
              <Truck size={14} />
            </button>
            <button ref={statusChevronRef} type="button" className="p-0 btn btn-link" style={{ ...iconBtn, color: "#0d6efd", minWidth: 0, paddingLeft: 1 }}
              onClick={toggleStatusMenu} disabled={statusUpdating} title="Change Status">
              <ChevronDown size={10} />
            </button>
            {showStatusMenu && typeof document !== "undefined" && ReactDOM.createPortal(
              <div style={{ position: "absolute", top: statusMenuPos.top, left: statusMenuPos.left, zIndex: 9999, background: "#fff", border: "1px solid #dee2e6", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,.12)", minWidth: 160, padding: "4px 0" }}
                onMouseLeave={() => setShowStatusMenu(false)}>
                {Object.entries(MANUAL_STATUS_LABELS).map(([id, label]) => (
                  <button key={id} type="button" className="dropdown-item"
                    style={{ fontSize: 12, padding: "4px 12px", fontWeight: data.statusname === label ? 600 : undefined }}
                    onClick={() => handleChangeStatus(Number(id), label)}>
                    {label}{data.statusname === label ? " ✓" : ""}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        ) : (
          <span className="p-1" title="Only a regular, non-cancelled invoice can have its status changed" style={dimmed}>
            <Truck size={14} style={{ opacity: 0.35 }} />
          </span>
        )}

        {/* Print split-button */}
        <div ref={menuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
            onClick={() => handlePrint(defaultTemplate)} disabled={printing}
            title={`Print Invoice (${TEMPLATE_LABELS[defaultTemplate]})`}>
            <Printer size={14} />
          </button>
          <button ref={chevronRef} type="button" className="p-0 btn btn-link" style={{ ...iconBtn, color: "#0d6efd", minWidth: 0, paddingLeft: 1 }}
            onClick={toggleTemplateMenu} disabled={printing} title="Choose print layout">
            <ChevronDown size={10} />
          </button>
          {showTemplateMenu && typeof document !== "undefined" && ReactDOM.createPortal(
            <div style={{ position: "absolute", top: templateMenuPos.top, left: templateMenuPos.left, zIndex: 9999, background: "#fff", border: "1px solid #dee2e6", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,.12)", minWidth: 148, padding: "4px 0" }}
              onMouseLeave={() => setShowTemplateMenu(false)}>
              {(Object.keys(TEMPLATE_LABELS) as PrintTemplate[]).map(t => (
                <button key={t} type="button" className="dropdown-item"
                  style={{ fontSize: 12, padding: "4px 12px", background: t === defaultTemplate ? "#f0f4ff" : undefined, fontWeight: t === defaultTemplate ? 600 : undefined }}
                  onClick={() => { setShowTemplateMenu(false); handlePrint(t); }}>
                  {TEMPLATE_LABELS[t]}{t === defaultTemplate ? " ★" : ""}
                </button>
              ))}
              <div style={{ borderTop: "1px solid #dee2e6", margin: "4px 0" }} />
              <Link href={`${basePath}/settings/invoice-layout`} className="dropdown-item" scroll={false}
                style={{ fontSize: 12, padding: "4px 12px", color: "#0d6efd" }}
                onClick={() => setShowTemplateMenu(false)}>
                Change default…
              </Link>
            </div>,
            document.body
          )}
        </div>

        {/* Packing Slip */}
        <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#fd7e14" }}
          onClick={() => handlePrint('packing_slip')} disabled={printing} title="Print Packing Slip">
          <Package size={14} />
        </button>

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
          <Link className="p-1" href={editHref} scroll={false} title={editTitle}>
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
      </RowActionsWrapper>

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
          outletId={parsedOutletId}
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
