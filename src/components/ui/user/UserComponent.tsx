"use client";

import React, { useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { GET_USERS_LIST_QUERY } from "@/lib/graphql/query/user";
import { useParams } from "next/navigation";
import { UsersListType } from "@/types/user";
import { ColDef, GridReadyEvent, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";
import { getRandomUserAvatar, getShortName } from "@/lib/utils/parse";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import CustomLoadingOverlay from "../grid/CustomLoadingOverlay";
import CustomNoRowsOverlay from "../grid/CustomNoRowsOverlay";

const UserComponent = () => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [getUserListUnderStore] = useLazyQuery(GET_USERS_LIST_QUERY);
  const [users, setUsers] = useState<UsersListType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();

  const columnDefs: ColDef<UsersListType>[] = [
    {
      headerName: "User",
      field: "userfullname",
      filter: true,
      cellRenderer: (params: ICellRendererParams) => (
        <Link
          href={`/`}
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
      ),
    },
    { headerName: "Role", field: "rolename" },
    { headerName: "Outlet", field: "outletname" },
    { headerName: "Phone number", field: "userphone" },
    { headerName: "Email ID", field: "emailaddress" },
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
    <div className="ag-theme-quartz custom-theme">
      <AgGridReact<UsersListType>
        loading={loading}
        rowData={users}
        columnDefs={columnDefs}
        defaultColDef={{
          filter: true,
          flex: 1,
        }}
        gridOptions={{
          rowHeight: 37,
          headerHeight: 50,
        }}
        pagination
        domLayout="autoHeight"
        onGridReady={onGridReady}
        loadingOverlayComponent={CustomLoadingOverlay}
        noRowsOverlayComponent={CustomNoRowsOverlay}
      />
    </div>
  );
};

export default UserComponent;
