"use client";

import React, { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { GET_ACTIVE_USER } from "@/lib/graphql/query/user";
import { addUser } from "@/lib/store/slice/userDataSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import Header from "../ui/header/Header";
import Sidebar from "../ui/Sidebar";
import FullPageLoader from "../ui/FullPageLoader";
import useAuth from "@/hooks/useAuth";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_STORES } from "@/lib/graphql/query/store";
import { addStores } from "@/lib/store/slice/storesSlice";

const UserData = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [getActiveUserInfo] = useLazyQuery(GET_ACTIVE_USER);
  const [getStores] = useLazyQuery(GET_STORES);
  const user = useAppSelector((state) => state.user.data);
  const [loading, setLoading] = useState<boolean>(false);
  const menus = user?.shouldcreatestore ? [] : user?.permissions?.menus;
  const { loading: authLoading, onLogout } = useAuth();

  const fetchStoreData = async () => {
    const result = await handleTryCatch(
      async () => {
        setLoading(true);
        const { data } = await getStores();
        if (data.getStores) {
          dispatch(addStores(data.getStores));
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
  };

  useEffect(() => {
    if (!user) {
      (async () => {
        const result = await handleTryCatch(
          async () => {
            setLoading(true);
            const { data } = await getActiveUserInfo();
            if (data.getActiveUserInfo) {
              let userData = { ...data.getActiveUserInfo.data.user };
              if (data.getActiveUserInfo.data.user.permissions) {
                userData = {
                  ...userData,
                  permissions: {
                    ...data.getActiveUserInfo.data.user.permissions[0],
                  },
                };
              }
              dispatch(addUser(userData));
              if (!data.getActiveUserInfo.data.user.shouldcreatestore) {
                fetchStoreData();
              }
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
      })();
    }
  }, [dispatch, getActiveUserInfo, router, user]);

  return (
    <>
      {!loading && !authLoading && user && (
        <>
          <Header onLogout={onLogout} />
          {menus?.length && <Sidebar menus={menus} />}
          {children}
        </>
      )}
      {(loading || authLoading) && <FullPageLoader />}
    </>
  );
};

export default UserData;
