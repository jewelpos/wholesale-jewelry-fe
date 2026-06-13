"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Package2 } from "lucide-react";
import { GET_PRODUCT_LIST_QUERY, GET_PRODUCT_LIST_SUMMARY_QUERY, GET_PRODUCT_AGING_LIST_QUERY } from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import { num, currentYear } from "./utils";

import KpiStrip from "./KpiStrip";
import AlertPanels from "./AlertPanels";
import MetalTypeBreakdown from "./MetalTypeBreakdown";
import CategoryRevenueChart from "./CategoryRevenueChart";
import TopItemsTrend from "./TopItemsTrend";
import StockHealthScatter from "./StockHealthScatter";
import AgingDistribution from "./AgingDistribution";
import AbcAnalysis from "./AbcAnalysis";
import ActivityFeed from "./ActivityFeed";

type StockStatus = "all" | "instock" | "lowstock" | "outofstock";

const YEARS = [currentYear, currentYear - 1, currentYear - 2];

const ChipBtn = ({ active, onClick, label, color = "#6366f1" }: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  color?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      fontSize: 11, padding: "3px 12px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap",
      backgroundColor: active ? color : "rgba(255,255,255,0.12)",
      color: active ? "#fff" : "rgba(255,255,255,0.82)",
      border: `1px solid ${active ? color : "rgba(255,255,255,0.25)"}`,
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
);

