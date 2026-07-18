import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showConfirmationDialog } from "@/lib/utils/confirmationDialog";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { DELETE_PRODUCT_MUTATION } from "@/lib/graphql/mutations/products";
import { ProductListType } from "@/types/product";
import Link from "next/link";
import { Edit, Eye, Printer, Settings, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useAppDispatch } from "@/lib/store/hook";
import ProductAdjustmentModal from "./ProductAdjustmentModal";
import PrintLabelsModal from "../labels/PrintLabelsModal";
import ProductDrawer from "../productView/ProductDrawer";
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

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
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          variables: { itemid: data.itemid, storeid: parsedStoreId },
        });
        if (responseData?.deleteProduct.success) {
          dispatch(showNotification({ message: responseData.deleteProduct.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onDeleteSuccess?.();
        } else if (responseData?.deleteProduct.error) {
          dispatch(showNotification({ message: responseData.deleteProduct.error, type: NOTIFICATION_TYPES.ERROR }));
        }
        return true;
      });
      if (deleteResult.error) dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const hasTransactions = !!(
    data.hastransactions ||
    Number(data.itemquantityinhand ?? 0) !== 0 ||
    Number(data.overall_qty ?? 0) !== 0
  );

  const items: RowActionItem[] = [
    { key: 'view', label: 'Quick View', icon: <Eye size={14} />, onClick: () => setDrawerOpen(true) },
    { key: 'edit', label: 'Edit', icon: <Edit size={14} />, href: `${basePath}/products/${data.itemcode}/edit` },
    hasTransactions
      ? { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, disabled: true, disabledReason: "Item has transactions, can't be deleted", dangerous: true }
      : { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, onClick: () => handleDelete(), dangerous: true },
    { key: 'adjust', label: 'Adjust Stock', icon: <Settings size={14} />, onClick: () => setIsAdjustmentModalOpen(true) },
    { key: 'labels', label: 'Print Labels', icon: <Printer size={14} />, onClick: () => setIsPrintLabelsOpen(true) },
  ];

  return (
    <>
      <RowActionsWrapper items={items}>
        <a
          className="p-1"
          href="#"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDrawerOpen(true); }}
          title="Quick View"
        >
          <Eye size={14} />
        </a>
        <Link
          className="p-1"
          href={`${basePath}/products/${data.itemcode}/edit`}
          onClick={(e) => e.stopPropagation()}
          scroll={false}
          title="Edit"
        >
          <Edit size={14} />
        </Link>
        {hasTransactions ? (
          <span
            className="p-1"
            title="Item has transactions, can't be deleted"
            style={{ cursor: "not-allowed", opacity: 0.35, display: "inline-flex", alignItems: "center" }}
          >
            <Trash2 size={14} />
          </span>
        ) : (
          <Link className="confirm-text p-1" href="#" onClick={handleDelete} scroll={false} title="Delete">
            <Trash2 size={14} />
          </Link>
        )}
        <Link className="p-1" href="#" onClick={(e) => { e.preventDefault(); setIsAdjustmentModalOpen(true); }} scroll={false} title="Adjust Stock">
          <Settings size={14} />
        </Link>
        <Link className="p-1" href="#" onClick={(e) => { e.preventDefault(); setIsPrintLabelsOpen(true); }} scroll={false} title="Print Labels">
          <Printer size={14} />
        </Link>
      </RowActionsWrapper>

      <ProductAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => { setIsAdjustmentModalOpen(false); onAdjustmentSuccess?.(); }}
        productData={data}
      />
      {isPrintLabelsOpen && (
        <PrintLabelsModal product={data} onClose={() => setIsPrintLabelsOpen(false)} />
      )}
      {drawerOpen && (
        <ProductDrawer
          itemcode={data.itemcode ?? ""}
          storeId={parsedStoreId}
          outletId={parsedOutletId}
          onClose={() => setDrawerOpen(false)}
          mode="drawer"
        />
      )}
    </>
  );
};

export default ProductActions;
