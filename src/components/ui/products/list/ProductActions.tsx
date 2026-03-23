import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showConfirmationDialog } from "@/lib/utils/confirmationDialog";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { DELETE_PRODUCT_MUTATION } from "@/lib/graphql/mutations/products";
import { ProductListType } from "@/types/product";
import { getEnvironmentConfig } from "@/lib/config/environment";
import api from "@/lib/axios";
import Link from "next/link";
import { Edit, Printer, Settings, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useAppDispatch } from "@/lib/store/hook";
import ProductAdjustmentModal from "./ProductAdjustmentModal";

interface ProductActionsProps {
  data: ProductListType;
  onDeleteSuccess?: () => void;
  onAdjustmentSuccess?: () => void;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  data,
  onDeleteSuccess,
  onAdjustmentSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const result = await showConfirmationDialog({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await deleteProduct({
          variables: {
            itemid: data.itemid,
            storeid: parsedStoreId,
          },
        });

        if (responseData?.deleteProduct.success) {
          dispatch(
            showNotification({
              message: responseData.deleteProduct.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          // Trigger the callback to refresh data
          onDeleteSuccess?.();
        } else if (responseData?.deleteProduct.error) {
          dispatch(
            showNotification({
              message: responseData.deleteProduct.error,
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

  const handleAdjustment = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
  };

  const handleAdjustmentModalSuccess = () => {
    setIsAdjustmentModalOpen(false);
    onAdjustmentSuccess?.();
  };

  return (
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        <Link
          className="me-2 p-2"
          href={`${basePath}/products/${data.itemcode}/edit`}
          onClick={(e) => e.stopPropagation()}
          scroll={false}
        >
          <Edit className="feather-edit" />
        </Link>
        <Link
          className="confirm-text p-2 me-2"
          href="#"
          onClick={handleDelete}
          scroll={false}
        >
          <Trash2 className="feather-trash-2" />
        </Link>
        <Link
          className="p-2 p-2 me-2"
          href="#"
          onClick={handleAdjustment}
          scroll={false}
        >
          <Settings className="feather-view" />
        </Link>
      </div>
      <ProductAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={handleCloseAdjustmentModal}
        onSuccess={handleAdjustmentModalSuccess}
        productData={data}
      />
    </div>
  );
};

export default ProductActions;
