"use client";

import React, { useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
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
import CustomLoadingOverlay from "../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../grid/CustomNoRowsOverlay";
import UserListHeader from "./UserListHeader";
import POSGridClient from "../grid/POSGridClient";
// import UserActions from "./UserActions";
import useDefaultRoute from "@/hooks/useDefaultRoute";

const UserComponent = () => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [getUserListUnderStore] = useLazyQuery(GET_USERS_LIST_QUERY);
  const [users, setUsers] = useState<UsersListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
  const { basePath } = useDefaultRoute();

  const columnDefs: ColDef[] = [
    {
      headerName: "User",
      field: "userfullname",
      filter: true,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return null;
        return (
          <Link
            href={`${basePath}/users/${params?.data?.id}`}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              className={`avatar avatar-sm ${getRandomUserAvatar()} avatar-rounded me-1`}
            >
              <span className="avatar-title">{getShortName(params.value)}</span>
            </span>
            <div>
              <p className="text-primary">{params.value}</p>
            </div>
          </Link>
        );
      },
    },
    { headerName: "Role", field: "rolename" },
    { headerName: "Outlet", field: "outletname" },
    { headerName: "Phone number", field: "userphone" },
    { headerName: "Email ID", field: "emailaddress" },
    // {
    //   headerName: "Actions",
    //   field: "actions",
    //   cellRenderer: (params: ICellRendererParams<UsersListType>) =>
    //     params.data ? <UserActions data={params.data} /> : null,
    //   width: 120,
    //   sortable: false,
    //   filter: false,
    //   maxWidth: 150,
    //   pinned: "right",
    //   suppressSizeToFit: false,
    //   suppressMovable: true,
    //   suppressHeaderMenuButton: true,
    //   enableRowGroup: false,
    // },
  ];

  const onGridReady = useCallback(async () => {
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
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  }, [dispatch, getUserListUnderStore, parsedStoreId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <UserListHeader />
      <div className="card table-list-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginBottom: 0 }}>
        <div className="card-body p-2" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <POSGridClient
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              loadingOverlayComponent={CustomLoadingOverlay}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              rowData={users}
              loading={loading}
              pagination
              rowHeight={44}
              fillHeight
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserComponent;
