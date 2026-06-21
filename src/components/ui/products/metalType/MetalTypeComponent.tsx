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
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { DELETE_METAL_TYPE_MUTATION } from "@/lib/graphql/mutations/metalType";
import POSGridClient from "../../grid/POSGridClient";
import MetalTypeModal, { MetalTypeRow } from "./MetalTypeModal";

const StatusPill = ({ value }: { value: string }) => {
  const isActive = value === "Active";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: isActive ? "#dcfce7" : "#f1f5f9",
      color: isActive ? "#16a34a" : "#64748b",
    }}>
      {value}
    </span>
  );
};

const MetalTypeComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const router = useRouter();
  const dispatch = useDispatch();
  const gridRef = useRef<AgGridReact>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<MetalTypeRow | null>(null);

  const { data, loading, refetch } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const [deleteMetalType] = useMutation(DELETE_METAL_TYPE_MUTATION);

  const rowData: MetalTypeRow[] = useMemo(() => data?.getMetalTypeList ?? [], [data]);

  const handleEdit = useCallback((row: MetalTypeRow) => {
    setEditData(row);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (row: MetalTypeRow) => {
    const result = await showConfirmationDialog({
      title: "Delete Metal Type?",
      text: `"${row.metalname}" will be permanently removed.`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!result.isConfirmed) return;

    const deleteResult = await handleTryCatch(async () => {
      const { data: res } = await deleteMetalType({
        variables: { metaltypeid: row.metaltypeid, storeid: parsedStoreId },
      });
      if (res?.deleteMetalType?.success) {
        dispatch(showNotification({ message: res.deleteMetalType.message, type: NOTIFICATION_TYPES.SUCCESS }));
        refetch();
      }
      return true;
    });
    if (deleteResult.error) {
      dispatch(showNotification({ message: deleteResult.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [deleteMetalType, parsedStoreId, dispatch, refetch]);

  const columnDefs = useMemo<ColDef<MetalTypeRow>[]>(() => [
    { headerName: "Metal Name", field: "metalname", flex: 2, minWidth: 140 },
    { headerName: "Code", field: "metalcode", width: 90, valueFormatter: (p) => p.value ?? "—" },
    { headerName: "Rates Column", field: "ratescolumn", flex: 2, minWidth: 140, valueFormatter: (p) => p.value ?? "—" },
    {
      headerName: "Default %",
      field: "metalpercent",
      width: 110,
      valueFormatter: (p) => p.value != null ? `${p.value}%` : "—",
    },
    {
      headerName: "Status",
      field: "metalstatus",
      width: 110,
      cellRenderer: (p: ICellRendererParams) => p.value ? <StatusPill value={p.value} /> : null,
    },
    {
      headerName: "Actions",
      field: "metaltypeid",
      width: 100,
      sortable: false,
      filter: false,
      pinned: "right",
      suppressMovable: true,
      suppressHeaderMenuButton: true,
      enableRowGroup: false,
      cellRenderer: (params: ICellRendererParams<MetalTypeRow>) => {
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
            <h4>Metal Types</h4>
            <h6>Manage metal types shown in the product form dropdown</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            type="button"
            className="btn btn-added"
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
          >
            <Plus size={14} className="me-1" />
            Add Metal Type
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

      <MetalTypeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditData(null); }}
        onSuccess={() => refetch()}
        editData={editData}
      />
    </>
  );
};

export default MetalTypeComponent;
