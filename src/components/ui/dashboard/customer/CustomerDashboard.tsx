"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { GET_CUSTOMER_LIST_QUERY } from "@/lib/graphql/query/customer";
import KpiTiles from "./KpiTiles";
import AgingBreakdown from "./AgingBreakdown";
import TopCustomersTable from "./TopCustomersTable";
import AttentionList from "./AttentionList";
import AcquisitionTrend from "./AcquisitionTrend";
import DashboardCustomer from "./types";

const CustomerDashboard = () => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const [allOutlets, setAllOutlets] = useState<boolean>(false);

  const { data, loading, error } = useQuery(GET_CUSTOMER_LIST_QUERY, {
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

  return (
    <div className="content">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3 gap-2">
        <div>
          <h4 className="mb-1">Customers Overview</h4>
          <p className="text-muted mb-0">
            {allOutlets
              ? "All outlets in this store"
              : "Current outlet only"}
          </p>
        </div>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="allOutletsToggle"
            checked={allOutlets}
            onChange={(e) => setAllOutlets(e.target.checked)}
          />
          <label className="form-check-label ms-1" htmlFor="allOutletsToggle">
            Show all outlets
          </label>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          Failed to load customer data: {error.message}
        </div>
      )}

      <KpiTiles customers={customers} loading={loading} />

      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-6">
          <AgingBreakdown
            outletid={parsedOutletId}
            allOutlets={allOutlets}
          />
        </div>
        <div className="col-12 col-xl-6">
          <AcquisitionTrend customers={customers} loading={loading} />
        </div>
      </div>

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
