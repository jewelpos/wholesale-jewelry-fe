import React from "react";
import { useMutation } from "@apollo/client";
import { DELETE_SUBCATEGORY_MUTATION } from "@/lib/graphql/mutations/products";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { Subcategory } from "@/types/product";
import { Edit, Trash2 } from "react-feather";
import { useParams } from "next/navigation";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import { ICellRendererParams } from "ag-grid-community";
import Link from "next/link";

interface SubcategoryActionsProps extends ICellRendererParams {
  onEditSubcategory?: (subcategory: Subcategory) => void;
  onDeleteSuccess?: () => void;
}

const SubcategoryActions: React.FC<SubcategoryActionsProps> = (props) => {
  const { data, onEditSubcategory, onDeleteSuccess } = props;
  const dispatch = useAppDispatch();
  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY_MUTATION);
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const handleEdit = () => {
    onEditSubcategory?.(data as Subcategory);
  };

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
        const { data: responseData } = await deleteSubcategory({
          variables: {
            subcategoryid: parseInt((data as Subcategory).subcategoryid.toString()),
            storeid: parsedStoreId,
          },
        });

        if (responseData?.deleteSubcategory.success) {
          dispatch(
            showNotification({
              message: responseData.deleteSubcategory.message,
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
        <Link className="me-2 p-2" href="#" scroll={false} onClick={handleEdit}>
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

export default SubcategoryActions;
