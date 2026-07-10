"use client";

import React, { useCallback, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";
import { useParams } from "next/navigation";
import { UsersListType } from "@/types/user";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { getRandomUserAvatar, getShortName } from "@/lib/utils/parse";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import UserListHeader from "./UserListHeader";
import POSGridClient from "../grid/POSGridClient";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useRouter } from "next/navigation";
import ActionFooter from "../ActionFooter";
import CustomFilterSections from "../grid/CustomFilterSections";
import { AgGridReact } from "ag-grid-react";
import { useDebounce } from "@/hooks/useDebounce";
import UserActions from "./UserActions";

const StatusBadge = ({ value, trueLabel = "Yes", falseLabel = "No" }: { value: number | null; trueLabel?: string; falseLabel?: string }) => {
  if (value === null || value === undefined) return <span className="badge bg-secondary">—</span>;
  return value
    ? <span className="badge bg-success">{trueLabel}</span>
    : <span className="badge bg-danger">{falseLabel}</span>;
};

const UserComponent = () => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [getUserListUnderStore] = useLazyQuery(GET_USERS_LIST_QUERY);
  const [users, setUsers] = useState<UsersListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const dispatch = useAppDispatch();
  const { basePath } = useDefaultRoute();
  const router = useRouter();
  const gridRef = useRef<AgGridReact>(null);

  const loadUsers = useCallback(async () => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getUserListUnderStore({
          variables: { storeid: parsedStoreId },
        });
        if (data.getUserListUnderStore) {
          setUsers(data.getUserListUnderStore);
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [dispatch, getUserListUnderStore, parsedStoreId]);

  const onGridReady = useCallback(() => loadUsers(), [loadUsers]);

  const filteredUsers = debouncedSearch
    ? users.filter((u) => {
        const q = debouncedSearch.toLowerCase();
        return (
          u.userfullname?.toLowerCase().includes(q) ||
          u.emailaddress?.toLowerCase().includes(q) ||
          u.userphone?.toLowerCase().includes(q) ||
          u.rolename?.toLowerCase().includes(q) ||
          u.outletname?.toLowerCase().includes(q)
        );
      })
    : users;

  const columnDefs: ColDef[] = [
    {
      headerName: "User",
      field: "userfullname",
      filter: true,
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return null;
        return (
          <Link
            href={`${basePath}/users/${params?.data?.id}`}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span className={`avatar avatar-sm ${getRandomUserAvatar()} avatar-rounded me-1`}>
              <span className="avatar-title">{getShortName(params.value)}</span>
            </span>
            <p className="text-primary mb-0">{params.value}</p>
          </Link>
        );
      },
    },
    { headerName: "Role", field: "rolename", filter: true, minWidth: 120 },
    { headerName: "Outlet", field: "outletname", filter: true, minWidth: 140 },
    { headerName: "Phone", field: "userphone", filter: true, minWidth: 130 },
    { headerName: "Email", field: "emailaddress", filter: true, minWidth: 180 },
    {
      headerName: "Created",
      field: "creationdatetime",
      filter: "agDateColumnFilter",
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        const d = new Date(Number(params.value));
        if (isNaN(d.getTime())) return "—";
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${m}/${day}/${d.getFullYear()}`;
      },
    },
    {
      headerName: "OTP Verified",
      field: "otpverified",
      filter: true,
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams) => (
        <StatusBadge value={params.value} trueLabel="Verified" falseLabel="No" />
      ),
    },
    {
      headerName: "Email Verified",
      field: "emailverified",
      filter: true,
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams) => (
        <StatusBadge value={params.value} trueLabel="Verified" falseLabel="No" />
      ),
    },
    {
      headerName: "Enabled",
      field: "isenabled",
      filter: true,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams) => (
        <StatusBadge value={params.value} trueLabel="Active" falseLabel="Disabled" />
      ),
    },
    {
      headerName: "Deleted At",
      field: "deletedat",
      filter: true,
      minWidth: 130,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        const d = new Date(Number(params.value));
        if (isNaN(d.getTime())) return "—";
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${m}/${day}/${d.getFullYear()}`;
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      sortable: false,
      filter: false,
      minWidth: 120,
      maxWidth: 130,
      pinned: "right" as const,
      suppressMovable: true,
      suppressHeaderMenuButton: true,
      enableRowGroup: false,
      cellRenderer: (params: ICellRendererParams<UsersListType>) =>
        params.data ? (
          <UserActions data={params.data} onRefresh={loadUsers} />
        ) : null,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <UserListHeader />
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CustomFilterSections
            gridRef={gridRef}
            search={search}
            setSearch={setSearch}
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGridClient
              ref={gridRef}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              rowData={filteredUsers}
              loading={loading}
              pagination
              rowHeight={44}
              fillHeight
              rowGroupPanelShow="never"
            />
          </div>
        </div>
      </div>
      <ActionFooter handleCancel={() => router.back()} cancelLabel="Close" />
    </div>
  );
};

export default UserComponent;
