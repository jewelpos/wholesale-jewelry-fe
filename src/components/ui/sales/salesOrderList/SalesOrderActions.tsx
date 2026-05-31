"use client";

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useMutation, useLazyQuery } from "@apollo/client";
import { DELETE_SALES_ORDER_MUTATION, UPDATE_SALES_ORDER_STATUS_MUTATION } from "@/lib/graphql/mutations/sales";
import { GET_SALES_ORDER_STATUS_LIST_QUERY } from "@/lib/graphql/query/sales";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { SalesOrderListType } from "@/types/sales";
import Link from "next/link";
import { Edit, Trash2, RefreshCw } from "react-feather";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";

const MySwal = withReactContent(Swal);

interface SalesOrderActionsProps {
  data: SalesOrderListType;
}

const SalesOrderActions: React.FC<SalesOrderActionsProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<{ orderstatusid: number; statusname: string }[]>([]);

  const [deleteSalesOrder] = useMutation(DELETE_SALES_ORDER_MUTATION);
  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_SALES_ORDER_STATUS_MUTATION);
  const [fetchStatuses] = useLazyQuery(GET_SALES_ORDER_STATUS_LIST_QUERY, { fetchPolicy: "network-only" });

  // Guard: AG Grid may render cell renderers with undefined data during load
  if (!data) return null;

  const handleOpenStatusModal = async () => {
    setSelectedStatusId(null);
    setShowStatusModal(true);
    if (statuses.length === 0 && parsedStoreId) {
      const result = await handleTryCatch(async () => {
        const { data: res } = await fetchStatuses({ variables: { storeid: parsedStoreId } });
        setStatuses(res?.getSalesOrderStatusList ?? []);
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    }
  };

  const handleDelete = async () => {
    const confirm = await MySwal.fire({
      title: "Delete Sales Order?",
      text: `Sales Order #${data.salesorderno} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    const result = await handleTryCatch(async () => {
      const { data: res } = await deleteSalesOrder({
        variables: { salesorderno: data.salesorderno, outletid: data.outletid },
      });
      if (res?.deleteSalesOrder?.success) {
        dispatch(showNotification({ message: res.deleteSalesOrder.message, type: NOTIFICATION_TYPES.SUCCESS }));
        window.location.reload();
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatusId) return;
    const result = await handleTryCatch(async () => {
      const { data: res } = await updateStatus({
        variables: {
          input: {
            storeid: parsedStoreId,
            salesorderno: Number(data.salesorderno),
            orderstatusid: selectedStatusId,
          },
        },
      });
      if (res?.updateSalesOrderStatus?.success) {
        dispatch(showNotification({ message: "Status updated successfully", type: NOTIFICATION_TYPES.SUCCESS }));
        setShowStatusModal(false);
        window.location.reload();
      }
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <>
      <div className="action-table-data">
        <div className="edit-delete-action">
          <Link
            className="me-2 p-2"
            href={`${basePath}/sales/new_sales_order/${data.salesorderno}`}
            scroll={false}
            title="Edit"
          >
            <Edit className="feather-edit" />
          </Link>
          <button
            type="button"
            className="me-2 p-2 btn btn-link"
            style={{ lineHeight: 1 }}
            onClick={handleOpenStatusModal}
            title="Change Status"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="p-2 btn btn-link text-danger"
            style={{ lineHeight: 1 }}
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="feather-trash-2" />
          </button>
        </div>
      </div>

      {showStatusModal && typeof document !== "undefined" && ReactDOM.createPortal(
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Order Status</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Sales Order #{data.salesorderno}</p>
                {statuses.length === 0 ? (
                  <div className="text-center py-2"><div className="spinner-border spinner-border-sm" /></div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s.orderstatusid}
                        type="button"
                        className={`btn btn-sm ${selectedStatusId === s.orderstatusid ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSelectedStatusId(s.orderstatusid)}
                      >
                        {s.statusname}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleStatusChange}
                  disabled={!selectedStatusId || updatingStatus}
                >
                  {updatingStatus ? "Saving..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SalesOrderActions;
