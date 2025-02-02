"use client";

import React, { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { GET_ACTIVE_USER } from "@/lib/graphql/query/user";
import { addUser } from "@/lib/store/slice/userDataSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import Header from "../ui/Header";
import Sidebar from "../ui/Sidebar";
import FullPageLoader from "../ui/FullPageLoader";
import { Menus } from "@/types/permissions";
import useAuth from "@/hooks/useAuth";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";

const sidebarMenuCreateStore: Menus = [
  {
    menuid: "1",
    iconurl: "",
    menuurl: "/jw/create/store/",
    children: [
      {
        name: "Admin",
        action: [],
        menuid: 2,
        roleid: "1",
        iconurl: "",
        menuurl: "/jw/create/store/",
        menuname: "Admin",
        parentid: 1,
        slugname: "create_store",
        menuorder: 0,
        storetypeid: 0,
        permissionid: 0,
        permissionname: "",
        permissionorder: 0,
        permissionparentid: 0,
        permissiondescription: "",
        permissiondisplayname: "Create store",
      },
    ],
    menuname: "Store",
    slugname: "store",
    menuorder: 0,
    storetypeid: 0,
  },
];

const UserData = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [getActiveUserInfo] = useLazyQuery(GET_ACTIVE_USER);
  const user = useAppSelector((state) => state.user.data);
  const [loading, setLoading] = useState<boolean>(false);
  const menus = user?.shouldcreatestore
    ? sidebarMenuCreateStore
    : user?.permissions?.menus;
  const { loading: authLoading, onLogout } = useAuth();

  useEffect(() => {
    if (!user) {
      (async () => {
        const result = await handleTryCatch(
          async () => {
            setLoading(true);
            const { data } = await getActiveUserInfo();
            if (data.getActiveUserInfo) {
              const userData = {
                ...data.getActiveUserInfo.data.user,
                permissions: {
                  ...data.getActiveUserInfo.data.user.permissions[0],
                },
              };
              dispatch(addUser(userData));
              if (data.getActiveUserInfo.data.user.shouldcreatestore) {
                router.push("/jw/create/store");
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
    } else {
      if (user.shouldcreatestore) {
        router.push("/jw/create/store");
      }
    }
  }, [dispatch, getActiveUserInfo, router, user]);

  return (
    <>
      {!loading && !authLoading && user && (
        <>
          <Header onLogout={onLogout} />
          <Sidebar menus={menus} />
          {children}
        </>
      )}
      {(loading || authLoading) && <FullPageLoader />}
    </>
  );
};

export default UserData;
