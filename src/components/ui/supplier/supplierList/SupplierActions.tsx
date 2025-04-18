import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SUPPLIER_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SupplierListType } from "@/types/supplier";
import Link from "next/link";
import { Edit, Trash2 } from "react-feather";

interface SupplierActionsProps {
  data: SupplierListType;
}

const SupplierActions: React.FC<SupplierActionsProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [deleteSupplier] = useMutation(DELETE_SUPPLIER_MUTATION);

  const handleDelete = async () => {
    const result = await handleTryCatch(async () => {
      const { data: responseData } = await deleteSupplier({
        variables: {
          supplierid: data.supplierid,
          outletid: data.outletid,
        },
      });

      if (responseData?.deleteSupplier.success) {
        dispatch(
          showNotification({
            message: responseData.deleteSupplier.message,
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
          href={`/suppliers/edit/${data.supplierid}`}
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

export default SupplierActions;
