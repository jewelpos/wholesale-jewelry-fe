"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit2,
  AlertTriangle,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
} from "react-feather";
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

const customerFilter = (id: number) => [
  {
    key: "customerid",
    value: { filterType: "number", type: "equals", filter: id },
  },
];

const CustomerDetail = () => {
  const params = useParams();
  const parsedStoreId = parseInt(params.storeId as string, 10);
  const parsedOutletId = parseInt(params.outletId as string, 10);
  const parsedCustomerId = parseInt(params.customerId as string, 10);

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
      perpage: 10,
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
    () =>
      customerQuery.loading ||
      balanceQuery.loading ||
      agingQuery.loading,
    [customerQuery.loading, balanceQuery.loading, agingQuery.loading]
  );

  if (!parsedCustomerId || !parsedStoreId) {
    return (
      <div className="content">
        <div className="alert alert-warning">Missing customer or store id.</div>
      </div>
    );
  }

  return (
    <div className="content">
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
            <Edit2 size={14} /> Edit
          </Link>
          <Link
            href={`/jw/${parsedStoreId}/${parsedOutletId}/customers/applied_payments?customerid=${parsedCustomerId}`}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
          >
            <DollarSign size={14} /> Record payment
          </Link>
        </div>
      </div>

      <CustomerHeader
        customer={customer}
        loading={customerQuery.loading}
        icons={{ Phone, Mail, MapPin, CreditCard, Calendar, AlertTriangle }}
      />

      <KpiStrip
        balance={balance}
        aging={aging}
        customer={customer}
        loading={isLoading}
        icons={{ DollarSign, TrendingUp, AlertTriangle, Calendar, CreditCard }}
      />

      <div className="row g-3 mt-1">
        <div className="col-12">
          <AgingStrip aging={aging} loading={agingQuery.loading} />
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-6">
          <OutstandingInvoices
            invoices={outstanding}
            loading={outstandingQuery.loading}
          />
        </div>
        <div className="col-12 col-xl-6">
          <RecentPayments
            payments={payments}
            loading={paymentsQuery.loading}
            customerId={parsedCustomerId}
            storeId={parsedStoreId}
            outletId={parsedOutletId}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
