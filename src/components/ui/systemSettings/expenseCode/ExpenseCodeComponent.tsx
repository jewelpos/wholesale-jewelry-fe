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
import { GET_EXPENSE_CODE_QUERY } from "@/lib/graphql/query/accounts";
import { DELETE_EXPENSE_CODE_MUTATION } from "@/lib/graphql/mutations/expenses";
import POSGridClient from "../../grid/POSGridClient";
import ExpenseCodeModal, { ExpenseCodeRow } from "./ExpenseCodeModal";

const ExpenseCodeComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const router = useRouter();
  const dispatch = useDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<ExpenseCodeRow | null>(null);

  const { data, loading, refetch } = useQuery(GET_EXPENSE_CODE_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const [deleteExpenseCode] = useMutation(DELETE_EXPENSE_CODE_MUTATION);

  const rowData: ExpenseCodeRow[] = useMemo(() => data?.getExpenseCode ?? [], [data]);

  const handleEdit = useCallback((row: ExpenseCodeRow) => {
    setEditData(row);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (row: ExpenseCodeRow) => {
    const result = await showConfirmationDialog({
      title: "Delete Expense Code?",
      text: `"${row.accountdescription}" will be permanently removed.`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const deleteResult = await handleTryCatch(async () => {
      const { data: res } = await deleteExpenseCode({
        variables: { expensecode: row.expensecode, storeid: parsedStoreId },
      });
      if (res?.deleteExpenseCode?.success) {
        dispatch(showNotification({ message: res.deleteExpenseCode.message, type: NOTIFICATION_TYPES.SUCCESS }));
        refetch();
      }
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [deleteExpenseCode, parsedStoreId, dispatch, refetch]);

  const columnDefs = useMemo<ColDef<ExpenseCodeRow>[]>(() => [
    {
      headerName: "ID",
      field: "expensecode",
      width: 80,
      cellStyle: { textAlign: "center", fontWeight: 600, color: "#64748b" },
    },
    { headerName: "Description", field: "accountdescription", flex: 3, minWidth: 180 },
    { headerName: "Account Type", field: "accounttype", flex: 2, minWidth: 130 },
    {
      headerName: "Actions",
      field: "expensecode",
      width: 100,
      sortable: false,
      filter: false,
      pinned: "right",
      suppressMovable: true,
      suppressHeaderMenuButton: true,
      enableRowGroup: false,
      cellRenderer: (params: ICellRendererParams<ExpenseCodeRow>) => {
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
            <h4>Expense Codes</h4>
            <h6>Manage expense categories used when recording business expenses</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            type="button"
            className="btn btn-added"
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
          >
            <Plus size={14} className="me-1" />
            Add Expense Code
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

      <ExpenseCodeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={() => refetch()}
        editData={editData}
        outletId={parsedOutletId}
      />
    </>
  );
};

export default ExpenseCodeComponent;
