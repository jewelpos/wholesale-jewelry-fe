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
import { setCurrencyCode } from "@/lib/utils/currencyFormat";
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
  const storeCurrencyCode = useAppSelector((state) => state.store.data?.currencycode);

  useEffect(() => {
    setCurrencyCode(storeCurrencyCode);
  }, [storeCurrencyCode]);

  useEffect(() => {
    if (stores?.length && (!storeId || !outletId)) {
      const defaultStore = stores.find((s) =>
        s.outlets?.find((o) => o.isdefaultoutlet)
      );
      const storeIsSetup =
        defaultStore?.hassetupoutlet || defaultStore?.hassetupproduct;
      const roleid = user?.roleid;
      const dashboardByRole: Record<number, string> = {
        1: "dashboard/admin",
        2: "dashboard/manager",
        3: "dashboard/cashier",
      };
      const getLandingPage = (setup: boolean | undefined) => {
        if (!setup) return "home";
        return dashboardByRole[roleid] ?? "dashboard/admin";
      };
      if (defaultStore) {
        const prefix = defaultStore.routeprefix ?? "jw";
        router.push(
          `/${prefix}/${defaultStore?.storeid}/${
            defaultStore?.outlets?.find((o) => o.isdefaultoutlet)?.outletid
          }/${getLandingPage(storeIsSetup)}`
        );
      } else {
        const prefix = stores[0].routeprefix ?? "jw";
        router.push(
          `/${prefix}/${stores[0].storeid}/${stores[0]?.outlets?.[0]?.outletid}/${getLandingPage(
            stores[0]?.hassetupoutlet || stores[0]?.hassetupproduct
          )}`
        );
      }
    }
  }, [storeId, outletId, stores, router, user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user && !user.shouldcreatestore) {
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
