"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";
import Header from "../ui/header/Header";
import Sidebar from "../ui/Sidebar";
import FullPageLoader from "../ui/FullPageLoader";
import useAuth from "@/hooks/useAuth";
import useStores from "@/hooks/useStores";
import useUserData from "@/hooks/useUserData";

const InitialDataLoader = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const { storeId } = useParams();
  const user = useAppSelector((state) => state.user.data);
  const menus = user?.shouldcreatestore ? [] : user?.permissions?.menus;
  const { loading: authLoading, onLogout } = useAuth();
  const { loading: storeLoading, fetchStoresData } = useStores();
  const { fetchUserData, loading: userDataLoading } = useUserData();
  const stores = useAppSelector((state) => state.stores.data);

  useEffect(() => {
    if (stores?.length && !storeId) {
      router.push(`/jw/${stores[0].storeid}/home`);
    }
  }, [storeId, stores, router]);

  useEffect(() => {
    if (!user) {
      fetchUserData();
    }
    if (user && user.permissions) {
      fetchStoresData();
    }
  }, [user, fetchStoresData, fetchUserData]);

  return (
    <>
      {!authLoading && user && (
        <>
          <Header onLogout={onLogout} storeLoading={storeLoading} />
          {!!menus?.length && <Sidebar menus={menus} />}
          {children}
        </>
      )}
      {(authLoading || storeLoading || userDataLoading) && <FullPageLoader />}
    </>
  );
};

export default InitialDataLoader;
