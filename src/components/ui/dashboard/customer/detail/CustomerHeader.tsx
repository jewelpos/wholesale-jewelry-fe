"use client";

import React from "react";
import { Phone, Mail, MapPin, CreditCard, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import {
  computeReorderDue,
  computePaymentBehavior,
  paymentBehaviorLabel,
  paymentBehaviorBadgeClass,
  churnRiskBadgeClass,
  churnRiskLabel,
  computeChurnScore,
} from "../forecast";
import type DashboardCustomer from "../types";

type Customer = {
  customerid: number;
  custcompanyname: string | null;
  custfname: string | null;
  custlname: string | null;
  custadd1: string | null;
  custcity: string | null;
  custstate: string | null;
  custzip: string | null;
  custcountry: string | null;
  custphone1: string | null;
  custcell: string | null;
  custemailadd: string | null;
  custdiscount: number | null;
  custcreditlimit: number | null;
  custregistrationdate: string | null;
  termsid: number | null;
  status: number | null;
  custremarks: string | null;
  custalertremarks: string | null;
  custalert: number | null;
  warehouseid: number | null;
  numberofsales?: number | null;
  totalsale?: number | null;
  balancedue?: number | null;
  days_since_last_sale?: number | null;
};

type Props = {
  customer: Customer | undefined | null;
  loading: boolean;
};

const formatAddress = (c: Customer | null | undefined) => {
  if (!c) return "";
  return [c.custadd1, c.custcity, c.custstate, c.custzip, c.custcountry]
    .filter((p) => p && String(p).trim().length > 0)
    .join(", ");
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const CustomerHeader = ({ customer, loading }: Props) => {
  if (loading && !customer) {
    return (
      <div className="card mb-3" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
        <div className="card-body py-4 text-center text-muted">Loading…</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card mb-3" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
        <div className="card-body py-4 text-center text-muted">Customer not found.</div>
      </div>
    );
  }

  const fullName = [customer.custfname, customer.custlname]
    .filter((s) => s && s.trim().length > 0)
    .join(" ");
  const company = customer.custcompanyname || "—";
  const isActive = customer.status === 1;
  const address = formatAddress(customer);
  const hasAlert = customer.custalert === 1 && customer.custalertremarks?.trim();

  // Build a minimal DashboardCustomer-like object for forecast functions
  const forecastProxy = {
    customerid: customer.customerid,
    custcompanyname: customer.custcompanyname,
    fullname: fullName || null,
    numberofsales: customer.numberofsales ?? null,
    totalsale: customer.totalsale ?? null,
    balancedue: customer.balancedue ?? null,
    days_since_last_sale: customer.days_since_last_sale ?? null,
    custregistrationdate: customer.custregistrationdate,
    custcity: customer.custcity,
    phone: customer.custphone1,
    lastsaledate: null,
    lastpaymentdate: null,
    opencredit: null,
    mobile: customer.custcell,
    custemailadd: customer.custemailadd,
    warehousename: null,
    warehouseid: customer.warehouseid,
    outletid: null,
  } as DashboardCustomer;

  const reorder = computeReorderDue(forecastProxy);
  const behavior = computePaymentBehavior(forecastProxy);
  const churnScore = computeChurnScore(forecastProxy);
  const risk = churnRiskLabel(churnScore);

  return (
    <div className="card mb-3" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-card)" }}>
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-start gap-3">
          {/* Avatar */}
          <div
            className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold rounded-circle flex-shrink-0"
            style={{ width: 56, height: 56, fontSize: 22 }}
          >
            {(company || fullName || "?").slice(0, 1).toUpperCase()}
          </div>

          <div className="flex-grow-1 min-w-0">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <h4 className="mb-0">{company}</h4>
              <span className={`badge ${isActive ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
              {customer.termsid != null && (
                <span className="badge bg-info-subtle text-info">Terms #{customer.termsid}</span>
              )}
              {/* Payment behavior */}
              <span className={`badge ${paymentBehaviorBadgeClass(behavior)}`}>
                {paymentBehaviorLabel(behavior)}
              </span>
              {/* Churn risk */}
              <span className={`badge ${churnRiskBadgeClass(risk)}`}>
                {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
              </span>
            </div>

            {fullName && <div className="text-muted mt-1" style={{ fontSize: 13 }}>{fullName}</div>}

            <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
              {customer.custphone1 && (
                <span className="d-inline-flex align-items-center gap-1"><Phone size={13} />{customer.custphone1}</span>
              )}
              {customer.custcell && customer.custcell !== customer.custphone1 && (
                <span className="d-inline-flex align-items-center gap-1"><Phone size={13} />{customer.custcell} <span className="text-muted">(cell)</span></span>
              )}
              {customer.custemailadd && (
                <span className="d-inline-flex align-items-center gap-1"><Mail size={13} />{customer.custemailadd}</span>
              )}
              {address && (
                <span className="d-inline-flex align-items-center gap-1"><MapPin size={13} />{address}</span>
              )}
              {customer.custregistrationdate && (
                <span className="d-inline-flex align-items-center gap-1"><Calendar size={13} />Joined {formatDate(customer.custregistrationdate)}</span>
              )}
              {(customer.custcreditlimit ?? 0) > 0 && (
                <span className="d-inline-flex align-items-center gap-1"><CreditCard size={13} />Credit limit ${Number(customer.custcreditlimit).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {hasAlert && (
          <div className="alert alert-warning d-flex align-items-start mt-3 mb-0 py-2">
            <AlertTriangle size={15} className="me-2 mt-1 flex-shrink-0" />
            <div className="small">{customer.custalertremarks}</div>
          </div>
        )}

        {/* Reorder alert */}
        {reorder && reorder.daysOverdue > 0 && (
          <div className="d-flex align-items-center gap-2 mt-3 rounded px-3 py-2 bg-warning-subtle" style={{ fontSize: 12 }}>
            <RefreshCw size={14} className="text-warning flex-shrink-0" />
            <span className="text-warning fw-semibold">Reorder overdue by {reorder.daysOverdue} days</span>
            <span className="text-muted">·</span>
            <span className="text-muted">Avg cycle: {reorder.avgCycleDays}d · {customer.days_since_last_sale ? `${Math.round(customer.days_since_last_sale)}d since last order` : ""}</span>
          </div>
        )}

        {/* Notes */}
        {customer.custremarks?.trim() && (
          <div className="bg-light rounded p-2 small text-muted mt-3 mb-0">
            <span className="fw-semibold text-dark">Notes: </span>
            {customer.custremarks}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHeader;
