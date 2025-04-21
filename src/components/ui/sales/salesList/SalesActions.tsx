import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SALE_MUTATION } from "@/lib/graphql/mutations/sales";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesInvoiceListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";

interface SalesActionsProps {
  data: SalesInvoiceListType;
  onDeleteSuccess?: () => void;
}

const SalesActions: React.FC<SalesActionsProps> = ({
  data,
  onDeleteSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deleteSalesInvoice] = useMutation(DELETE_SALE_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

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
        const { data: responseData } = await deleteSalesInvoice({
          variables: {
            invoicenumber: data.invoicenumber,
            storeid: parsedStoreId,
          },
        });

        if (responseData?.deleteSalesInvoice.success) {
          dispatch(
            showNotification({
              message: responseData.deleteSalesInvoice.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          // Trigger the callback to refresh data
          onDeleteSuccess?.();
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
          href={`${basePath}/sales/${data.invoicenumber}/view`}
          scroll={false}
        >
          <Eye className="feather-view" />
        </Link>
        <Link
          className="me-2 p-2"
          href={`${basePath}/sales/${data.invoicenumber}/edit`}
          scroll={false}
        >
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

export default SalesActions;
