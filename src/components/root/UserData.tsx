"use client";

import React, { useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
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
import { GET_STORE, GET_STORES } from "@/lib/graphql/query/store";

const UserData = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const dispatch = useAppDispatch();
  const [getActiveUserInfo] = useLazyQuery(GET_ACTIVE_USER);
  const user = useAppSelector((state) => state.user.data);
  const {
    loading: storesLoading,
    error: storesError,
    data: storesData,
  } = useQuery(GET_STORES, {
    variables: { storeId },
  });
  const {
    loading: storeLoading,
    error: storeError,
    data: storeData,
  } = useQuery(GET_STORE, {
    variables: { storeid: parsedStoreId },
    skip: !storeId,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const menus = user?.shouldcreatestore ? [] : user?.permissions?.menus;
  const { loading: authLoading, onLogout } = useAuth();
  const stores = storesData?.getStores;
  const store = storeData?.getStore;

  if (storeError || storesError) {
    console.log("not found");
  }

  useEffect(() => {
    if (stores?.length && !storeId) {
      router.push(`/jw/${stores[0].storeid}/home`);
    }
  }, [storeId, stores, router]);

  useEffect(() => {
    if (!user || !user.permissions) {
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
          <Header
            onLogout={onLogout}
            stores={stores}
            store={store}
            storeLoading={storesLoading || storeLoading}
          />
          {!!menus?.length && <Sidebar menus={menus} />}
          {children}
        </>
      )}
      {(loading || authLoading || storesLoading || storeLoading) && (
        <FullPageLoader />
      )}
    </>
  );
};

export default UserData;
