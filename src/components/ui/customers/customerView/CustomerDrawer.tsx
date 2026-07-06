"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client";
import { X, Edit, ArrowLeft, FileText } from "react-feather";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  GET_CUSTOMER_QUERY,
  GET_CUSTOMER_LIST_QUERY,
} from "@/lib/graphql/query/customer";
import { GET_PAYMENT_TERMS_QUERY } from "@/lib/graphql/query/payment";
import { CustomerType, CustomersListType } from "@/types/customer";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import CustomerStatementModal from "@/components/ui/customers/statement/CustomerStatementModal";
import { formatCurrency } from "@/lib/utils/currencyFormat";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return formatCurrency(n);
}

function fmtDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const d = dayjs(val);
  if (!d.isValid()) return null;
  return d.format("MMM D, YYYY");
}

const BG_PALETTE = [
  "#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#e0f2fe",
];

function avatarBg(name: string): string {
  return BG_PALETTE[(name.charCodeAt(0) || 0) % BG_PALETTE.length];
}

function avatarInitials(name: string): string {
  return (name || "?").slice(0, 2).toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      color: "#94a3b8",
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div style={{ display: "flex", paddingBottom: 9, alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: 12,
          color: "#94a3b8",
          minWidth: 115,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#0f172a",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
};

const StatBox = ({
  label,
  value,
  valueColor,
  borderRight,
  small,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  borderRight?: boolean;
  small?: boolean;
}) => (
  <div
    style={{
      flex: 1,
      padding: "12px 14px",
      borderRight: borderRight ? "1px solid #e2e8f0" : undefined,
      minWidth: 90,
    }}
  >
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        color: "#94a3b8",
        marginBottom: 5,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: small ? 13 : 20,
        fontWeight: 700,
        color: valueColor || "#0f172a",
        letterSpacing: "-0.3px",
        lineHeight: 1.3,
      }}
    >
      {value}
    </div>
  </div>
);

// ── Props ──────────────────────────────────────────────────────────────────

export interface CustomerDrawerProps {
  customerId: number;
  storeId: number;
  outletId: number;
  onClose: () => void;
  mode?: "drawer" | "page";
}

// ── Component ──────────────────────────────────────────────────────────────

