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
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

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

  const handleEdit = () => onEditSubcategory?.(data as Subcategory);

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
          dispatch(showNotification({ message: responseData.deleteSubcategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onDeleteSuccess?.();
        }
        return true;
      });
      if (deleteResult.error) dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const items: RowActionItem[] = [
    { key: 'edit', label: 'Edit', icon: <Edit size={14} />, onClick: handleEdit },
    { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, onClick: handleDelete, dangerous: true },
  ];

  return (
    <RowActionsWrapper items={items}>
      <Link className="p-1" href="#" scroll={false} onClick={handleEdit} title="Edit">
        <Edit className="feather-edit" />
      </Link>
      <Link className="confirm-text p-1" href="#" onClick={handleDelete} scroll={false} title="Delete">
        <Trash2 className="feather-trash-2" />
      </Link>
    </RowActionsWrapper>
  );
};

export default SubcategoryActions;
