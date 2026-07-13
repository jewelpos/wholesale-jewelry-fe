"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { AlertTriangle } from "react-feather";

const RATE_LABEL: Record<string, string> = {
  gold10kt_gram: "10Kt",
  gold14kt_gram: "14Kt",
  gold18kt_gram: "18Kt",
  gold22kt_gram: "22Kt",
};

const GoldRateTicker = ({ storeid }: { storeid: number }) => {
  const { data, loading } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid },
    pollInterval: 3600000,
    skip: !storeid,
  });

  const rates = data?.getCurrentMetalRates;

  const fmt = (v: number | null | undefined) =>
    v != null ? `$${Number(v).toFixed(2)}` : "—";

  const todayStr = new Date().toISOString().slice(0, 10);
  const isStale = !rates || rates.ratedate < todayStr;

  const lastUpdated = rates?.createdat
    ? (() => { const d = new Date(rates.createdat); return isNaN(d.getTime()) ? null : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); })()
    : null;

  if (loading) return null;

  return (
    <div
      style={{
        background: "#0f172a",
        borderTop: "1px solid #1e293b",
        padding: "4px 16px",
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
        minHeight: 28,
      }}
    >
      {isStale && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "#fbbf24",
            marginRight: 12,
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={11} />
          No gold rates for today
        </span>
      )}

      {rates && (
        <>
          <span style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 16 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "1px 6px",
                borderRadius: 4,
                background: rates.source === "manual" ? "#78350f" : "#14532d",
                color: rates.source === "manual" ? "#fde68a" : "#86efac",
              }}
            >
              {(({ manual: "MANUAL", "metal-sentinel": "METAL SENTINEL", kitco: "KITCO", "metals.live": "METALS.LIVE", yahoo: "YAHOO" } as Record<string, string>)[rates.source ?? ""] ?? (rates.source ?? "").toUpperCase())}
            </span>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {lastUpdated}
              </span>
            )}
          </span>

          {/* Divider between meta and prices */}
          <span style={{ color: "#334155", marginRight: 14, fontSize: 12 }}>│</span>

          {/* Gold karat prices */}
          {(["gold10kt_gram", "gold14kt_gram", "gold18kt_gram", "gold22kt_gram"] as const).map(
            (key) => (
              <span key={key} style={{ marginRight: 10, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{RATE_LABEL[key]} </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>
                  {fmt(rates[key])}
                </span>
              </span>
            )
          )}

          {/* Divider */}
          <span style={{ color: "#334155", marginRight: 10, fontSize: 11 }}>│</span>

          {/* Silver */}
          {rates.silver_gram != null && (
            <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>Silver </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>
                {fmt(rates.silver_gram)}
              </span>
            </span>
          )}

          {/* Platinum */}
          {rates.platinum_gram != null && (
            <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>Platinum </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>
                {fmt(rates.platinum_gram)}
              </span>
            </span>
          )}

          {/* Rhodium */}
          {rates.rhodium_gram != null && (
            <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>Rhodium </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>
                {fmt(rates.rhodium_gram)}
              </span>
            </span>
          )}

          <span style={{ fontSize: 10, color: "#94a3b8" }}>/gram</span>
        </>
      )}

      {!rates && !loading && (
        <span style={{ fontSize: 10, color: "#475569" }}>
          Gold rates not set — go to System Settings → Metal Rates
        </span>
      )}
    </div>
  );
};

const Footer: React.FC = () => {
  const params = useParams();
  const storeId = params?.storeId ? parseInt(params.storeId as string, 10) : null;

  return (
    <footer>
      {storeId && <GoldRateTicker storeid={storeId} />}
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center py-2 border-top text-muted small">
          <div>&copy; {new Date().getFullYear()} JewelPOS - Wholesale <span className="text-muted ms-1" style={{ fontSize: 11 }}>v0.1.0</span></div>
          <div>Powered by POSitive Business Solution</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
