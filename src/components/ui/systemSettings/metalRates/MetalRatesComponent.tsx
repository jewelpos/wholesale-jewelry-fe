"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Save } from "react-feather";
import Swal from "sweetalert2";
import { GET_CURRENT_METAL_RATES_QUERY, GET_METAL_RATE_HISTORY_QUERY } from "@/lib/graphql/query/metalRates";
import { SET_MANUAL_METAL_RATES_MUTATION, FETCH_METAL_RATES_FROM_KITCO_MUTATION } from "@/lib/graphql/mutations/metalRates";

interface RateField {
  key: string;
  label: string;
  color: string;
}

const GOLD_FIELDS: RateField[] = [
  { key: "gold10kt_gram", label: "10Kt Gold", color: "#f59e0b" },
  { key: "gold14kt_gram", label: "14Kt Gold", color: "#f59e0b" },
  { key: "gold18kt_gram", label: "18Kt Gold", color: "#f59e0b" },
  { key: "gold22kt_gram", label: "22Kt Gold", color: "#f59e0b" },
];
const OTHER_FIELDS: RateField[] = [
  { key: "silver_gram", label: "Silver", color: "#93c5fd" },
  { key: "platinum_gram", label: "Platinum", color: "#93c5fd" },
  { key: "rhodium_gram", label: "Rhodium", color: "#93c5fd" },
];

const fmt = (v: any) => (v != null ? `$${Number(v).toFixed(4)}` : "—");

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  "metal-sentinel": "Metal Sentinel",
  kitco: "Kitco",
  "metals.live": "Metals.Live",
  yahoo: "Yahoo Finance",
};

const SourceBadge = ({ source }: { source: string }) => (
  <span
    style={{
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      background: source === "manual" ? "#fef3c7" : "#dcfce7",
      color: source === "manual" ? "#92400e" : "#166534",
    }}
  >
    {SOURCE_LABELS[source] ?? source}
  </span>
);

