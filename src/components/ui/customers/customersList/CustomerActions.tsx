import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import CustomerDrawer from "@/components/ui/customers/customerView/CustomerDrawer";
import { DELETE_CUSTOMER_MUTATION } from "@/lib/graphql/mutations/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { CustomersListType } from "@/types/customer";
import Link from "next/link";
import { Edit, Eye, FileText, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import CustomerStatementModal from "@/components/ui/customers/statement/CustomerStatementModal";
import { useUserRole } from "@/hooks/useUserRole";

interface CustomerActionsProps {
  data: CustomersListType;
  onDeleteSuccess?: () => void;
}

const CustomerActions: React.FC<CustomerActionsProps> = ({
  data,
  onDeleteSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [statementOpen, setStatementOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAtLeastManager } = useUserRole();

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

  const canDelete = Number(data.numberofsales) === 0;
  const deleteReason = canDelete ? "" : "Cannot delete: customer has existing sales";

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
        {isAtLeastManager && (
          <button
            type="button"
            className="p-1 btn btn-link"
            style={{ lineHeight: 1 }}
            onClick={() => setStatementOpen(true)}
            title="Print Statement"
          >
            <FileText size={14} />
          </button>
        )}
        <Link
          className="p-1"
          href={`${basePath}/customers/${data.customerid}/edit`}
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
      {statementOpen && (
        <CustomerStatementModal customer={data} onClose={() => setStatementOpen(false)} />
      )}
    </div>
    {drawerOpen && (
      <CustomerDrawer
        customerId={parseInt(data.customerid, 10)}
        storeId={parsedStoreId}
        outletId={parsedOutletId}
        onClose={() => setDrawerOpen(false)}
        mode="drawer"
      />
    )}
    </>
  );
};

export default CustomerActions;
