import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import SupplierDrawer from "@/components/ui/supplier/supplierView/SupplierDrawer";
import { DELETE_SUPPLIER_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SupplierListType } from "@/types/supplier";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";

interface SupplierActionsProps {
  data: SupplierListType;
  onDeleteSuccess?: () => void;
}

const SupplierActions: React.FC<SupplierActionsProps> = ({ data, onDeleteSuccess }) => {
  const dispatch = useAppDispatch();
  const [deleteSupplier] = useMutation(DELETE_SUPPLIER_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        const { data: responseData } = await deleteSupplier({
          variables: { supplierid: data.supplierid, storeid: parsedStoreId },
        });
        if (responseData?.deleteSupplier.success) {
          dispatch(showNotification({ message: responseData.deleteSupplier.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onDeleteSuccess?.();
        }
        return true;
      });
      if (deleteResult.error) {
        dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    }
  };

  const canDelete = Number(data.numberofpurchase) === 0;
  const deleteReason = canDelete ? "" : "Cannot delete: supplier has existing purchases";

  return (
    <>
    <div className="action-table-data">
      <div className="edit-delete-action" style={{ gap: "2px" }}>
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
          href={`${basePath}/supplier/${data.supplierid}/edit`}
          scroll={false}
          title="Edit"
        >
          <Edit size={14} />
        </Link>
        {canDelete ? (
          <button
            type="button"
            className="confirm-text p-1 btn btn-link"
            style={{ lineHeight: 1 }}
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <span
            className="p-1"
            title={deleteReason}
            style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}
          >
            <Trash2 size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
      </div>
    </div>
    {drawerOpen && (
      <SupplierDrawer
        supplierId={data.supplierid}
        storeId={parsedStoreId}
        outletId={parsedOutletId}
        onClose={() => setDrawerOpen(false)}
        mode="drawer"
      />
    )}
    </>
  );
};

export default SupplierActions;
