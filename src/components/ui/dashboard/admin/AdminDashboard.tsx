"use client";
import React, { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "next/navigation";

import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import {
  GET_MONTHLY_SALES_PIVOT_QUERY,
  GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY,
  GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY,
  GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY,
  GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY,
} from "@/lib/graphql/query/reports";
import {
  GET_CUSTOMER_LIST_SUMMARY_QUERY,
  GET_CUSTOMER_LIST_QUERY,
  GET_INVOICE_AGING_REPORT_QUERY,
  GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY,
} from "@/lib/graphql/query/customer";
import {
  GET_PRODUCT_LIST_SUMMARY_QUERY,
  GET_PRODUCT_AGING_LIST_QUERY,
} from "@/lib/graphql/query/products";
import { GET_PURCHASE_ORDER_STATS_QUERY } from "@/lib/graphql/query/purchase";

import ExecutivePulse from "./ExecutivePulse";
import RevenueTrend from "./RevenueTrend";
import AlertCenter from "./AlertCenter";
import SalesBreakdown from "./SalesBreakdown";
import CustomerIntelligence from "./CustomerIntelligence";
import EmployeeLeaderboard from "./EmployeeLeaderboard";
import PurchasePanel from "./PurchasePanel";
import InventoryPanel from "./InventoryPanel";
import { currentYear, sumPivotRows, yearFilter } from "./utils";

const NO_FILTER: never[] = [];

const pVars = (storeid: number, outletid: number, warehouseid: number | null, year: number) => ({
  storeid,
  outletid,
  warehouseid,
  page: 1,
  perpage: 2000,
  filters: yearFilter(year),
  sortModel: NO_FILTER,
  rowGroupCols: NO_FILTER,
  groupKeys: NO_FILTER,
});

const AdminDashboard = () => {
  const params = useParams();
  const storeId = parseInt(params.storeId as string, 10);
  const outletId = parseInt(params.outletId as string, 10);

  const [selectedOutletId, setSelectedOutletId] = useState(outletId);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Outlets for selector
  const { data: outletsData } = useQuery(GET_OUTLETS_QUERY, {
    variables: { storeid: [storeId] },
  });
  const outlets: { outletid: number; outletname: string }[] =
    outletsData?.getOutlets ?? [];

  // Warehouse mapped to the selected outlet — required by several pivot resolvers
  const { data: whData } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: selectedOutletId },
    skip: !selectedOutletId,
  });
  const warehouseId: number | null =
    whData?.getWarehousesByOutletId?.[0]?.warehouseid ?? null;
  const warehouseReady = warehouseId !== null;

  // Sales pivot — current year (accepts warehouseid: null)
  const { data: salesData, loading: salesLoading } = useQuery(
    GET_MONTHLY_SALES_PIVOT_QUERY,
    { variables: pVars(storeId, selectedOutletId, null, selectedYear) }
  );

  // Sales pivot — prior year (for YoY comparison)
  const { data: priorData, loading: priorLoading } = useQuery(
    GET_MONTHLY_SALES_PIVOT_QUERY,
    { variables: pVars(storeId, selectedOutletId, null, selectedYear - 1) }
  );

  // Employee sales — needs mapped warehouse
  const { data: empData, loading: empLoading } = useQuery(
    GET_MONTHLY_EMPLOYEE_SALES_PIVOT_QUERY,
    {
      variables: pVars(storeId, selectedOutletId, warehouseId, selectedYear),
      skip: !warehouseReady,
    }
  );

  // Supplier purchases — needs mapped warehouse, no year filter (PurchasePanel filters client-side)
  const { data: purchaseData, loading: purchaseLoading } = useQuery(
    GET_SUPPLIER_MONTHLY_PURCHASE_PIVOT_QUERY,
    {
      variables: {
        storeid: storeId, outletid: selectedOutletId, warehouseid: warehouseId,
        page: 1, perpage: 2000,
        filters: NO_FILTER, sortModel: NO_FILTER, rowGroupCols: NO_FILTER, groupKeys: NO_FILTER,
      },
      skip: !warehouseReady,
    }
  );

  // Payment mode mix — needs mapped warehouse
  const { data: paymentData, loading: paymentLoading } = useQuery(
    GET_MONTHLY_DAILY_PAYMENTS_PIVOT_QUERY,
    {
      variables: pVars(storeId, selectedOutletId, warehouseId, selectedYear),
      skip: !warehouseReady,
    }
  );

  // Category revenue — needs mapped warehouse
  const { data: categoryData, loading: categoryLoading } = useQuery(
    GET_ITEM_SOLD_BY_CATEGORY_PIVOT_QUERY,
    {
      variables: pVars(storeId, selectedOutletId, warehouseId, selectedYear),
      skip: !warehouseReady,
    }
  );

  // Customer summary (store-level, no outletid)
  const { data: custSummaryData } = useQuery(GET_CUSTOMER_LIST_SUMMARY_QUERY, {
    variables: { storeid: storeId },
  });

  // Customer list (store-level)
  const { data: custListData, loading: custListLoading } = useQuery(
    GET_CUSTOMER_LIST_QUERY,
    {
      variables: {
        storeid: storeId,
        page: 1, perpage: 500,
        filters: NO_FILTER, sortModel: NO_FILTER, rowGroupCols: NO_FILTER, groupKeys: NO_FILTER,
      },
    }
  );

  // AR Aging (outlet-level)
  const { data: agingData, loading: agingLoading } = useQuery(
    GET_INVOICE_AGING_REPORT_QUERY,
    {
      variables: {
        outletid: selectedOutletId,
        page: 1, perpage: 2000,
        filters: NO_FILTER, sortModel: NO_FILTER, rowGroupCols: NO_FILTER, groupKeys: NO_FILTER,
      },
    }
  );

  // Cheque portfolio
  const { data: chequeData } = useQuery(GET_CUSTOMER_CHEQUE_SUMMARY_LIST_QUERY, {
    variables: { storeid: storeId, year: selectedYear },
  });

  // Product summary
  const { data: prodSummaryData } = useQuery(GET_PRODUCT_LIST_SUMMARY_QUERY, {
    variables: { outletid: selectedOutletId },
  });

  // Product aging — needs mapped warehouse
  const { data: prodAgingData, loading: prodAgingLoading } = useQuery(
    GET_PRODUCT_AGING_LIST_QUERY,
    {
      variables: {
        storeid: storeId, outletid: selectedOutletId, warehouseid: warehouseId,
        page: 1, perpage: 2000,
        filters: NO_FILTER, sortModel: NO_FILTER, rowGroupCols: NO_FILTER, groupKeys: NO_FILTER,
      },
      skip: !warehouseReady,
    }
  );

  // PO stats (store-level)
  const { data: poStatsData } = useQuery(GET_PURCHASE_ORDER_STATS_QUERY, {
    variables: { storeid: storeId },
  });

  // Derived data
  const currentSalesRows: Record<string, number | string>[] =
    salesData?.getMonthlySalesPivot?.data ?? [];
  const priorSalesRows: Record<string, number | string>[] =
    priorData?.getMonthlySalesPivot?.data ?? [];

  const currentTotals = useMemo(
    () => (currentSalesRows.length ? sumPivotRows(currentSalesRows) : null),
    [currentSalesRows]
  );
  const priorTotals = useMemo(
    () => (priorSalesRows.length ? sumPivotRows(priorSalesRows) : null),
    [priorSalesRows]
  );

  const empRows = empData?.getMonthlyEmployeeSalesPivot?.data ?? [];
  const purchaseRows = purchaseData?.getMonthlySupplierPurchasePivot?.data ?? [];
  const paymentRows = paymentData?.getMonthlyDailyPaymentsPivot?.data ?? [];
  const categoryRows = categoryData?.getMonthlyItemCategorySalesPivot?.data ?? [];
  const agingRows = agingData?.getInvoiceAgingReport?.data ?? [];
  const customerRows = custListData?.getCustomerList?.data ?? [];
  const chequeRows = chequeData?.getCustomerChequeSummaryList ?? [];
  const productSummary = prodSummaryData?.getProductListSummary ?? null;
  const agingListRows = prodAgingData?.getProductAgingList?.data ?? [];
  const poStats = poStatsData?.getPurchaseOrderStats ?? null;
  const customerSummary = custSummaryData?.getCustomerListSummary ?? null;

  const mainLoading = salesLoading || priorLoading;

  return (
    <div>
      {/* ── Header ── */}
      <div
        className="mb-4 px-4 py-3"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #1e3a5f 100%)",
          borderRadius: "var(--radius-card)",
          color: "#fff",
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h4 style={{ fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
              Executive Dashboard
            </h4>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              Business Intelligence · Owner View
            </div>
          </div>
          {/* Year selector */}
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span style={{ fontSize: 11, opacity: 0.65 }}>Year</span>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                style={{
                  fontSize: 12, padding: "4px 14px", borderRadius: 20, fontWeight: 600,
                  backgroundColor: selectedYear === y ? "#fff" : "rgba(255,255,255,0.12)",
                  color: selectedYear === y ? "#312e81" : "#fff",
                  border: `1px solid ${selectedYear === y ? "#fff" : "rgba(255,255,255,0.3)"}`,
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Outlet selector — only shown when store has multiple outlets */}
        {outlets.length > 1 && (
          <div className="d-flex gap-2 mt-3 flex-wrap align-items-center">
            <span style={{ fontSize: 11, opacity: 0.65 }}>Outlet</span>
            {outlets.map((o) => (
              <button
                key={o.outletid}
                type="button"
                onClick={() => setSelectedOutletId(o.outletid)}
                style={{
                  fontSize: 11, padding: "3px 12px", borderRadius: 20,
                  backgroundColor:
                    selectedOutletId === o.outletid
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.12)",
                  color: selectedOutletId === o.outletid ? "#312e81" : "#fff",
                  border: `1px solid ${selectedOutletId === o.outletid ? "#fff" : "rgba(255,255,255,0.3)"}`,
                  fontWeight: selectedOutletId === o.outletid ? 600 : 400,
                }}
              >
                {o.outletname}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Executive KPI Strip ── */}
      <div className="mb-4">
        <ExecutivePulse
          salesTotals={currentTotals}
          priorTotals={priorTotals}
          productSummary={productSummary}
          customerSummary={customerSummary}
          poStats={poStats}
          loading={mainLoading}
        />
      </div>

      {/* ── Revenue & Profit Trend ── */}
      <div className="mb-4">
        <RevenueTrend
          currentTotals={currentTotals}
          priorTotals={priorTotals}
          currentRows={currentSalesRows}
          selectedYear={selectedYear}
          loading={mainLoading}
        />
      </div>

      {/* ── Alert Center ── */}
      <div className="mb-4">
        <AlertCenter
          agingRows={agingRows}
          poStats={poStats}
          productSummary={productSummary}
          chequeRows={chequeRows}
          loading={agingLoading}
        />
      </div>

      {/* ── Sales Breakdown ── */}
      <div className="mb-4">
        <SalesBreakdown
          categoryRows={categoryRows}
          paymentRows={paymentRows}
          loading={categoryLoading || paymentLoading}
        />
      </div>

      {/* ── Customer Intelligence ── */}
      <div className="mb-4">
        <CustomerIntelligence
          agingRows={agingRows}
          customerRows={customerRows}
          loading={agingLoading || custListLoading}
        />
      </div>

      {/* ── Employee Leaderboard ── */}
      <div className="mb-4">
        <EmployeeLeaderboard
          rows={empRows}
          selectedYear={selectedYear}
          loading={empLoading}
        />
      </div>

      {/* ── Purchase Panel ── */}
      <div className="mb-4">
        <PurchasePanel
          purchaseRows={purchaseRows}
          salesTotals={currentTotals}
          selectedYear={selectedYear}
          loading={purchaseLoading}
        />
      </div>

      {/* ── Inventory Health ── */}
      <div className="mb-4">
        <InventoryPanel
          productSummary={productSummary}
          agingRows={agingListRows}
          loading={prodAgingLoading}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
