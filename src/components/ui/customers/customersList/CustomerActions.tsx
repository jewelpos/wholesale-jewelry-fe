import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_CUSTOMER_MUTATION } from "@/lib/graphql/mutations/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { CustomersListType } from "@/types/customer";
import Link from "next/link";
import { Edit, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";

interface CustomerActionsProps {
  data: CustomersListType;
}

const CustomerActions: React.FC<CustomerActionsProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER_MUTATION);
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
        const { data: responseData } = await deleteCustomer({
          variables: {
            customerid: parseInt(data.customerid),
            storeid: parsedStoreId,
          },
        });

        if (responseData?.deleteCustomer.success) {
          dispatch(
            showNotification({
              message: responseData.deleteCustomer.message,
              type: NOTIFICATION_TYPES.SUCCESS,
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
          href={`${basePath}/customers/edit/${data.customerid}`}
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

export default CustomerActions;