const ProductDashboard = () => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const [metalFilter, setMetalFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<StockStatus>("all");

  // Product list (all-time inventory state)
  const { data: listData, loading: listLoading } = useQuery(GET_PRODUCT_LIST_QUERY, {
    variables: {
      outletid: parsedOutletId,
      page: 1,
      perpage: 5000,
      filters: [],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedOutletId,
  });

  // Summary KPIs
  const { data: summaryData, loading: summaryLoading } = useQuery(GET_PRODUCT_LIST_SUMMARY_QUERY, {
    variables: { outletid: parsedOutletId },
    skip: !parsedOutletId,
  });

  // Aging data
  const { data: agingData, loading: agingLoading } = useQuery(GET_PRODUCT_AGING_LIST_QUERY, {
    variables: {
      storeid: parsedStoreId,
      outletid: parsedOutletId,
      warehouseid: warehouseFilter,
      page: 1,
      perpage: 5000,
      filters: [],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedStoreId || !parsedOutletId,
  });

  const allProducts: ProductListType[] = listData?.getProductListNew?.data ?? [];
  const agingRows = agingData?.getProductAgingList?.data ?? [];
  const summary = summaryData?.getProductListSummary ?? null;

  // Derive filter options
  const warehouses = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of allProducts) {
      if (p.itemwarehouseid && p.warehousename) map[p.itemwarehouseid] = p.warehousename;
    }
    return Object.entries(map).map(([id, name]) => ({ id: Number(id), name }));
  }, [allProducts]);

  const metals = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      if (p.itemmetal?.trim()) set.add(p.itemmetal.trim());
    }
    return Array.from(set).sort();
  }, [allProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      if (p.categoryname) set.add(p.categoryname);
    }
    return Array.from(set).sort();
  }, [allProducts]);

  // Apply global filters to product list
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (warehouseFilter && p.itemwarehouseid !== warehouseFilter) return false;
      if (metalFilter && (p.itemmetal?.trim() || "") !== metalFilter) return false;
      if (categoryFilter && p.categoryname !== categoryFilter) return false;
      if (stockStatus === "instock" && !(num(p.itemquantityinhand) > 0)) return false;
      if (stockStatus === "lowstock" && !(num(p.itemquantityinhand) > 0 && num(p.itemquantityinhand) <= 10)) return false;
      if (stockStatus === "outofstock" && num(p.itemquantityinhand) !== 0) return false;
      return true;
    });
  }, [allProducts, warehouseFilter, metalFilter, categoryFilter, stockStatus]);


  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header Banner */}
      <div
        className="rounded-3 p-4 mb-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #064e3b 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", backgroundColor: "rgba(99,102,241,0.18)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "40%", width: 260, height: 260, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.12)", pointerEvents: "none" }} />

        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Package2 size={20} />
              <h4 className="mb-0 fw-bold" style={{ letterSpacing: -0.5 }}>Product Intelligence</h4>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Inventory health · Sales performance · ABC ranking · Stock aging
            </div>
          </div>

          {/* Year selector */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: 11, opacity: 0.6 }}>Year</span>
            {YEARS.map((y) => (
              <ChipBtn key={y} active={selectedYear === y} onClick={() => setSelectedYear(y)} label={y} />
            ))}
          </div>
        </div>

        {/* Filter rows */}
        <div className="d-flex flex-wrap gap-2 mt-3" style={{ position: "relative", zIndex: 1 }}>
          {/* Warehouse */}
          {warehouses.length > 1 && (
            <>
              <span style={{ fontSize: 10, opacity: 0.55, alignSelf: "center" }}>Warehouse</span>
              <ChipBtn active={warehouseFilter === null} onClick={() => setWarehouseFilter(null)} label="All" />
              {warehouses.map((w) => (
                <ChipBtn key={`wh-${w.id}`} active={warehouseFilter === w.id} onClick={() => setWarehouseFilter(w.id === warehouseFilter ? null : w.id)} label={w.name} />
              ))}
              <span style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center" }} />
            </>
          )}

          {/* Metal type */}
          {metals.length > 0 && (
            <>
              <span style={{ fontSize: 10, opacity: 0.55, alignSelf: "center" }}>Metal</span>
              <ChipBtn active={metalFilter === null} onClick={() => setMetalFilter(null)} label="All" color="#f59e0b" />
              {metals.map((m) => (
                <ChipBtn key={`metal-${m}`} active={metalFilter === m} onClick={() => setMetalFilter(m === metalFilter ? null : m)} label={m} color="#f59e0b" />
              ))}
              <span style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center" }} />
            </>
          )}

          {/* Stock status */}
          <span style={{ fontSize: 10, opacity: 0.55, alignSelf: "center" }}>Stock</span>
          <ChipBtn active={stockStatus === "all"} onClick={() => setStockStatus("all")} label="All" />
          <ChipBtn active={stockStatus === "instock"} onClick={() => setStockStatus("instock")} label="In Stock" color="#10b981" />
          <ChipBtn active={stockStatus === "lowstock"} onClick={() => setStockStatus("lowstock")} label="Low Stock" color="#f59e0b" />
          <ChipBtn active={stockStatus === "outofstock"} onClick={() => setStockStatus("outofstock")} label="Out of Stock" color="#f43f5e" />
        </div>

        {/* Category filter row */}
        {categories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2" style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 10, opacity: 0.55, alignSelf: "center" }}>Category</span>
            <ChipBtn active={categoryFilter === null} onClick={() => setCategoryFilter(null)} label="All" color="#8b5cf6" />
            {categories.slice(0, 12).map((c) => (
              <ChipBtn key={`cat-${c}`} active={categoryFilter === c} onClick={() => setCategoryFilter(c === categoryFilter ? null : c)} label={c} color="#8b5cf6" />
            ))}
          </div>
        )}

        {/* Active filter summary */}
        {(warehouseFilter || metalFilter || categoryFilter || stockStatus !== "all") && (
          <div className="mt-2" style={{ position: "relative", zIndex: 1, fontSize: 10, opacity: 0.6 }}>
            Showing {filteredProducts.length} of {allProducts.length} products
            {" · "}
            <button
              type="button"
              onClick={() => { setWarehouseFilter(null); setMetalFilter(null); setCategoryFilter(null); setStockStatus("all"); }}
              style={{ background: "none", border: "none", color: "#f59e0b", fontSize: 10, cursor: "pointer", padding: 0 }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="mb-4">
        <KpiStrip summary={summary} products={filteredProducts} loading={listLoading || summaryLoading} />
      </div>

      {/* Alert Panels */}
      <div className="mb-4">
        <AlertPanels products={filteredProducts} loading={listLoading} />
      </div>

      {/* Category Revenue + Metal Type */}
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <CategoryRevenueChart selectedYear={selectedYear} warehouseFilter={warehouseFilter} />
        </div>
        <div className="col-lg-4">
          <MetalTypeBreakdown products={filteredProducts} loading={listLoading} />
        </div>
      </div>

      {/* Top Items Trend + Aging Distribution */}
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <TopItemsTrend selectedYear={selectedYear} warehouseFilter={warehouseFilter} categoryFilter={categoryFilter} />
        </div>
        <div className="col-lg-4">
          <AgingDistribution agingData={agingRows} loading={agingLoading} />
        </div>
      </div>

      {/* Stock Health Scatter + Activity Feed */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <StockHealthScatter agingData={agingRows} loading={agingLoading} />
        </div>
        <div className="col-lg-6">
          <ActivityFeed products={filteredProducts} loading={listLoading} />
        </div>
      </div>

      {/* ABC Analysis — full width */}
      <div className="mb-4">
        <AbcAnalysis products={filteredProducts} loading={listLoading} />
      </div>
    </div>
  );
};

export default ProductDashboard;