const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  customerId,
  storeId,
  onClose,
  mode = "drawer",
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const { basePath } = useDefaultRoute();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (mode === "drawer") {
      setVisible(false);
      setTimeout(onClose, 270);
    } else {
      onClose();
    }
  };

  const { data: profileData, loading } = useQuery(GET_CUSTOMER_QUERY, {
    variables: { storeid: storeId, customerid: customerId },
    skip: !customerId || !storeId,
  });

  const { data: listData } = useQuery(GET_CUSTOMER_LIST_QUERY, {
    variables: {
      storeid: storeId,
      page: 1,
      perpage: 1,
      filters: [
        {
          key: "customerid",
          value: { filterType: "number", type: "equals", filter: customerId },
        },
      ],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !customerId || !storeId,
  });

  const { data: termsData } = useQuery(GET_PAYMENT_TERMS_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const customer: CustomerType | undefined = profileData?.getCustomer;
  const listCustomer: CustomersListType | undefined =
    listData?.getCustomerList?.data?.[0];

  const termsName = useMemo(() => {
    if (!customer?.termsid || !termsData?.getPaymentTerms) return null;
    const term = termsData.getPaymentTerms.find(
      (t: any) => t.termsid === customer.termsid
    );
    return term?.termsname ?? null;
  }, [termsData, customer]);

  const fullName = [customer?.custfname, customer?.custlname]
    .filter(Boolean)
    .join(" ");
  const headerName = [customer?.custcompanyname, fullName]
    .filter(Boolean)
    .join(" · ");

  const seed = customer?.custcompanyname || customer?.custfname || "";
  const initials = avatarInitials(seed);
  const initBg = avatarBg(seed);

  const address = useMemo(() => {
    if (!customer) return null;
    const stateZip = [customer.custstate, customer.custzip]
      .filter(Boolean)
      .join(" ");
    return (
      [customer.custadd1, customer.custcity, stateZip, customer.custcountry]
        .filter(Boolean)
        .join(", ") || null
    );
  }, [customer]);

  const isActive = customer?.status === 1;

  const badge = (bg: string, color: string, text: string) => (
    <span
      style={{
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 20,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {text}
    </span>
  );

  const balDue = listCustomer?.balancedue ?? 0;
  const openCred = listCustomer?.opencredit ?? 0;

  type StatEntry = { label: string; value: React.ReactNode; color?: string; small?: boolean };

  const financialBoxes: StatEntry[] = [
    {
      label: "Balance Due",
      value: fmt(balDue),
      color: balDue > 0 ? "#b91c1c" : "#15803d",
    },
    {
      label: "Open Credit",
      value: fmt(openCred),
      color: openCred > 0 ? "#15803d" : "#0f172a",
    },
    { label: "Total Sales", value: fmt(listCustomer?.totalsale) },
  ];

  const accountBoxes: StatEntry[] = [
    { label: "Credit Limit", value: fmt(customer?.custcreditlimit) },
    {
      label: "Discount",
      value:
        customer?.custdiscount != null && customer.custdiscount > 0
          ? `${customer.custdiscount}%`
          : "—",
    },
    {
      label: "Sales Tax",
      value:
        customer?.custsalestax != null && customer.custsalestax > 0
          ? `${customer.custsalestax}%`
          : "—",
    },
  ];

  const content = (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 8px",
          height: 52,
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
          gap: 6,
        }}
      >
        <button
          onClick={handleClose}
          title="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            color: "#64748b",
            minHeight: 36,
          }}
        >
          {mode === "page" ? <ArrowLeft size={17} /> : <X size={17} />}
        </button>

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {headerName || `Customer #${customerId}`}
        </span>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {listCustomer && (
            <button
              onClick={() => setStatementOpen(true)}
              title="Statement"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 7,
                padding: "0 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#475569",
                height: 34,
              }}
            >
              <FileText size={13} />
              <span className="d-none d-sm-inline">Statement</span>
            </button>
          )}
          <button
            onClick={() =>
              router.push(`${basePath}/customers/${customerId}/edit`)
            }
            style={{
              background: "#0f172a",
              border: "none",
              borderRadius: 7,
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#fff",
              height: 34,
            }}
          >
            <Edit size={12} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 180,
            }}
          >
            <div className="spinner-border spinner-border-sm text-secondary" />
          </div>
        ) : !customer ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Customer not found.
          </div>
        ) : (
          <>
            {/* Alert strip */}
            {!!customer.custalert && customer.custalertremarks && (
              <div
                style={{
                  margin: "12px 14px 0",
                  background: "#fefce8",
                  border: "1px solid #fbbf24",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#92400e",
                }}
              >
                ⚠ {customer.custalertremarks}
              </div>
            )}

            {/* Identity */}
            <div
              style={{
                padding: "14px 14px 0",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {/* Initials avatar */}
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: initBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1e293b",
                  border: "1px solid #e2e8f0",
                }}
              >
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {customer.custcompanyname && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.3,
                      marginBottom: 2,
                      wordBreak: "break-word",
                    }}
                  >
                    {customer.custcompanyname}
                  </div>
                )}
                {fullName && (
                  <div
                    style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}
                  >
                    {fullName}
                  </div>
                )}

                {/* Status + alert badges */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {badge(
                    isActive ? "#dbeafe" : "#f1f5f9",
                    isActive ? "#1e40af" : "#64748b",
                    `● ${isActive ? "Active" : "Inactive"}`
                  )}
                  {!!customer.custalert &&
                    badge("#fef3c7", "#b45309", "⚠ Alert")}
                </div>

                {/* Contact lines */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  {customer.custphone1 && (
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      📞 {customer.custphone1}
                    </div>
                  )}
                  {customer.custcell && (
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      📱 {customer.custcell}
                    </div>
                  )}
                  {customer.custphone2 && (
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      Alt {customer.custphone2}
                    </div>
                  )}
                  {customer.custemailadd && (
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      ✉ {customer.custemailadd}
                    </div>
                  )}
                  {address && (
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      📍 {address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Stat rows ──────────────────────────────── */}
            <div style={{ margin: "14px 0 0" }}>
              {/* Financial row */}
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  borderBottom: "1px solid #e8edf2",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#b0bec5",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    padding: "5px 14px 0",
                  }}
                >
                  Financial
                </div>
                <div style={{ display: "flex" }}>
                  {financialBoxes.map((s, i) => (
                    <StatBox
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      valueColor={s.color}
                      small={s.small}
                      borderRight={i < financialBoxes.length - 1}
                    />
                  ))}
                </div>
              </div>
              {/* Account row */}
              <div
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f0f4f8",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#b0bec5",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    padding: "5px 14px 0",
                  }}
                >
                  Account
                </div>
                <div style={{ display: "flex" }}>
                  {accountBoxes.map((s, i) => (
                    <StatBox
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      valueColor={s.color}
                      small={s.small}
                      borderRight={i < accountBoxes.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Details ────────────────────────────────── */}
            <div style={{ padding: "14px 14px 4px" }}>
              <SectionTitle>Details</SectionTitle>
              {listCustomer?.custregistrationdate && (
                <DetailRow
                  label="Registration"
                  value={fmtDate(listCustomer.custregistrationdate)}
                />
              )}
              {listCustomer?.numberofsales != null && (
                <DetailRow
                  label="# of Sales"
                  value={String(listCustomer.numberofsales)}
                />
              )}
              {listCustomer?.lastsaledate && (
                <DetailRow
                  label="Last Sale"
                  value={fmtDate(listCustomer.lastsaledate)}
                />
              )}
              {listCustomer?.lastpaymentdate && (
                <DetailRow
                  label="Last Payment"
                  value={fmtDate(listCustomer.lastpaymentdate)}
                />
              )}
              <DetailRow label="Payment Terms" value={termsName} />
              <DetailRow label="Shipping" value={customer.custshippingmethod} />
              <DetailRow label="Bill To" value={customer.custbillto} />
              <DetailRow label="Ship To" value={customer.custshipto} />
              <DetailRow label="Tax ID" value={customer.custtaxid} />
              <DetailRow label="Warehouse" value={listCustomer?.warehousename} />
              <DetailRow label="Remarks" value={customer.custremarks} />
            </div>

            <div style={{ height: 28 }} />
          </>
        )}
      </div>

      {/* Statement modal */}
      {statementOpen && listCustomer && (
        <CustomerStatementModal
          customer={listCustomer}
          onClose={() => setStatementOpen(false)}
        />
      )}
    </>
  );

  if (mode === "drawer" && mounted) {
    return createPortal(
      <>
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1040,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(480px, 100vw)",
            background: "#fff",
            zIndex: 1041,
            transform: visible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.27s cubic-bezier(0.4,0,0.2,1)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 32px rgba(15,23,42,0.14)",
          }}
        >
          {content}
        </div>
      </>,
      document.body
    );
  }

  if (mode === "page") {
    return (
      <div style={{ maxWidth: 520, margin: "20px auto", padding: "0 12px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return null;
};

export default CustomerDrawer;
