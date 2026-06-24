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
import { GET_WAREHOUSES_FOR_CRUD_QUERY } from "@/lib/graphql/query/warehouse";
import { DELETE_WAREHOUSE_MUTATION } from "@/lib/graphql/mutations/warehouseSettings";
import POSGridClient from "../../grid/POSGridClient";
import WarehouseModal, { WarehouseRow } from "./WarehouseModal";

const WarehouseListComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const router = useRouter();
  const dispatch = useDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<WarehouseRow | null>(null);

  const { data, loading, refetch } = useQuery(GET_WAREHOUSES_FOR_CRUD_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const [deleteWarehouse] = useMutation(DELETE_WAREHOUSE_MUTATION);

  const rowData: WarehouseRow[] = useMemo(() => data?.getWarehousesForCRUD ?? [], [data]);

  const handleEdit = useCallback((row: WarehouseRow) => {
    setEditData(row);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (row: WarehouseRow) => {
    const result = await showConfirmationDialog({
      title: "Delete Warehouse?",
      text: `"${row.warehousename}" will be soft-deleted and cannot be used for new transactions.`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const deleteResult = await handleTryCatch(async () => {
      const { data: res } = await deleteWarehouse({
        variables: { storeid: parsedStoreId, warehouseid: row.warehouseid },
      });
      if (res?.deleteWarehouse?.success) {
        dispatch(showNotification({ message: res.deleteWarehouse.message, type: NOTIFICATION_TYPES.SUCCESS }));
        refetch();
      }
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [deleteWarehouse, parsedStoreId, dispatch, refetch]);

  const columnDefs = useMemo<ColDef<WarehouseRow>[]>(() => [
    {
      headerName: "Name",
      field: "warehousename",
      flex: 2,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<WarehouseRow>) => {
        if (!params.data) return null;
        const isDeleted = !!params.data.isdeletedat;
        return (
          <span style={{ color: isDeleted ? "#94a3b8" : "#1e293b", textDecoration: isDeleted ? "line-through" : "none" }}>
            {params.value}
          </span>
        );
      },
    },
    { headerName: "Address", field: "warehouseaddress", flex: 2, minWidth: 140 },
    { headerName: "Phone", field: "warehousephone", flex: 1, minWidth: 120 },
    {
      headerName: "Type",
      field: "issystem",
      width: 110,
      cellRenderer: (params: ICellRendererParams<WarehouseRow>) => {
        if (params.value == null) return null;
        return params.value
          ? <span className="badge bg-primary" style={{ fontSize: 11 }}>System</span>
          : <span className="badge bg-secondary" style={{ fontSize: 11 }}>User</span>;
      },
    },
    {
      headerName: "Status",
      field: "isdeletedat",
      width: 100,
      cellRenderer: (params: ICellRendererParams<WarehouseRow>) => {
        return params.value
          ? <span className="badge bg-danger" style={{ fontSize: 11 }}>Deleted</span>
          : <span className="badge bg-success" style={{ fontSize: 11 }}>Active</span>;
      },
    },
    {
      headerName: "Actions",
      field: "warehouseid",
      width: 100,
      sortable: false,
      filter: false,
      pinned: "right",
      suppressMovable: true,
      suppressHeaderMenuButton: true,
      enableRowGroup: false,
      cellRenderer: (params: ICellRendererParams<WarehouseRow>) => {
        if (!params.data) return null;
        const isDeleted = !!params.data.isdeletedat;
        const isSystem = !!params.data.issystem;
        return (
          <div className="action-table-data">
            <div className="edit-delete-action">
              <a
                className="me-2 p-2"
                href="#"
                onClick={(e) => { e.preventDefault(); if (!isDeleted) handleEdit(params.data!); }}
                title={isDeleted ? "Cannot edit deleted warehouse" : "Edit"}
                style={{ opacity: isDeleted ? 0.35 : 1, pointerEvents: isDeleted ? "none" : "auto" }}
              >
                <Edit className="feather-edit" size={14} />
              </a>
              <a
                className="confirm-text p-2"
                href="#"
                onClick={(e) => { e.preventDefault(); if (!isDeleted && !isSystem) handleDelete(params.data!); }}
                title={isSystem ? "System warehouse cannot be deleted" : isDeleted ? "Already deleted" : "Delete"}
                style={{ opacity: (isDeleted || isSystem) ? 0.35 : 1, pointerEvents: (isDeleted || isSystem) ? "none" : "auto" }}
              >
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
            <h4>Warehouses</h4>
            <h6>Manage store warehouses. System warehouses cannot be deleted.</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            type="button"
            className="btn btn-added"
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
          >
            <Plus size={14} className="me-1" />
            Add Warehouse
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
            getRowStyle={(params) => {
              if (params.data?.isdeletedat) return { background: "#f8fafc", color: "#94a3b8" };
              return undefined;
            }}
          />
        </div>
      </div>

      <WarehouseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={() => refetch()}
        editData={editData}
      />
    </>
  );
};

export default WarehouseListComponent;
