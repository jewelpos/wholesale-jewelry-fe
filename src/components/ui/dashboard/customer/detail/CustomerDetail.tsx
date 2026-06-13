"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, Edit2, DollarSign } from "lucide-react";
import {
  GET_CUSTOMER_QUERY,
  GET_CUSTOMER_BALANCE_REPORT_QUERY,
  GET_INVOICE_AGING_REPORT_QUERY,
  GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY,
  GET_CUSTOMER_PAYMENT_LIST_QUERY,
} from "@/lib/graphql/query/customer";
import CustomerHeader from "./CustomerHeader";
import KpiStrip from "./KpiStrip";
import AgingStrip from "./AgingStrip";
import OutstandingInvoices from "./OutstandingInvoices";
import RecentPayments from "./RecentPayments";
import ActivityTimeline from "./ActivityTimeline";
import {
  computePaymentBehavior,
  paymentBehaviorLabel,
  paymentBehaviorBadgeClass,
} from "../forecast";
import type DashboardCustomer from "../types";

type TabKey = "overview" | "invoices" | "payments" | "timeline";

const customerFilter = (id: number) => [
  { key: "customerid", value: { filterType: "number", type: "equals", filter: id } },
];

const CustomerDetail = () => {
  const params = useParams();
  const parsedStoreId = parseInt(params.storeId as string, 10);
  const parsedOutletId = parseInt(params.outletId as string, 10);
  const parsedCustomerId = parseInt(params.customerId as string, 10);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const customerQuery = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: parsedStoreId, customerid: parsedCustomerId },
    skip: !parsedStoreId || !parsedCustomerId,
  });

  const balanceQuery = useQuery(GET_CUSTOMER_BALANCE_REPORT_QUERY, {
    variables: {
      outletid: parsedOutletId,
      page: 1,
      perpage: 1,
      filters: customerFilter(parsedCustomerId),
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedOutletId || !parsedCustomerId,
  });

  const agingQuery = useQuery(GET_INVOICE_AGING_REPORT_QUERY, {
    variables: {
      outletid: parsedOutletId,
      page: 1,
      perpage: 1,
      filters: customerFilter(parsedCustomerId),
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedOutletId || !parsedCustomerId,
  });

  const customer = customerQuery.data?.getCustomer;
  const balance = balanceQuery.data?.getCustomerBalanceReport?.data?.[0];
  const aging = agingQuery.data?.getInvoiceAgingReport?.data?.[0];
  const warehouseId = customer?.warehouseid ?? 1;

  const outstandingQuery = useQuery(GET_CUSTOMER_BALANCE_DUE_INVOICES_QUERY, {
    variables: {
      storeid: parsedStoreId,
      customerid: parsedCustomerId,
      outletid: parsedOutletId,
      warehouseid: warehouseId,
      isCredit: false,
    },
    skip: !customer || !parsedCustomerId,
  });

  const paymentsQuery = useQuery(GET_CUSTOMER_PAYMENT_LIST_QUERY, {
    variables: {
      outletid: parsedOutletId,
      page: 1,
      perpage: 50,
      filters: customerFilter(parsedCustomerId),
      sortModel: [{ colId: "paymentdate", sort: "desc" }],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !parsedOutletId || !parsedCustomerId,
  });

  const outstanding = outstandingQuery.data?.getCustomerBalanceDueInvoices ?? [];
  const payments = paymentsQuery.data?.getCustomerPaymentList?.data ?? [];

  const isLoading = useMemo(
    () => customerQuery.loading || balanceQuery.loading || agingQuery.loading,
    [customerQuery.loading, balanceQuery.loading, agingQuery.loading]
  );

  // Build forecast proxy for payment behavior badge in KpiStrip
  const forecastProxy = useMemo(() => {
    if (!balance && !customer) return null;
    return {
      customerid: parsedCustomerId,
      custcompanyname: customer?.custcompanyname ?? null,
      fullname: null,
      numberofsales: balance?.number_of_sale ?? null,
      totalsale: balance?.total_sale ?? null,
      balancedue: balance?.total_due ?? aging?.total_due ?? null,
      days_since_last_sale: balance?.last_sale_date
        ? Math.floor((Date.now() - new Date(balance.last_sale_date).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      custregistrationdate: customer?.custregistrationdate ?? null,
      custcity: null,
      phone: null,
      lastsaledate: balance?.last_sale_date ?? null,
      lastpaymentdate: null,
      opencredit: null,
      mobile: null,
      custemailadd: customer?.custemailadd ?? null,
      warehousename: null,
      warehouseid: customer?.warehouseid ?? null,
      outletid: parsedOutletId,
    } as DashboardCustomer;
  }, [balance, aging, customer, parsedCustomerId, parsedOutletId]);

  const behavior = forecastProxy ? computePaymentBehavior(forecastProxy) : "unknown";

  const paymentBehaviorBadge = (
    <span className={`badge ${paymentBehaviorBadgeClass(behavior)}`} style={{ fontSize: 12 }}>
      {paymentBehaviorLabel(behavior)}
    </span>
  );

  // Enrich customer with balance data for header forecast
  const enrichedCustomer = customer
    ? {
        ...customer,
        numberofsales: balance?.number_of_sale ?? null,
        totalsale: balance?.total_sale ?? null,
        balancedue: balance?.total_due ?? aging?.total_due ?? null,
        days_since_last_sale: balance?.last_sale_date
          ? Math.floor((Date.now() - new Date(balance.last_sale_date).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }
    : null;

  if (!parsedCustomerId || !parsedStoreId) {
    return (
      <div className="content">
        <div className="alert alert-warning">Missing customer or store id.</div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "invoices", label: "Invoices", badge: outstanding.length || undefined },
    { key: "payments", label: "Payments", badge: payments.length || undefined },
    { key: "timeline", label: "Timeline", badge: (outstanding.length + payments.length) || undefined },
  ];

  return (
    <div className="content">
      {/* Top nav */}
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 gap-2">
        <Link
          href={`/jw/${parsedStoreId}/${parsedOutletId}/dashboard/customer`}
          className="d-inline-flex align-items-center text-decoration-none small text-muted"
        >
          <ArrowLeft size={14} className="me-1" /> Back to dashboard
        </Link>
        <div className="d-flex gap-2">
          <Link
            href={`/jw/${parsedStoreId}/${parsedOutletId}/customers/${parsedCustomerId}/edit`}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          >
            <Edit2 size={13} /> Edit
          </Link>
          <Link
            href={`/jw/${parsedStoreId}/${parsedOutletId}/customers/applied_payments?customerid=${parsedCustomerId}`}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
          >
            <DollarSign size={13} /> Record Payment
          </Link>
        </div>
      </div>

      {/* Header card */}
      <CustomerHeader customer={enrichedCustomer} loading={customerQuery.loading} />

      {/* KPI strip */}
      <div className="mb-3">
        <KpiStrip
          balance={balance}
          aging={aging}
          customer={customer}
          loading={isLoading}
          paymentBehaviorBadge={paymentBehaviorBadge}
        />
      </div>

      {/* Tab navigation */}
      <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
        <div className="border-bottom px-3">
          <nav className="d-flex gap-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="btn btn-link px-3 py-3 text-decoration-none"
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === t.key ? 600 : 400,
                  color: activeTab === t.key ? "var(--tile-indigo)" : "var(--text-secondary)",
                  borderBottom: activeTab === t.key ? "2px solid var(--tile-indigo)" : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    className="ms-2 badge"
                    style={{
                      fontSize: 10,
                      backgroundColor: activeTab === t.key ? "var(--tile-indigo)" : "var(--border-subtle)",
                      color: activeTab === t.key ? "#fff" : "var(--text-tertiary)",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="card-body">
          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="row g-3">
              <div className="col-12">
                <AgingStrip aging={aging} loading={agingQuery.loading} />
              </div>
              <div className="col-12 col-xl-6">
                <OutstandingInvoices invoices={outstanding.slice(0, 6)} loading={outstandingQuery.loading} />
              </div>
              <div className="col-12 col-xl-6">
                <RecentPayments
                  payments={payments.slice(0, 6)}
                  loading={paymentsQuery.loading}
                  customerId={parsedCustomerId}
                  storeId={parsedStoreId}
                  outletId={parsedOutletId}
                />
              </div>
            </div>
          )}

          {/* Invoices tab */}
          {activeTab === "invoices" && (
            <OutstandingInvoices invoices={outstanding} loading={outstandingQuery.loading} />
          )}

          {/* Payments tab */}
          {activeTab === "payments" && (
            <RecentPayments
              payments={payments}
              loading={paymentsQuery.loading}
              customerId={parsedCustomerId}
              storeId={parsedStoreId}
              outletId={parsedOutletId}
            />
          )}

          {/* Timeline tab */}
          {activeTab === "timeline" && (
            <ActivityTimeline
              invoices={outstanding}
              payments={payments}
              loading={outstandingQuery.loading || paymentsQuery.loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