const MetalRatesComponent = () => {
  const router = useRouter();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const storeid = parseInt(storeIdParam as string, 10);

  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  const { data, loading, refetch } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid },
    skip: !storeid,
    fetchPolicy: "network-only",
  });
  const { data: histData, loading: histLoading } = useQuery(GET_METAL_RATE_HISTORY_QUERY, {
    variables: { storeid, days: 30 },
    skip: !storeid,
    fetchPolicy: "network-only",
  });

  const [fetchFromKitco, { loading: fetching }] = useMutation(FETCH_METAL_RATES_FROM_KITCO_MUTATION);
  const [saveManual, { loading: saving }] = useMutation(SET_MANUAL_METAL_RATES_MUTATION);

  const rates = data?.getCurrentMetalRates;
  const history: any[] = histData?.getMetalRateHistory ?? [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const isStale = !rates || rates.ratedate < todayStr;

  const handleFetchKitco = async () => {
    const res = await fetchFromKitco({ variables: { storeid } });
    const result = res.data?.fetchMetalRatesFromKitco;
    if (result?.success) {
      Swal.fire({ icon: "success", title: "Rates updated", text: "Latest spot prices fetched successfully.", timer: 2000, showConfirmButton: false });
      refetch();
    } else {
      Swal.fire({ icon: "warning", title: "Could not fetch rates", text: result?.message ?? "All price feeds unavailable. Use manual entry below.", confirmButtonText: "OK" });
    }
  };

  const handleSaveManual = async () => {
    const toNum = (k: string) => (manualValues[k] ? parseFloat(manualValues[k]) : undefined);
    const input: any = { storeid };
    [...GOLD_FIELDS, ...OTHER_FIELDS].forEach(({ key }) => {
      const v = toNum(key);
      if (v !== undefined && !isNaN(v)) input[key] = v;
    });

    if (manualValues["goldspot_oz"]) {
      const s = parseFloat(manualValues["goldspot_oz"]);
      if (!isNaN(s)) input.goldspot_oz = s;
    }

    try {
      await saveManual({ variables: { input } });
      Swal.fire({ icon: "success", title: "Rates saved", timer: 1800, showConfirmButton: false });
      setManualValues({});
      refetch();
    } catch (err: any) {
      Swal.fire("Error", err.message ?? "Failed to save", "error");
    }
  };

  const allManualFields = [
    { key: "goldspot_oz", label: "Gold Spot ($/troy oz)", color: "#f59e0b" },
    ...GOLD_FIELDS,
    ...OTHER_FIELDS,
  ];

  return (
    <>
      <div className="page-header">
        <div className="add-item d-flex flex-column">
          <button
            type="button"
            onClick={() => router.push(`/jw/${storeIdParam}/${outletIdParam}/settings/system_settings`)}
            style={{ background: "none", border: "none", padding: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", cursor: "pointer" }}
          >
            ← System Settings
          </button>
          <div className="page-title">
            <h4>Metal Rates</h4>
            <h6>Daily gold, silver, platinum and rhodium spot prices</h6>
          </div>
        </div>
        <div className="page-btn">
          <button
            className="btn btn-added d-flex align-items-center gap-2"
            onClick={handleFetchKitco}
            disabled={fetching}
          >
            <RefreshCw size={14} className={fetching ? "spin" : ""} />
            {fetching ? "Fetching…" : "Fetch Live Rates"}
          </button>
        </div>
      </div>

      {isStale && (
        <div
          className="alert d-flex align-items-center gap-2"
          style={{ background: "#fffbeb", border: "1px solid #f59e0b", color: "#92400e", borderRadius: 8, fontSize: 13, padding: "10px 14px", marginBottom: 16 }}
        >
          <span>⚠</span>
          <span>
            Gold rates are not set for today. Fetch from Kitco or use the manual entry below before creating Wt-priced invoices.
          </span>
        </div>
      )}

      {/* Today's Rates Card */}
      <div className="card mb-4" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)" }}>
        <div className="card-header d-flex justify-content-between align-items-center" style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Today&apos;s Rates</span>
          {rates && <SourceBadge source={rates.source} />}
          {rates?.createdat && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Last updated {new Date(rates.createdat).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="card-body">
          {loading && <div className="text-muted" style={{ fontSize: 13 }}>Loading…</div>}
          {!loading && !rates && (
            <div className="text-muted" style={{ fontSize: 13 }}>No rates recorded yet.</div>
          )}
          {rates && (
            <div className="row g-3">
              {[...GOLD_FIELDS, ...OTHER_FIELDS].map(({ key, label, color }) => (
                <div key={key} className="col-xl-2 col-lg-3 col-md-4 col-6">
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color }}>{fmt((rates as any)[key])}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>/gram</div>
                  </div>
                </div>
              ))}
              {rates.goldspot_oz && (
                <div className="col-xl-2 col-lg-3 col-md-4 col-6">
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Gold Spot</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{fmt(rates.goldspot_oz)}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>/troy oz</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Override */}
      <div className="card mb-4" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)" }}>
        <div className="card-header" style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Manual Override</span>
          <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>Enter values per gram (leave blank to skip)</span>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {allManualFields.map(({ key, label, color }) => (
              <div key={key} className="col-xl-2 col-lg-3 col-md-4 col-6">
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>{label}</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 12, color }}>$</span>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control form-control-sm"
                    placeholder="0.0000"
                    value={manualValues[key] ?? ""}
                    onChange={(e) => setManualValues((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button
              className="btn btn-submit btn-sm d-flex align-items-center gap-2"
              onClick={handleSaveManual}
              disabled={saving}
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save Manual Rates"}
            </button>
          </div>
        </div>
      </div>

      {/* Rate History */}
      <div className="card" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
        <div className="card-header" style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Rate History — Last 30 Days</span>
        </div>
        {histLoading ? (
          <div className="text-center py-4 text-muted" style={{ fontSize: 13 }}>Loading history…</div>
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-muted" style={{ fontSize: 13 }}>No history yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
              <thead style={{ fontSize: 11, backgroundColor: "var(--surface-secondary)", borderBottom: "2px solid var(--border-subtle)" }}>
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="py-2">Source</th>
                  <th className="py-2">Gold Spot/oz</th>
                  <th className="py-2">18Kt /g</th>
                  <th className="py-2">14Kt /g</th>
                  <th className="py-2">10Kt /g</th>
                  <th className="py-2">Silver /g</th>
                  <th className="py-2">Platinum /g</th>
                  <th className="py-2">Rhodium /g</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="px-3 fw-semibold" style={{ color: "#1e293b" }}>
                      {new Date(row.ratedate).toLocaleDateString()}
                    </td>
                    <td><SourceBadge source={row.source} /></td>
                    <td style={{ color: "#f59e0b", fontWeight: 600 }}>{fmt(row.goldspot_oz)}</td>
                    <td style={{ color: "#f59e0b" }}>{fmt(row.gold18kt_gram)}</td>
                    <td style={{ color: "#f59e0b" }}>{fmt(row.gold14kt_gram)}</td>
                    <td style={{ color: "#f59e0b" }}>{fmt(row.gold10kt_gram)}</td>
                    <td style={{ color: "#93c5fd" }}>{fmt(row.silver_gram)}</td>
                    <td style={{ color: "#93c5fd" }}>{fmt(row.platinum_gram)}</td>
                    <td style={{ color: "#93c5fd" }}>{fmt(row.rhodium_gram)}</td>
                    <td style={{ color: "#94a3b8" }}>
                      {row.createdat ? new Date(row.createdat).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MetalRatesComponent;
