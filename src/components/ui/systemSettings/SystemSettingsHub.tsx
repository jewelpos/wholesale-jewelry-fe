"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ChevronRight, Gem, Truck, CreditCard, Tag, TrendingUp, Settings2, Receipt, LucideIcon } from "lucide-react";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { GET_SHIPPING_MODES_QUERY } from "@/lib/graphql/query/shipping";
import { GET_PAYMENT_MODE_LIST_QUERY } from "@/lib/graphql/query/paymentMode";
import { GET_ALL_INVENTORY_TAG_LABELS_QUERY } from "@/lib/graphql/query/products";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { GET_EXPENSE_CODE_QUERY } from "@/lib/graphql/query/accounts";

interface SettingTile {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  count?: number | null;
  countLabel?: string;
  badgeText?: string;
}

const TileCard = ({ tile }: { tile: SettingTile }) => {
  const Icon = tile.icon;
  return (
    <Link href={tile.href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--surface-card, #fff)",
          border: "1px solid var(--border-subtle, #e2e8f0)",
          borderRadius: 12,
          padding: "20px 22px",
          cursor: "pointer",
          transition: "box-shadow 0.15s, border-color 0.15s, transform 0.15s",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
          el.style.borderColor = tile.accent;
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = "none";
          el.style.borderColor = "var(--border-subtle, #e2e8f0)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Icon + count row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: `${tile.accent}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} color={tile.accent} strokeWidth={1.8} />
          </div>
          {(tile.count != null || tile.badgeText) && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tile.accent,
                background: `${tile.accent}18`,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {tile.badgeText ?? `${tile.count} ${tile.countLabel ?? "items"}`}
            </span>
          )}
        </div>

        {/* Title + desc */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #1e293b)", marginBottom: 4 }}>
            {tile.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", lineHeight: 1.5 }}>
            {tile.description}
          </div>
        </div>

        {/* Manage link */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: tile.accent }}>
          Manage
          <ChevronRight size={13} strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
};

// ─── Section ────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 14px" }}>
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#94a3b8", textTransform: "uppercase" }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
  </div>
);

// ─── Hub ────────────────────────────────────────────────────
const SystemSettingsHub = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const base = `/jw/${storeIdParam}/${outletIdParam}/settings/system_settings`;

  const storeIdInt = parseInt(storeIdParam as string, 10);

  const { data: metalTypeData } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });
  const { data: shippingData } = useQuery(GET_SHIPPING_MODES_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });
  const { data: paymentData } = useQuery(GET_PAYMENT_MODE_LIST_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });
  const { data: labelData } = useQuery(GET_ALL_INVENTORY_TAG_LABELS_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });
  const { data: metalRatesData } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });
  const { data: expenseCodeData } = useQuery(GET_EXPENSE_CODE_QUERY, {
    variables: { storeid: storeIdInt },
    skip: !storeIdParam,
  });

  const metalTypeCount = metalTypeData?.getMetalTypeList?.length ?? null;
  const shippingCount = shippingData?.getShippingModes?.length ?? null;
  const paymentCount = paymentData?.getPaymentExpenseModes?.length ?? null;
  const labelCount = labelData?.getAllInventoryTagLabels?.length ?? null;
  const expenseCodeCount = expenseCodeData?.getExpenseCode?.length ?? null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const ratesData = metalRatesData?.getCurrentMetalRates;
  const metalRatesLabel = ratesData
    ? ratesData.ratedate >= todayStr
      ? "Updated today"
      : "Stale rates"
    : "Not set";

  const storeConfig: SettingTile[] = [
    {
      title: "Store Settings",
      description: "Configure per-warehouse price codes, sale tag keys, and store policy that prints on documents.",
      href: `${base}/store_settings`,
      icon: Settings2,
      accent: "#376fd0",
    },
  ];

  const productMasters: SettingTile[] = [
    {
      title: "Metal Types",
      description: "Manage metal types (10Kt, 14Kt, 18Kt…) shown in the product form dropdown. Set default purity % per type.",
      href: `${base}/metal_types`,
      icon: Gem,
      accent: "#8b5cf6",
      count: metalTypeCount,
      countLabel: "types",
    },
    {
      title: "Metal Rates",
      description: "Daily gold, silver, platinum and rhodium spot prices. Auto-fetched from Kitco hourly or set manually.",
      href: `${base}/metal_rates`,
      icon: TrendingUp,
      accent: "#f59e0b",
      badgeText: metalRatesLabel,
    },
    {
      title: "Shipping Modes",
      description: "Manage shipping methods available in sales orders and invoices.",
      href: `${base}/shipping_modes`,
      icon: Truck,
      accent: "#0ea5e9",
      count: shippingCount,
      countLabel: "modes",
    },
    {
      title: "Payment Modes",
      description: "Manage payment methods accepted during checkout and invoicing.",
      href: `${base}/payment_modes`,
      icon: CreditCard,
      accent: "#10b981",
      count: paymentCount,
      countLabel: "modes",
    },
    {
      title: "Label Templates",
      description: "Configure rat-tail and rectangular price tag templates for printing.",
      href: `${base}/label_templates`,
      icon: Tag,
      accent: "#f59e0b",
      count: labelCount,
      countLabel: "templates",
    },
  ];

  return (
    <div style={{ padding: "4px 0 32px" }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>System Settings</h4>
            <h6>Manage master data and system-wide configuration</h6>
          </div>
        </div>
      </div>

      {/* Store Configuration section */}
      <SectionHeader title="Store Configuration" />
      <div className="row g-3">
        {storeConfig.map((tile) => (
          <div key={tile.href} className="col-xl-3 col-lg-4 col-md-6">
            <TileCard tile={tile} />
          </div>
        ))}
      </div>

      {/* Product Masters section */}
      <SectionHeader title="Product Masters" />
      <div className="row g-3">
        {productMasters.map((tile) => (
          <div key={tile.href} className="col-xl-3 col-lg-4 col-md-6">
            <TileCard tile={tile} />
          </div>
        ))}
      </div>

      {/* Finance Configuration section */}
      <SectionHeader title="Finance Configuration" />
      <div className="row g-3">
        <div className="col-xl-3 col-lg-4 col-md-6">
          <TileCard tile={{
            title: "Expense Codes",
            description: "Manage expense categories used when recording business expenses.",
            href: `${base}/expense_codes`,
            icon: Receipt,
            accent: "#ef4444",
            count: expenseCodeCount,
            countLabel: "codes",
          }} />
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsHub;
