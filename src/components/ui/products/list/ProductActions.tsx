import React from "react";
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
import { Edit, Printer, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useAppDispatch } from "@/lib/store/hook";

interface ProductActionsProps {
  data: ProductListType;
  onDeleteSuccess?: () => void;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  data,
  onDeleteSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION);
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

  const handlePrint = async () => {
    const printResult = await handleTryCatch(async () => {
      const config = getEnvironmentConfig();
      const response = await api.get(
        `${config.apiUrl}/store/product/${data.itemid}/${parsedStoreId}/print`,
        {
          responseType: "blob", // Critical for PDF download
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data: pdfData } = response;
      if (pdfData) {
        const url = window.URL.createObjectURL(pdfData);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `product_${data.itemcode}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        dispatch(
          showNotification({
            message: "Product document downloaded successfully",
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
      }
      return true;
    });

    if (printResult.error) {
      dispatch(
        showNotification({
          message: printResult.error,
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
          href={`${basePath}/products/${data.itemcode}/edit`}
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
        <Link className="p-2" href="#" onClick={handlePrint} scroll={false}>
          <Printer className="feather-view" />
        </Link>
      </div>
    </div>
  );
};

export default ProductActions;
