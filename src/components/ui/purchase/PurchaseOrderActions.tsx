import React from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Eye, Inbox, Trash2 } from "react-feather";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { PurchaseOrder } from "@/types/purchase";
import { DELETE_PURCHASE_ORDER_MUTATION } from "@/lib/graphql/mutations/purchase";

interface PurchaseOrderActionsProps {
  data: PurchaseOrder;
  onDeleteSuccess?: () => void;
}

const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({
  data,
  onDeleteSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deletePurchaseOrder] = useMutation(DELETE_PURCHASE_ORDER_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const status = data.postatus ?? 0;
  const isOpen = status === 1;
  const isReceivable = status === 2 || status === 3;
  const isClosed = status === 4;

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

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists" />

        {/* View — always enabled */}
        <Link
          className="me-2 p-2"
          href={`${basePath}/purchases/${data.ponumber}/view`}
          scroll={false}
          title="View"
        >
          <Eye className="feather-eye" size={14} />
        </Link>

        {/* Edit — only for Open */}
        {isOpen ? (
          <Link
            className="me-2 p-2"
            href={`${basePath}/purchases/${data.ponumber}/edit`}
            scroll={false}
            title="Edit"
          >
            <Edit className="feather-edit" size={14} />
          </Link>
        ) : (
          <span
            className="me-2 p-2"
            title={isClosed ? "Closed PO cannot be edited" : "Only open POs can be edited"}
            style={{ color: "#cbd5e1", cursor: "not-allowed", display: "inline-flex" }}
          >
            <Edit size={14} />
          </span>
        )}

        {/* Receive — for Sent or Partially Received */}
        {isReceivable ? (
          <Link
            className="me-2 p-2"
            href={`${basePath}/purchases/receiveorder_items?ponumber=${data.ponumber}`}
            scroll={false}
            title="Receive Order"
          >
            <Inbox className="feather-inbox" size={14} />
          </Link>
        ) : (
          <span
            className="me-2 p-2"
            title={isClosed ? "PO already fully received" : "PO must be in Sent or Partial status to receive"}
            style={{ color: "#cbd5e1", cursor: "not-allowed", display: "inline-flex" }}
          >
            <Inbox size={14} />
          </span>
        )}

        {/* Delete — disabled for Closed */}
        {!isClosed ? (
          <Link
            className="confirm-text p-2"
            href="#"
            onClick={handleDelete}
            scroll={false}
            title="Delete"
          >
            <Trash2 className="feather-trash-2" size={14} />
          </Link>
        ) : (
          <span
            className="p-2"
            title="Closed PO cannot be deleted"
            style={{ color: "#cbd5e1", cursor: "not-allowed", display: "inline-flex" }}
          >
            <Trash2 size={14} />
          </span>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderActions;
