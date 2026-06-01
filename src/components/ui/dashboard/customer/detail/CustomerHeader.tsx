"use client";

import React from "react";
import type { Icon } from "react-feather";

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
};

type Props = {
  customer: Customer | undefined | null;
  loading: boolean;
  icons: {
    Phone: Icon;
    Mail: Icon;
    MapPin: Icon;
    CreditCard: Icon;
    Calendar: Icon;
    AlertTriangle: Icon;
  };
};

const formatAddress = (c: Customer | null | undefined) => {
  if (!c) return "";
  const parts = [c.custadd1, c.custcity, c.custstate, c.custzip, c.custcountry]
    .filter((p) => p && String(p).trim().length > 0)
    .join(", ");
  return parts;
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CustomerHeader = ({ customer, loading, icons }: Props) => {
  const { Phone, Mail, MapPin, CreditCard, Calendar, AlertTriangle } = icons;

  if (loading && !customer) {
    return (
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-4 text-center text-muted">Loading…</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-4 text-center text-muted">
          Customer not found.
        </div>
      </div>
    );
  }

  const fullName = [customer.custfname, customer.custlname]
    .filter((s) => s && s.trim().length > 0)
    .join(" ");
  const company = customer.custcompanyname || "—";
  const isActive = customer.status === 1;
  const address = formatAddress(customer);
  const hasAlert =
    customer.custalert === 1 &&
    customer.custalertremarks &&
    customer.custalertremarks.trim().length > 0;

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-start gap-3">
          <div
            className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold rounded-circle flex-shrink-0"
            style={{ width: 56, height: 56, fontSize: 22 }}
          >
            {(company || fullName || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <h4 className="mb-0">{company}</h4>
              <span
                className={`badge ${isActive ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
              {customer.termsid != null && (
                <span className="badge bg-info-subtle text-info">
                  Terms #{customer.termsid}
                </span>
              )}
            </div>
            {fullName && (
              <div className="text-muted mt-1">{fullName}</div>
            )}

            <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
              {customer.custphone1 && (
                <span className="d-inline-flex align-items-center gap-1">
                  <Phone size={14} />
                  {customer.custphone1}
                </span>
              )}
              {customer.custcell &&
                customer.custcell !== customer.custphone1 && (
                  <span className="d-inline-flex align-items-center gap-1">
                    <Phone size={14} />
                    {customer.custcell} <span className="text-muted">(cell)</span>
                  </span>
                )}
              {customer.custemailadd && (
                <span className="d-inline-flex align-items-center gap-1">
                  <Mail size={14} />
                  {customer.custemailadd}
                </span>
              )}
              {address && (
                <span className="d-inline-flex align-items-center gap-1">
                  <MapPin size={14} />
                  {address}
                </span>
              )}
              {customer.custregistrationdate && (
                <span className="d-inline-flex align-items-center gap-1">
                  <Calendar size={14} />
                  Joined {formatDate(customer.custregistrationdate)}
                </span>
              )}
              {(customer.custcreditlimit ?? 0) > 0 && (
                <span className="d-inline-flex align-items-center gap-1">
                  <CreditCard size={14} />
                  Credit limit ${Number(customer.custcreditlimit).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {hasAlert && (
          <div className="alert alert-warning d-flex align-items-start mt-3 mb-0 py-2">
            <AlertTriangle size={16} className="me-2 mt-1 flex-shrink-0" />
            <div className="small">{customer.custalertremarks}</div>
          </div>
        )}

        {customer.custremarks && customer.custremarks.trim().length > 0 && (
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
