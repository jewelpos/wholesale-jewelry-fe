"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Edit, Trash2, Plus } from "react-feather";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import { GET_PAYMENT_MODE_LIST_QUERY } from "@/lib/graphql/query/paymentMode";
import { DELETE_PAYMENT_MODE_MUTATION } from "@/lib/graphql/mutations/paymentMode";
import POSGridClient from "../../grid/POSGridClient";
import PaymentModeModal, { PaymentModeRow } from "./PaymentModeModal";

const PaymentModeComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const router = useRouter();
  const dispatch = useDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<PaymentModeRow | null>(null);

  const { data, loading, refetch } = useQuery(GET_PAYMENT_MODE_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const [deletePaymentMode] = useMutation(DELETE_PAYMENT_MODE_MUTATION);

  const rowData: PaymentModeRow[] = useMemo(() => data?.getPaymentExpenseModes ?? [], [data]);

  const handleEdit = useCallback((row: PaymentModeRow) => {
    setEditData(row);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (row: PaymentModeRow) => {
    const result = await showConfirmationDialog({
      title: "Delete Payment Mode?",
      text: `"${row.paymode}" will be permanently removed.`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const deleteResult = await handleTryCatch(async () => {
      const { data: res } = await deletePaymentMode({
        variables: { paymentmodeid: row.paymentmodeid, storeid: parsedStoreId },
      });
      if (res?.deletePaymentMode?.success) {
        dispatch(showNotification({ message: res.deletePaymentMode.message, type: NOTIFICATION_TYPES.SUCCESS }));
        refetch();
      }
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [deletePaymentMode, parsedStoreId, dispatch, refetch]);

  const columnDefs = useMemo<ColDef<PaymentModeRow>[]>(() => [
    { headerName: "Payment Mode", field: "paymode", flex: 2, minWidth: 160 },
    { headerName: "Description", field: "paymodedescription", flex: 3, minWidth: 200 },
    {
      headerName: "Actions",
      field: "paymentmodeid",
      width: 100,
      sortable: false,
      filter: false,
      pinned: "right",
      suppressMovable: true,
      suppressHeaderMenuButton: true,
      enableRowGroup: false,
      cellRenderer: (params: ICellRendererParams<PaymentModeRow>) => {
        if (!params.data) return null;
        return (
          <div className="action-table-data">
            <div className="edit-delete-action">
              <a className="me-2 p-2" href="#" onClick={(e) => { e.preventDefault(); handleEdit(params.data!); }}>
                <Edit className="feather-edit" size={14} />
              </a>
              <a className="confirm-text p-2" href="#" onClick={(e) => { e.preventDefault(); handleDelete(params.data!); }}>
                <Trash2 className="feather-trash-2" size={14} />
              </a>
            </div>
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete]);

  return (
    <>
      <div className="page-header">
        <div className="add-item d-flex flex-column">
          <button
            type="button"
            onClick={() => router.push(`/jw/${storeIdParam}/${outletIdParam}/settings/system_settings`)}
            style={{ background: "none", border: "none", padding: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", cursor: "pointer" }}
          >
            ← System Settings
          </button>
          <div className="page-title">
            <h4>Payment Modes</h4>
            <h6>Manage payment methods used during checkout and invoicing</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            type="button"
            className="btn btn-added"
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
          >
            <Plus size={14} className="me-1" />
            Add Payment Mode
          </button>
        </div>
      </div>

      <div className="card table-list-card">
        <div className="card-body p-2">
          <POSGridClient
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={rowData}
            loading={loading}
            onGridReady={() => {}}
            defaultColDef={{ filter: true, sortable: true }}
          />
        </div>
      </div>

      <PaymentModeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={() => refetch()}
        editData={editData}
        outletId={parsedOutletId}
      />
    </>
  );
};

export default PaymentModeComponent;
