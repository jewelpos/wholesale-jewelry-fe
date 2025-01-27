"use client";

import React, { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { GET_ACTIVE_USER } from "@/lib/graphql/query/user";
import { addUser, clearUser } from "@/lib/store/slice/userDataSlice";
import { errorMessage } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import Header from "../ui/Header";
import Sidebar from "../ui/Sidebar";
import FullPageLoader from "../ui/FullPageLoader";

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

  useEffect(() => {
    if (!user) {
      (async () => {
        try {
          setLoading(true);
          const { data } = await getActiveUserInfo();
          if (data.getActiveUserInfo) {
            dispatch(addUser(data.getActiveUserInfo.data.user));
            if (data.getActiveUserInfo.data.user.shouldcreatestore) {
              router.push("/jw/create/store");
            }
          }
        } catch (error: any) {
          dispatch(
            showNotification({
              message: errorMessage(error),
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
        } finally {
          setLoading(false);
        }
      })();
    } else {
      if (user.shouldcreatestore) {
        router.push("/jw/create/store");
      }
    }
  }, []);

  const onLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error("Logout failed");
      }
      dispatch(clearUser());
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!loading && user && (
        <>
          <Header onLogout={onLogout} />
          <Sidebar />
          {children}
        </>
      )}
      {loading && <FullPageLoader />}
    </>
  );
};

export default UserData;
