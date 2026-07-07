"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Plus, X, Save, ChevronDown, ChevronUp } from "lucide-react";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { GET_EMPLOYEE_COMMISSION_RATES_QUERY } from "@/lib/graphql/query/reports";
import {
  UPSERT_EMPLOYEE_COMMISSION_RATE_MUTATION,
  UPDATE_COMMISSION_TRIGGER_MUTATION,
} from "@/lib/graphql/mutations/commission";

interface CommissionTier {
  id?: number;
  threshold_from: number;
  threshold_to: number | null;
  commission_rate: number;
}

interface EmployeeRate {
  id?: number;
  userid: number;
  username: string;
  commission_basis: string;
  is_active: boolean;
  tiers: CommissionTier[];
}

interface EditingRow {
  userid: number;
  commission_basis: string;
  tiers: CommissionTier[];
  showTiers: boolean;
  dirty: boolean;
}

// ─── Tier Row UI ────────────────────────────────────────────
const TierRow = ({
  tier,
  idx,
  total,
  onChange,
  onRemove,
}: {
  tier: CommissionTier;
  idx: number;
  total: number;
  onChange: (idx: number, field: keyof CommissionTier, value: number | null) => void;
  onRemove: (idx: number) => void;
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr auto",
      gap: 6,
      alignItems: "center",
      marginBottom: 4,
    }}
  >
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>From ($)</div>
      <input
        type="number"
        className="form-control form-control-sm"
        value={tier.threshold_from}
        min={0}
        onChange={(e) => onChange(idx, "threshold_from", Number(e.target.value))}
        style={{ fontSize: 12 }}
      />
    </div>
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>
        To ($) {idx === total - 1 ? "— unlimited" : ""}
      </div>
      <input
        type="number"
        className="form-control form-control-sm"
        value={idx === total - 1 ? "" : (tier.threshold_to ?? "")}
        placeholder={idx === total - 1 ? "∞" : ""}
        disabled={idx === total - 1}
        min={0}
        onChange={(e) =>
          onChange(idx, "threshold_to", e.target.value === "" ? null : Number(e.target.value))
        }
        style={{ fontSize: 12 }}
      />
    </div>
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Rate (%)</div>
      <input
        type="number"
        className="form-control form-control-sm"
        value={tier.commission_rate}
        min={0}
        max={100}
        step={0.01}
        onChange={(e) => onChange(idx, "commission_rate", Number(e.target.value))}
        style={{ fontSize: 12 }}
      />
    </div>
    <div style={{ paddingTop: 16 }}>
      {total > 1 && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#ef4444" }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────
const CommissionRatesComponent = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const router = useRouter();
  const dispatch = useDispatch();

  const [commissionTrigger, setCommissionTrigger] = useState<"invoice" | "payment">("invoice");
  const [triggerDirty, setTriggerDirty] = useState(false);
  const [triggerSaving, setTriggerSaving] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<number, EditingRow>>({});
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());

  const { data, loading, refetch } = useQuery(GET_EMPLOYEE_COMMISSION_RATES_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId,
  });

  const [upsertRate] = useMutation(UPSERT_EMPLOYEE_COMMISSION_RATE_MUTATION);
  const [updateTrigger] = useMutation(UPDATE_COMMISSION_TRIGGER_MUTATION);

  const employees: EmployeeRate[] = useMemo(
    () => data?.getEmployeeCommissionRates ?? [],
    [data]
  );

  // Initialize editing rows from fetched data
  useEffect(() => {
    if (!employees.length) return;
    setEditingRows((prev) => {
      const next = { ...prev };
      employees.forEach((emp) => {
        if (!next[emp.userid]) {
          const hasTiers = emp.tiers && emp.tiers.length > 0;
          next[emp.userid] = {
            userid: emp.userid,
            commission_basis: emp.commission_basis || "net",
            tiers: hasTiers
              ? emp.tiers.map((t) => ({
                  threshold_from: Number(t.threshold_from),
                  threshold_to: t.threshold_to != null ? Number(t.threshold_to) : null,
                  commission_rate: Number(t.commission_rate),
                }))
              : [{ threshold_from: 0, threshold_to: null, commission_rate: 0 }],
            showTiers: hasTiers && emp.tiers.length > 1,
            dirty: false,
          };
        }
      });
      return next;
    });
  }, [employees]);

  const getRow = useCallback(
    (userid: number): EditingRow => {
      if (editingRows[userid]) return editingRows[userid];
      const emp = employees.find((e) => e.userid === userid);
      return {
        userid,
        commission_basis: emp?.commission_basis || "net",
        tiers: [{ threshold_from: 0, threshold_to: null, commission_rate: 0 }],
        showTiers: false,
        dirty: false,
      };
    },
    [editingRows, employees]
  );

  const updateRow = useCallback((userid: number, patch: Partial<EditingRow>) => {
    setEditingRows((prev) => ({
      ...prev,
      [userid]: { ...prev[userid], ...patch, dirty: true },
    }));
  }, []);

  const handleBasisChange = useCallback(
    (userid: number, basis: string) => {
      updateRow(userid, { commission_basis: basis });
    },
    [updateRow]
  );

  const handleTierChange = useCallback(
    (userid: number, idx: number, field: keyof CommissionTier, value: number | null) => {
      const row = getRow(userid);
      const tiers = [...row.tiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      // Auto-fill next tier's threshold_from when threshold_to changes
      if (field === "threshold_to" && value != null && idx < tiers.length - 1) {
        tiers[idx + 1] = { ...tiers[idx + 1], threshold_from: value };
      }
      updateRow(userid, { tiers });
    },
    [getRow, updateRow]
  );

  const handleAddTier = useCallback(
    (userid: number) => {
      const row = getRow(userid);
      const tiers = [...row.tiers];
      const lastTier = tiers[tiers.length - 1];
      // Close last tier's threshold_to if unlimited
      const prevTo = lastTier.threshold_to ?? (lastTier.threshold_from + 25000);
      tiers[tiers.length - 1] = { ...lastTier, threshold_to: prevTo };
      tiers.push({ threshold_from: prevTo, threshold_to: null, commission_rate: 0 });
      updateRow(userid, { tiers, showTiers: true });
    },
    [getRow, updateRow]
  );

  const handleRemoveTier = useCallback(
    (userid: number, idx: number) => {
      const row = getRow(userid);
      const tiers = row.tiers.filter((_, i) => i !== idx);
      if (tiers.length > 0) tiers[tiers.length - 1] = { ...tiers[tiers.length - 1], threshold_to: null };
      updateRow(userid, { tiers, showTiers: tiers.length > 1 });
    },
    [getRow, updateRow]
  );

  const handleSaveRow = useCallback(
    async (userid: number) => {
      const row = getRow(userid);
      setSavingRows((prev) => new Set(prev).add(userid));
      const result = await handleTryCatch(async () => {
        await upsertRate({
          variables: {
            storeid: parsedStoreId,
            userid,
            commission_basis: row.commission_basis,
            tiers: row.tiers.map((t) => ({
              threshold_from: t.threshold_from,
              threshold_to: t.threshold_to,
              commission_rate: t.commission_rate,
            })),
          },
        });
        dispatch(
          showNotification({ message: "Commission rate saved.", type: NOTIFICATION_TYPES.SUCCESS })
        );
        setEditingRows((prev) => ({
          ...prev,
          [userid]: { ...prev[userid], dirty: false },
        }));
        refetch();
        return true;
      });
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(userid);
        return next;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    },
    [getRow, upsertRate, parsedStoreId, dispatch, refetch]
  );

  const handleSaveTrigger = useCallback(async () => {
    setTriggerSaving(true);
    const result = await handleTryCatch(async () => {
      await updateTrigger({
        variables: { input: { storeid: parsedStoreId, commission_trigger: commissionTrigger } },
      });
      dispatch(
        showNotification({ message: "Commission trigger updated.", type: NOTIFICATION_TYPES.SUCCESS })
      );
      setTriggerDirty(false);
      return true;
    });
    setTriggerSaving(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  }, [updateTrigger, parsedStoreId, commissionTrigger, dispatch]);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="add-item d-flex flex-column">
          <button
            type="button"
            onClick={() =>
              router.push(`/jw/${storeIdParam}/${outletIdParam}/settings/system_settings`)
            }
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            ← System Settings
          </button>
          <div className="page-title">
            <h4>Commission Rates</h4>
            <h6>Manage sales rep commission rates, tiers, and payout trigger</h6>
          </div>
        </div>
      </div>

      {/* Trigger Toggle Card */}
      <div
        className="card mb-3"
        style={{ border: "1px solid #e2e8f0", borderLeft: "3px solid #8b5cf6" }}
      >
        <div className="card-body py-3">
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>
                Commission Trigger
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                When should commission be earned — at time of invoice or when payment is received?
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["invoice", "payment"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCommissionTrigger(opt);
                    setTriggerDirty(true);
                  }}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 20,
                    border: `1.5px solid ${commissionTrigger === opt ? "#8b5cf6" : "#e2e8f0"}`,
                    background: commissionTrigger === opt ? "#8b5cf618" : "#fff",
                    color: commissionTrigger === opt ? "#8b5cf6" : "#64748b",
                    fontWeight: commissionTrigger === opt ? 700 : 400,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {opt === "invoice" ? "Invoice Date" : "Payment Received"}
                </button>
              ))}
            </div>
            {triggerDirty && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleSaveTrigger}
                disabled={triggerSaving}
                style={{ fontSize: 12, padding: "5px 14px" }}
              >
                {triggerSaving ? "Saving..." : "Save Trigger"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee Commission Rates Table */}
      <div className="card" style={{ border: "1px solid #e2e8f0" }}>
        <div
          className="card-header py-3"
          style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}
        >
          <h6
            className="mb-0 fw-semibold"
            style={{ fontSize: 13, color: "#495057" }}
          >
            Employee Commission Rates
          </h6>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
            Each save creates a new rate record from today — history is preserved for accurate reporting.
          </p>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center" style={{ color: "#94a3b8", fontSize: 13 }}>
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-4 text-center" style={{ color: "#94a3b8", fontSize: 13 }}>
              No employees found. Add users to the store first.
            </div>
          ) : (
            <div>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 3fr auto",
                  gap: 12,
                  padding: "8px 20px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span>Employee</span>
                <span>Basis</span>
                <span>Commission Tiers</span>
                <span></span>
              </div>

              {employees.map((emp) => {
                const row = getRow(emp.userid);
                const isSaving = savingRows.has(emp.userid);
                return (
                  <div
                    key={emp.userid}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      padding: "14px 20px",
                      background: row.dirty ? "#fefce8" : "#fff",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 3fr auto",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      {/* Employee name */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {emp.username}
                        </div>
                        {emp.is_active && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#10b981",
                              background: "#10b98118",
                              padding: "1px 7px",
                              borderRadius: 10,
                            }}
                          >
                            Active rate
                          </span>
                        )}
                      </div>

                      {/* Basis toggle */}
                      <div style={{ display: "flex", gap: 4 }}>
                        {["net", "profit"].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => handleBasisChange(emp.userid, b)}
                            style={{
                              padding: "3px 10px",
                              borderRadius: 12,
                              border: `1.5px solid ${row.commission_basis === b ? "#376fd0" : "#e2e8f0"}`,
                              background: row.commission_basis === b ? "#376fd018" : "#fff",
                              color: row.commission_basis === b ? "#376fd0" : "#94a3b8",
                              fontWeight: row.commission_basis === b ? 700 : 400,
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            {b === "net" ? "Net" : "Profit"}
                          </button>
                        ))}
                      </div>

                      {/* Tiers */}
                      <div>
                        {row.showTiers ? (
                          <>
                            {row.tiers.map((tier, idx) => (
                              <TierRow
                                key={idx}
                                tier={tier}
                                idx={idx}
                                total={row.tiers.length}
                                onChange={(i, f, v) => handleTierChange(emp.userid, i, f, v)}
                                onRemove={(i) => handleRemoveTier(emp.userid, i)}
                              />
                            ))}
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleAddTier(emp.userid)}
                                style={{
                                  background: "none",
                                  border: "1px dashed #cbd5e1",
                                  borderRadius: 6,
                                  padding: "3px 10px",
                                  fontSize: 11,
                                  color: "#64748b",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Plus size={10} /> Add Tier
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRow(emp.userid, { showTiers: false })}
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <ChevronUp size={11} /> Collapse
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "#64748b" }}>Flat rate:</span>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: 70, fontSize: 12 }}
                                value={row.tiers[0]?.commission_rate ?? 0}
                                min={0}
                                max={100}
                                step={0.01}
                                onChange={(e) =>
                                  handleTierChange(emp.userid, 0, "commission_rate", Number(e.target.value))
                                }
                              />
                              <span style={{ fontSize: 11, color: "#64748b" }}>%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateRow(emp.userid, { showTiers: true });
                                if (row.tiers.length < 2) handleAddTier(emp.userid);
                              }}
                              style={{
                                background: "none",
                                border: "1px dashed #cbd5e1",
                                borderRadius: 6,
                                padding: "3px 10px",
                                fontSize: 11,
                                color: "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <ChevronDown size={10} /> Use Tiers
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Save button */}
                      <div>
                        <button
                          type="button"
                          className={`btn btn-sm ${row.dirty ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => handleSaveRow(emp.userid)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: "5px 12px", whiteSpace: "nowrap" }}
                        >
                          {isSaving ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save size={11} className="me-1" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommissionRatesComponent;
