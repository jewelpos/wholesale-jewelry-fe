"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { GET_MONTHLY_SALES_PIVOT_QUERY } from "@/lib/graphql/query/reports";
import { WarehouseSalesSummary } from "@/types/reports";
import { currentYear, yearFilter, stdVars } from "./utils";
import TodayPulseStrip from "./TodayPulseStrip";
import ForecastPanel from "./ForecastPanel";
import RevenueProfitTrend from "./RevenueProfitTrend";
import DailySalesHeatmap from "./DailySalesHeatmap";
import CategoryAnalysis from "./CategoryAnalysis";
import EmployeeLeaderboard from "./EmployeeLeaderboard";
import PaymentModeDonut from "./PaymentModeDonut";
import ProfitDrillDown from "./ProfitDrillDown";

const YEAR_RANGE = [currentYear, currentYear - 1, currentYear - 2];

const SalesDashboard = () => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Current year sales pivot (drives RevenueProfitTrend + ForecastPanel)
  const currentYearQuery = useQuery(GET_MONTHLY_SALES_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
    fetchPolicy: "cache-and-network",
  });

  // Prior year sales pivot (for YoY comparison)
  const priorYearQuery = useQuery(GET_MONTHLY_SALES_PIVOT_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      filters: yearFilter(selectedYear - 1),
      ...stdVars(),
    },
    skip: !parsedStoreId || !parsedOutletId,
    fetchPolicy: "cache-and-network",
  });

  const currentData: WarehouseSalesSummary[] = currentYearQuery.data?.getMonthlySalesPivot?.data ?? [];
  const currentTotals: Partial<WarehouseSalesSummary> | null = currentYearQuery.data?.getMonthlySalesPivot?.totalsRow ?? null;
  const priorData: WarehouseSalesSummary[] = priorYearQuery.data?.getMonthlySalesPivot?.data ?? [];
  const priorTotals: Partial<WarehouseSalesSummary> | null = priorYearQuery.data?.getMonthlySalesPivot?.totalsRow ?? null;

  // Unique warehouses from current data (for filter chips)
  const warehouses = useMemo(() => {
    const seen = new Map<number, string>();
    for (const r of currentData) {
      if (r.warehouseid && r.warehousename) seen.set(r.warehouseid, r.warehousename);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [currentData]);

  const loading = currentYearQuery.loading;
  const refreshLabel = lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const handleRefresh = () => {
    currentYearQuery.refetch();
    priorYearQuery.refetch();
    setLastRefresh(new Date());
  };

  return (
    <div className="content">
      {/* Header banner */}
      <div
        className="rounded-3 mb-4 px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{
          background: "linear-gradient(135deg, var(--tile-indigo) 0%, var(--tile-violet) 55%, var(--tile-teal) 100%)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <div>
          <h4 className="mb-1 text-white fw-bold">Sales Intelligence</h4>
          <p className="mb-0" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            Revenue · Profit · Categories · Teams · Payments
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Year chips */}
          {YEAR_RANGE.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setSelectedYear(y)}
              className="btn btn-sm"
              style={{
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: selectedYear === y ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                color: "#fff",
                border: selectedYear === y ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.3)",
                borderRadius: "var(--radius-chip)",
                backdropFilter: "blur(4px)",
              }}
            >
              {y}
            </button>
          ))}

          {/* Warehouse chips */}
          {warehouses.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setWarehouseFilter(null)}
                className="btn btn-sm"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: warehouseFilter === null ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: warehouseFilter === null ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "var(--radius-chip)",
                  backdropFilter: "blur(4px)",
                }}
              >
                All WH
              </button>
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  type="button"
                  onClick={() => setWarehouseFilter(wh.id)}
                  className="btn btn-sm"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: warehouseFilter === wh.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: warehouseFilter === wh.id ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "var(--radius-chip)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {wh.name}
                </button>
              ))}
            </>
          )}

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
            {loading ? "Loading…" : `Updated ${refreshLabel}`}
          </button>
        </div>
      </div>

      {/* Row 1: Today's pulse (6 live KPI tiles) */}
      <TodayPulseStrip />

      {/* Row 2: Forecast Intelligence */}
      <div className="mt-3">
        <ForecastPanel
          currentTotals={currentTotals}
          priorTotals={priorTotals}
          selectedYear={selectedYear}
          loading={loading}
        />
      </div>

      {/* Row 3: Revenue trend + Daily heatmap */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-7">
          <RevenueProfitTrend
            currentData={currentData}
            priorData={priorData}
            currentTotals={currentTotals}
            priorTotals={priorTotals}
            selectedYear={selectedYear}
            loading={loading}
          />
        </div>
        <div className="col-12 col-xl-5">
          <DailySalesHeatmap selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
      </div>

      {/* Row 4: Category analysis + Employee leaderboard */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-6">
          <CategoryAnalysis selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
        <div className="col-12 col-xl-6">
          <EmployeeLeaderboard selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
      </div>

      {/* Row 5: Payment mode donut + Profit drill-down */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-4">
          <PaymentModeDonut selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
        <div className="col-12 col-xl-8">
          <ProfitDrillDown selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
