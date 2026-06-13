"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { GET_CUSTOMER_LIST_QUERY } from "@/lib/graphql/query/customer";
import KpiTiles from "./KpiTiles";
import AgingBreakdown from "./AgingBreakdown";
import TopCustomersTable from "./TopCustomersTable";
import AttentionList from "./AttentionList";
import AcquisitionTrend from "./AcquisitionTrend";
import ForecastPanel from "./ForecastPanel";
import CustomerHealthScatter from "./CustomerHealthScatter";
import DashboardCustomer from "./types";
import { num, isSystemAccount } from "./utils";
import { computeDSO } from "./forecast";

const CustomerDashboard = () => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [allOutlets, setAllOutlets] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
      page: 1,
      perpage: 10000,
      filters: [],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId,
    fetchPolicy: "cache-and-network",
  });

  const customers = useMemo<DashboardCustomer[]>(() => {
    const all: DashboardCustomer[] = data?.getCustomerList?.data ?? [];
    if (allOutlets) return all;
    return all.filter((c) => c.outletid === parsedOutletId);
  }, [data, allOutlets, parsedOutletId]);

  // Derived for passing to AgingBreakdown
  const collectionRate = useMemo(() => {
    const named = customers.filter((c) => !isSystemAccount(c));
    const totalSales = named.reduce((s, c) => s + num(c.totalsale), 0);
    const totalAR = named.reduce((s, c) => s + num(c.balancedue), 0);
    return totalSales > 0 ? ((totalSales - totalAR) / totalSales) * 100 : 0;
  }, [customers]);

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const refreshLabel = lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="content">
      {/* Header banner */}
      <div
        className="rounded-3 mb-4 px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{
          background: "linear-gradient(135deg, var(--tile-indigo) 0%, var(--tile-violet) 60%, var(--tile-cyan) 100%)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <div>
          <h4 className="mb-1 text-white fw-bold">Customer Intelligence</h4>
          <p className="mb-0" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            Enterprise A/R dashboard · {allOutlets ? "All outlets" : "Current outlet"} · {customers.filter(c => !isSystemAccount(c)).length} accounts
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Outlet chip */}
          <button
            type="button"
            onClick={() => setAllOutlets((p) => !p)}
            className="btn btn-sm d-inline-flex align-items-center gap-1"
            style={{
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: allOutlets ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "var(--radius-chip)",
              backdropFilter: "blur(4px)",
            }}
          >
            {allOutlets ? "All Outlets" : "This Outlet"}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-sm d-inline-flex align-items-center gap-1"
            style={{
              fontSize: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "var(--radius-chip)",
              backdropFilter: "blur(4px)",
            }}
          >
            <RefreshCw size={12} />
            {loading ? "Refreshing…" : `Updated ${refreshLabel}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          Failed to load customer data: {error.message}
        </div>
      )}

      {/* Row 1: 8 KPI tiles */}
      <KpiTiles customers={customers} loading={loading} />

      {/* Row 2: Forecast Intelligence panel */}
      <div className="mt-3">
        <ForecastPanel customers={customers} loading={loading} />
      </div>

      {/* Row 3: Aging breakdown + Acquisition trend */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-5">
          <AgingBreakdown
            outletid={parsedOutletId}
            allOutlets={allOutlets}
            collectionRate={collectionRate}
          />
        </div>
        <div className="col-12 col-xl-7">
          <AcquisitionTrend customers={customers} loading={loading} />
        </div>
      </div>

      {/* Row 4: Customer Health Scatter (full width marquee widget) */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <CustomerHealthScatter customers={customers} loading={loading} />
        </div>
      </div>

      {/* Row 5: Top customers + Attention list */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-7">
          <TopCustomersTable
            customers={customers}
            loading={loading}
            storeId={parsedStoreId}
            outletId={parsedOutletId}
          />
        </div>
        <div className="col-12 col-xl-5">
          <AttentionList
            customers={customers}
            loading={loading}
            storeId={parsedStoreId}
            outletId={parsedOutletId}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
