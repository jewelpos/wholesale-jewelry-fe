import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Eye, Inbox, Mail, Printer, Trash2 } from "react-feather";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { PurchaseOrder } from "@/types/purchase";
import { DELETE_PURCHASE_ORDER_MUTATION } from "@/lib/graphql/mutations/purchase";
import api from "@/lib/axios";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";

interface PurchaseOrderActionsProps {
  data: PurchaseOrder;
  onDeleteSuccess?: () => void;
}

const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({ data, onDeleteSuccess }) => {
  const dispatch = useAppDispatch();
  const [deletePurchaseOrder] = useMutation(DELETE_PURCHASE_ORDER_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  const status = data.postatus ?? 0;
  const isOpen = status === 1;
  const isReceivable = status === 2 || status === 3;
  const isClosed = status === 4;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await api.post(
        `/store/purchase-order/print`,
        { storeid: parsedStoreId, ponumbers: [Number(data.ponumber)] },
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
    const poNumber = Number(data.ponumber);
    if (!Number.isFinite(poNumber)) {
      dispatch(showNotification({ message: "Invalid purchase order number", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }

    const result = await showConfirmationDialog({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await deletePurchaseOrder({
          variables: { storeid: parsedStoreId, ponumber: poNumber },
        });
        if (responseData?.deletePurchaseOrder?.success) {
          dispatch(showNotification({ message: responseData.deletePurchaseOrder.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onDeleteSuccess?.();
        } else if (responseData?.deletePurchaseOrder?.error) {
          dispatch(showNotification({ message: responseData.deletePurchaseOrder.error, type: NOTIFICATION_TYPES.ERROR }));
        }
        return true;
      });
      if (deleteResult.error) {
        dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    }
  };

  const iconBtn: React.CSSProperties = { lineHeight: 1 };
  const dimmed: React.CSSProperties = { color: "#cbd5e1", cursor: "not-allowed", display: "inline-flex" };

  return (
    <>
      <div className="action-table-data">
        <div className="edit-delete-action" style={{ gap: "2px" }}>

          {/* Print */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
            onClick={handlePrint} disabled={printing} title="Print PO">
            <Printer size={14} />
          </button>

          {/* Email */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#6f42c1" }}
            onClick={() => setShowEmail(true)} title="Email PO">
            <Mail size={14} />
          </button>

          {/* View */}
          <Link className="p-1" href={`${basePath}/purchases/${data.ponumber}/view`} scroll={false} title="View">
            <Eye className="feather-eye" size={14} />
          </Link>

          {/* Edit */}
          {isOpen ? (
            <Link className="p-1" href={`${basePath}/purchases/${data.ponumber}/edit`} scroll={false} title="Edit">
              <Edit className="feather-edit" size={14} />
            </Link>
          ) : (
            <span className="p-1" title={isClosed ? "Closed PO cannot be edited" : "Only open POs can be edited"} style={dimmed}>
              <Edit size={14} />
            </span>
          )}

          {/* Receive */}
          {isReceivable ? (
            <Link className="p-1" href={`${basePath}/purchases/receiveorder_items?ponumber=${data.ponumber}`} scroll={false} title="Receive Order">
              <Inbox className="feather-inbox" size={14} />
            </Link>
          ) : (
            <span className="p-1" title={isClosed ? "PO already fully received" : "PO must be Sent or Partial to receive"} style={dimmed}>
              <Inbox size={14} />
            </span>
          )}

          {/* Delete */}
          {!isClosed ? (
            <Link className="confirm-text p-1" href="#" onClick={handleDelete} scroll={false} title="Delete">
              <Trash2 className="feather-trash-2" size={14} />
            </Link>
          ) : (
            <span className="p-1" title="Closed PO cannot be deleted" style={dimmed}>
              <Trash2 size={14} />
            </span>
          )}
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename={`purchase-order-${data.ponumber}.pdf`}
          onClose={() => setPdfUrl(null)}
        />
      )}

      {showEmail && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="PURCHASE_ORDER"
          documentNumbers={[Number(data.ponumber)]}
          onClose={() => setShowEmail(false)}
          onSent={(msg) => { setShowEmail(false); dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS })); }}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}
    </>
  );
};

export default PurchaseOrderActions;
