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
import { Edit, Eye, Mail, Printer, Trash2, RefreshCw } from "react-feather";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useParams } from "next/navigation";
import { GridApi, IRowNode } from "ag-grid-community";
import axiosApi from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import PdfPreviewModal from "@/components/ui/common/PdfPreviewModal";
import DocumentEmailModal from "@/components/ui/sales/DocumentEmailModal";

const MySwal = withReactContent(Swal);

interface SalesOrderActionsProps {
  data: SalesOrderListType;
  node: IRowNode<SalesOrderListType>;
  api: GridApi<SalesOrderListType>;
}

const SalesOrderActions: React.FC<SalesOrderActionsProps> = ({ data, node, api }) => {
  const dispatch = useAppDispatch();
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const config = getEnvironmentConfig();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<{ orderstatusid: number; statusname: string }[]>([]);
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  const [deleteSalesOrder] = useMutation(DELETE_SALES_ORDER_MUTATION);
  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_SALES_ORDER_STATUS_MUTATION);
  const [fetchStatuses] = useLazyQuery(GET_SALES_ORDER_STATUS_LIST_QUERY, { fetchPolicy: "network-only" });

  if (!data) return null;

  const ALLOWED_STATUS_NAMES = ["pending", "confirmed", "cancelled", "on hold", "backordered"];

  const currentStatus = data.statusname?.toLowerCase() ?? "";
  const isPending = currentStatus === "pending";
  const isInvoiceCreated = !!data.orderprocesseddate;
  const canEdit = isPending;
  const canDelete = isPending;
  const canChangeStatus = !isInvoiceCreated;

  const editReason = isInvoiceCreated
    ? "Cannot edit: invoice already created from this order"
    : "Cannot edit: only Pending orders can be edited";
  const deleteReason = isInvoiceCreated
    ? "Cannot delete: invoice already created from this order"
    : "Cannot delete: only Pending orders can be deleted";
  const statusReason = "Cannot change status: invoice already created from this order";

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await axiosApi.post(
        `${config.apiUrl}/store/sales-order/print`,
        { storeid: parsedStoreId, salesordernumbers: [Number(data.salesorderno)] },
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        setPdfUrl(url);
      }
    } catch {
      dispatch(showNotification({ message: "Failed to generate PDF", type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setPrinting(false);
    }
  };

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
        api.applyServerSideTransaction({ remove: [data] });
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
        const newStatusName = statuses.find((s) => s.orderstatusid === selectedStatusId)?.statusname ?? data.statusname;
        node.setData({ ...data, statusname: newStatusName });
        dispatch(showNotification({ message: "Status updated successfully", type: NOTIFICATION_TYPES.SUCCESS }));
        setShowStatusModal(false);
      }
      return true;
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const iconBtn: React.CSSProperties = { lineHeight: 1 };
  const dimmed: React.CSSProperties = { cursor: "not-allowed", display: "inline-flex", alignItems: "center" };

  return (
    <>
      <div className="action-table-data">
        <div className="edit-delete-action" style={{ gap: "2px" }}>

          {/* Print */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#0d6efd" }}
            onClick={handlePrint} disabled={printing} title="Print Sales Order">
            <Printer size={14} />
          </button>

          {/* Email */}
          <button type="button" className="p-1 btn btn-link" style={{ ...iconBtn, color: "#6f42c1" }}
            onClick={() => setShowEmail(true)} title="Email Sales Order">
            <Mail size={14} />
          </button>

          {/* View */}
          <Link className="p-1" href={`${basePath}/sales/view_sales_order/${data.salesorderno}`} scroll={false} title="View">
            <Eye size={14} />
          </Link>

          {/* Edit */}
          {canEdit ? (
            <Link className="p-1" href={`${basePath}/sales/new_sales_order/${data.salesorderno}`} scroll={false} title="Edit">
              <Edit size={14} className="feather-edit" />
            </Link>
          ) : (
            <span className="p-1" title={editReason} style={dimmed}>
              <Edit size={14} style={{ opacity: 0.35 }} />
            </span>
          )}

          {/* Change Status */}
          {canChangeStatus ? (
            <button type="button" className="p-1 btn btn-link" style={iconBtn}
              onClick={handleOpenStatusModal} title="Change Status">
              <RefreshCw size={14} />
            </button>
          ) : (
            <span className="p-1" title={statusReason} style={dimmed}>
              <RefreshCw size={14} style={{ opacity: 0.35 }} />
            </span>
          )}

          {/* Delete */}
          {canDelete ? (
            <button type="button" className="p-1 btn btn-link text-danger" style={iconBtn}
              onClick={handleDelete} title="Delete">
              <Trash2 size={14} />
            </button>
          ) : (
            <span className="p-1" title={deleteReason} style={dimmed}>
              <Trash2 size={14} style={{ opacity: 0.35 }} />
            </span>
          )}
        </div>
      </div>

      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          filename={`sales-order-${data.salesorderno}.pdf`}
          onClose={() => setPdfUrl(null)}
        />
      )}

      {showEmail && (
        <DocumentEmailModal
          storeId={parsedStoreId}
          documentType="SALES_ORDER"
          documentNumbers={[Number(data.salesorderno)]}
          onClose={() => setShowEmail(false)}
          onSent={(msg) => { setShowEmail(false); dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.SUCCESS })); }}
          onError={(msg) => dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }))}
        />
      )}

      {showStatusModal && typeof document !== "undefined" && ReactDOM.createPortal(
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Order Status</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Sales Order #{data.salesorderno} &mdash; Current: <strong>{data.statusname}</strong></p>
                {statuses.length === 0 ? (
                  <div className="text-center py-2"><div className="spinner-border spinner-border-sm" /></div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {statuses
                      .filter((s) =>
                        ALLOWED_STATUS_NAMES.includes(s.statusname.toLowerCase()) &&
                        s.statusname.toLowerCase() !== currentStatus
                      )
                      .map((s) => (
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
