import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import CustomerDrawer from "@/components/ui/customers/customerView/CustomerDrawer";
import { DELETE_CUSTOMER_MUTATION } from "@/lib/graphql/mutations/customer";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
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
import RowActionsWrapper, { RowActionItem } from "@/components/ui/grid/RowActionsWrapper";

interface CustomerActionsProps {
  data: CustomersListType;
  onDeleteSuccess?: () => void;
}

const CustomerActions: React.FC<CustomerActionsProps> = ({ data, onDeleteSuccess }) => {
  const dispatch = useAppDispatch();
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [statementOpen, setStatementOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Customers are shared store-wide, but per explicit business decision, editing
  // or deleting one is locked to the outlet it was created at — the store owner
  // bypasses this, matching the backend's assertRecordEditableFromOutlet check.
  const isOwner = !!useAppSelector((state) => state.user.data?.issysgenmasteraccount);
  const isOtherOutlet =
    !isOwner &&
    data.outletid != null &&
    !Number.isNaN(parsedOutletId) &&
    Number(data.outletid) !== parsedOutletId;
  const otherOutletReason = "This customer was created at a different outlet";

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
          variables: { customerid: parseInt(data.customerid), storeid: parsedStoreId, outletid: parsedOutletId },
        });
        if (responseData?.deleteCustomer.success) {
          dispatch(showNotification({ message: responseData.deleteCustomer.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onDeleteSuccess?.();
        }
        return true;
      });
      if (deleteResult.error) dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const canDelete = Number(data.numberofsales) === 0 && !isOtherOutlet;
  const deleteReason = isOtherOutlet
    ? otherOutletReason
    : Number(data.numberofsales) === 0
    ? ""
    : "Cannot delete: customer has existing sales";

  const items: RowActionItem[] = [
    { key: 'view', label: 'Quick View', icon: <Eye size={14} />, onClick: () => setDrawerOpen(true) },
    { key: 'statement', label: 'Statement', icon: <FileText size={14} />, onClick: () => setStatementOpen(true) },
    isOtherOutlet
      ? { key: 'edit', label: 'Edit', icon: <Edit size={14} />, disabled: true, disabledReason: otherOutletReason }
      : { key: 'edit', label: 'Edit', icon: <Edit size={14} />, href: `${basePath}/customers/${data.customerid}/edit` },
    canDelete
      ? { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, onClick: handleDelete, dangerous: true }
      : { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, disabled: true, disabledReason: deleteReason, dangerous: true },
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
        <button
          type="button"
          className="p-1 btn btn-link"
          style={{ lineHeight: 1 }}
          onClick={() => setStatementOpen(true)}
          title="Print Statement"
        >
          <FileText size={14} />
        </button>
        {isOtherOutlet ? (
          <span className="p-1" title={otherOutletReason} style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
            <Edit size={14} style={{ opacity: 0.35 }} />
          </span>
        ) : (
          <Link className="p-1" href={`${basePath}/customers/${data.customerid}/edit`} scroll={false} title="Edit">
            <Edit size={14} />
          </Link>
        )}
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
          <span className="p-1" title={deleteReason} style={{ cursor: "not-allowed", display: "inline-flex", alignItems: "center" }}>
            <Trash2 size={14} style={{ opacity: 0.35 }} />
          </span>
        )}
      </RowActionsWrapper>

      {statementOpen && (
        <CustomerStatementModal customer={data} onClose={() => setStatementOpen(false)} />
      )}
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
