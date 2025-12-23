import React from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
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

  const isOpen = String(data.status ?? "").toLowerCase() === "open";

  const handleDelete = async () => {
    const poNumber = Number(data.ponumber);
    if (!Number.isFinite(poNumber)) {
      dispatch(
        showNotification({
          message: "Invalid purchase order number",
          type: NOTIFICATION_TYPES.ERROR,
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
        const { data: responseData } = await deletePurchaseOrder({
          variables: {
            storeid: parsedStoreId,
            ponumber: poNumber,
          },
        });

        if (responseData?.deletePurchaseOrder?.success) {
          dispatch(
            showNotification({
              message: responseData.deletePurchaseOrder.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          onDeleteSuccess?.();
        } else if (responseData?.deletePurchaseOrder?.error) {
          dispatch(
            showNotification({
              message: responseData.deletePurchaseOrder.error,
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
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
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link
          className="me-2 p-2"
          href={`${basePath}/purchases/${data.ponumber}/view`}
          scroll={false}
        >
          <Eye className="feather-view" />
        </Link>
        {isOpen && (
          <Link
            className="me-2 p-2"
            href={`${basePath}/purchases/${data.ponumber}/edit`}
            scroll={false}
          >
            <Edit className="feather-edit" />
          </Link>
        )}
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

export default PurchaseOrderActions;
