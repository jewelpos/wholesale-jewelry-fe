"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import {
  GET_PAYMENT_COLLECTION_STATS_QUERY,
  GET_MONTHLY_PAYMENT_PIVOT_QUERY,
  GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY,
} from "@/lib/graphql/query/reports";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { currentYear, yearFilter } from "@/components/ui/dashboard/admin/utils";
import CollectionKpiStrip from "./CollectionKpiStrip";
import MonthlyCollectionChart from "./MonthlyCollectionChart";
import DailyCollectionBar from "./DailyCollectionBar";
import WarehouseBreakdown from "./WarehouseBreakdown";
import RecentPaymentsTable from "./RecentPaymentsTable";
import PaymentModeDonut from "@/components/ui/dashboard/sales/PaymentModeDonut";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NO_FILTER: never[] = [];

const PaymentDashboard = () => {
  const params = useParams();
  const storeId = parseInt(params.storeId as string, 10);
  const outletId = parseInt(params.outletId as string, 10);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const { data: warehouseData } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: outletId },
    skip: !outletId,
  });
  const warehouses: { warehouseid: number; warehousename: string }[] =
    warehouseData?.getWarehousesByOutletId ?? [];

  const statsVars = {
    storeid: storeId,
    outletid: outletId,
    warehouseid: selectedWarehouseId,
  };

  const pivotVars = {
    storeid: storeId,
    outletid: outletId,
    warehouseid: selectedWarehouseId,
    page: 1,
    perpage: 2000,
    filters: yearFilter(selectedYear),
    sortModel: NO_FILTER,
    rowGroupCols: NO_FILTER,
    groupKeys: NO_FILTER,
  };

  // Fetch the full year of daily data; DailyCollectionBar picks the right month by matching month_display
  const dailyVars = {
    ...pivotVars,
  };

  const { data: statsData, loading: statsLoading } = useQuery(GET_PAYMENT_COLLECTION_STATS_QUERY, {
    variables: statsVars,
    skip: !storeId,
  });

  const { data: monthlyData, loading: monthlyLoading } = useQuery(GET_MONTHLY_PAYMENT_PIVOT_QUERY, {
    variables: pivotVars,
    skip: !storeId,
  });

  const { data: dailyData, loading: dailyLoading } = useQuery(GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY, {
    variables: dailyVars,
    skip: !storeId,
  });

  const stats = statsData?.getPaymentCollectionStats ?? null;
  const monthlyRows = monthlyData?.getMonthlyPaymentPivot?.data ?? [];
  const dailyRows = dailyData?.getMonthlyDailyPaymentsPivot?.data ?? [];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h5 className="mb-0 fw-semibold">Payment Collections</h5>
        <button
          className="btn btn-sm btn-outline-secondary d-md-none"
          onClick={() => setShowFilters(f => !f)}
        >
          {showFilters ? "Hide Filters" : "Filters"}
        </button>
        {/* Inline filters — visible on md+ always, on mobile only when toggled */}
        <div className={`d-flex flex-wrap gap-2 align-items-center ${showFilters ? "d-flex" : "d-none d-md-flex"}`}>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          {warehouses.length > 1 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={selectedWarehouseId ?? ""}
              onChange={e => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.warehouseid} value={w.warehouseid}>{w.warehousename}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Pills */}
      <div className="mb-3">
        <CollectionKpiStrip stats={stats} loading={statsLoading} />
      </div>

      {/* Monthly chart */}
      <div className="mb-3">
        <MonthlyCollectionChart
          rows={monthlyRows}
          loading={monthlyLoading}
          selectedYear={selectedYear}
        />
      </div>

      {/* Donut + Daily side by side */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-5">
          <PaymentModeDonut selectedYear={selectedYear} warehouseFilter={selectedWarehouseId} />
        </div>
        <div className="col-12 col-lg-7">
          <DailyCollectionBar
            rows={dailyRows}
            loading={dailyLoading}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>
      </div>

      {/* Warehouse breakdown */}
      {warehouses.length > 1 && (
        <div className="mb-3">
          <WarehouseBreakdown rows={monthlyRows} loading={monthlyLoading} />
        </div>
      )}

      {/* Recent payments table */}
      <div className="mb-3">
        <RecentPaymentsTable
          storeId={storeId}
          outletId={outletId}
          warehouseId={selectedWarehouseId}
        />
      </div>
    </div>
  );
};

export default PaymentDashboard;
