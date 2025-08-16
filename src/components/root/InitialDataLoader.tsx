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
import "ag-grid-enterprise";
import { LicenseManager } from "ag-grid-enterprise";

if (typeof window !== "undefined") {
  const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY || "";
  LicenseManager.setLicenseKey(licenseKey);
}

const InitialDataLoader = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const router = useRouter();
  const { storeId, outletId } = useParams();
  const user = useAppSelector((state) => state.user.data);
  const menus = user?.shouldcreatestore ? [] : user?.permissions?.menus;
  const { loading: authLoading, onLogout } = useAuth();
  const { loading: storeLoading, fetchStoresData } = useStores();
  const { fetchUserData, loading: userDataLoading } = useUserData();
  const stores = useAppSelector((state) => state.stores.data);

  useEffect(() => {
    if (stores?.length && (!storeId || !outletId)) {
      const defaultStore = stores.find((s) =>
        s.outlets?.find((o) => o.isdefaultoutlet)
      );
      if (defaultStore) {
        router.push(
          `/jw/${defaultStore?.storeid}/${
            defaultStore?.outlets?.find((o) => o.isdefaultoutlet)?.outletid
          }/home`
        );
      } else {
        router.push(
          `/jw/${stores[0].storeid}/${stores[0]?.outlets?.[0]?.outletid}/home`
        );
      }
    }
  }, [storeId, outletId, stores, router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user && user.permissions) {
      fetchStoresData();
    }
  }, [user, fetchStoresData]);

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
