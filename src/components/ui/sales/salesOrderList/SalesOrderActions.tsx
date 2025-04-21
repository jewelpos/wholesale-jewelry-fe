import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SALES_ORDER_MUTATION } from "@/lib/graphql/mutations/sales";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesOrderListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Trash2 } from "react-feather";

interface SalesOrderActionsProps {
  data: SalesOrderListType;
}

const SalesOrderActions: React.FC<SalesOrderActionsProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [deleteSalesOrder] = useMutation(DELETE_SALES_ORDER_MUTATION);

  const handleDelete = async () => {
    const result = await handleTryCatch(async () => {
      const { data: responseData } = await deleteSalesOrder({
        variables: {
          salesorderno: data.salesorderno,
          outletid: data.outletid,
        },
      });

      if (responseData?.deleteSalesOrder.success) {
        dispatch(
          showNotification({
            message: responseData.deleteSalesOrder.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        // Refresh the grid
        window.location.reload();
      }
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link
          className="me-2 p-2"
          href={`/sales/orders/edit/${data.salesorderno}`}
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

export default SalesOrderActions;
