import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SUPPLIER_INVOICE_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SupplierInvoiceType } from "@/types/supplier";
import { Edit, Eye, Trash2 } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import { useParams } from "next/navigation";

interface SupplierInvoiceActionsProps {
  data: SupplierInvoiceType;
  handleRefreshInvoice?: () => void;
  setSelectedInvoiceId?: (value: number) => void;
  setViewInvoiceId?: (value: number) => void;
}

const SupplierInvoiceActions: React.FC<SupplierInvoiceActionsProps> = ({
  data,
  handleRefreshInvoice,
  setSelectedInvoiceId,
  setViewInvoiceId,
}) => {
  const dispatch = useAppDispatch();
  const [deleteSupplierInvoice] = useMutation(DELETE_SUPPLIER_INVOICE_MUTATION);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const hasPaid = Number(data.veninvamtpaid) > 0;
  const canEdit = !hasPaid;
  const canDelete = !hasPaid;

  const handleDelete = async () => {
    const result = await showConfirmationDialog({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await deleteSupplierInvoice({
          variables: {
            supplierinvoiceid: data.supplierinvoiceid,
            storeid: parsedStoreId,
          },
        });
        if (responseData?.deleteSupplierInvoice.success) {
          dispatch(
            showNotification({
              message: responseData.deleteSupplierInvoice.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          handleRefreshInvoice?.();
        }
        return true;
      });

      if (deleteResult.error) {
        dispatch(
          showNotification({
            message: deleteResult.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }
    }
  };

  return (
    <div className="action-table-data">
      <div className="edit-delete-action" style={{ gap: "2px" }}>
        {/* View — always enabled */}
        <button
          type="button"
          className="p-1 btn btn-link"
          style={{ lineHeight: 1 }}
          onClick={() => setViewInvoiceId?.(data.supplierinvoiceid)}
          title="View"
        >
          <Eye size={14} />
        </button>

        {/* Edit — disabled when invoice has payments */}
        {canEdit ? (
          <button
            type="button"
            className="p-1 btn btn-link"
            style={{ lineHeight: 1 }}
            onClick={() => setSelectedInvoiceId?.(data.supplierinvoiceid)}
            title="Edit"
          >
            <Edit size={14} />
          </button>
        ) : (
          <span
            className="p-1"
            title="Cannot edit: invoice has been partially or fully paid"
            style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}
          >
            <Edit size={14} style={{ opacity: 0.35 }} />
          </span>
        )}

        {/* Delete — disabled when invoice has payments */}
        {canDelete ? (
          <button
            type="button"
            className="confirm-text p-1 btn btn-link"
            style={{ lineHeight: 1 }}
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <span
            className="p-1"
            title="Cannot delete: invoice has been partially or fully paid"
            style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}
          >
            <Trash2 size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
      </div>
    </div>
  );
};

export default SupplierInvoiceActions;
