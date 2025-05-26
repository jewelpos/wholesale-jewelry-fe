import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SUPPLIER_INVOICE_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SupplierInvoiceType } from "@/types/supplier";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";

interface SupplierInvoiceActionsProps {
  data: SupplierInvoiceType;
  handleRefreshInvoice?: () => void;
  setSelectedInvoiceId?: (value: number) => void;
}

const SupplierInvoiceActions: React.FC<SupplierInvoiceActionsProps> = ({
  data,
  handleRefreshInvoice,
  setSelectedInvoiceId,
}) => {
  const dispatch = useAppDispatch();
  const [deleteSupplierInvoice] = useMutation(DELETE_SUPPLIER_INVOICE_MUTATION);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const handleDelete = async () => {
    if (data.veninvamtpaid > 0) {
      dispatch(
        showNotification({
          message:
            "Invoice has been partially or fully paid. You cannot delete it.",
          type: NOTIFICATION_TYPES.WARNING,
        })
      );
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

  const handleEdit = () => {
    if (data.veninvamtpaid > 0) {
      dispatch(
        showNotification({
          message:
            "Invoice has been partially or fully paid. You cannot edit it.",
          type: NOTIFICATION_TYPES.WARNING,
        })
      );
      return;
    }
    setSelectedInvoiceId?.(data.supplierinvoiceid);
  };

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link className="me-2 p-2" href="#" onClick={handleEdit} scroll={false}>
          <Edit className="feather-edit" />
        </Link>
        <Link
          className="confirm-text p-2"
          href="#"
          onClick={handleDelete}
          scroll={false}
        >
          <Trash2 className="feather-trash-2" />
        </Link>
      </div>
    </div>
  );
};

export default SupplierInvoiceActions;
