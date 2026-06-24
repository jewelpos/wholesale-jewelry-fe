"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_ALL_WAREHOUSE_SETTINGS_QUERY } from "@/lib/graphql/query/warehouse";
import { GET_WAREHOUSES_BY_OUTLET_ID_QUERY } from "@/lib/graphql/query/warehouse";
import { UPSERT_WAREHOUSE_SETTINGS_MUTATION } from "@/lib/graphql/mutations/warehouseSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

interface WarehouseSettingsRow {
  warehouseid: number;
  warehousename: string;
  saletagkey: number | null;
  tagpricekey: number | null;
  pricecodeone: string | null;
  pricecodetwo: string | null;
  pricecodethree: string | null;
  pricecodefour: string | null;
  pricecodefive: string | null;
  pricecodesix: string | null;
  pricecodeseven: string | null;
  pricecodeeight: string | null;
  pricecodenine: string | null;
  pricecodezero: string | null;
  allowpcsentry: number | null;
  allowcarriage: number | null;
  storepolicy: string | null;
  defaultsalestaxrate: number | null;
}

type SettingsFormValues = Omit<WarehouseSettingsRow, "warehouseid" | "warehousename">;

const emptySettings = (): SettingsFormValues => ({
  saletagkey: null,
  tagpricekey: null,
  pricecodeone: "",
  pricecodetwo: "",
  pricecodethree: "",
  pricecodefour: "",
  pricecodefive: "",
  pricecodesix: "",
  pricecodeseven: "",
  pricecodeeight: "",
  pricecodenine: "",
  pricecodezero: "",
  allowpcsentry: null,
  allowcarriage: null,
  storepolicy: "",
  defaultsalestaxrate: null,
});

const PRICE_CODE_FIELDS: { key: keyof SettingsFormValues; label: string }[] = [
  { key: "pricecodeone",   label: "Price Code 1" },
  { key: "pricecodetwo",   label: "Price Code 2" },
  { key: "pricecodethree", label: "Price Code 3" },
  { key: "pricecodefour",  label: "Price Code 4" },
  { key: "pricecodefive",  label: "Price Code 5" },
  { key: "pricecodesix",   label: "Price Code 6" },
  { key: "pricecodeseven", label: "Price Code 7" },
  { key: "pricecodeeight", label: "Price Code 8" },
  { key: "pricecodenine",  label: "Price Code 9" },
  { key: "pricecodezero",  label: "Price Code 0" },
];

const StoreSettingsForm = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const router = useRouter();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const dispatch = useDispatch();
  const { isAdmin, isAtLeastManager } = useUserRole();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [form, setForm] = useState<SettingsFormValues>(emptySettings());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Admin: fetch all warehouses with settings
  const { data: allData, loading: allLoading, refetch: refetchAll } = useQuery(GET_ALL_WAREHOUSE_SETTINGS_QUERY, {
    variables: { storeid: parsedStoreId },
    skip: !parsedStoreId || !isAdmin,
  });

  // Non-admin: fetch warehouses for this outlet
  const { data: outletData, loading: outletLoading } = useQuery(GET_WAREHOUSES_BY_OUTLET_ID_QUERY, {
    variables: { outletid: parsedOutletId },
    skip: !parsedOutletId || isAdmin,
  });

  const [upsertSettings] = useMutation(UPSERT_WAREHOUSE_SETTINGS_MUTATION);

  const allRows: WarehouseSettingsRow[] = allData?.getAllWarehouseSettings ?? [];
  const outletWarehouses: { warehouseid: number; warehousename: string }[] = outletData?.getWarehousesByOutletId ?? [];

  // Warehouse list to display in selector
  const warehouseOptions = isAdmin
    ? allRows.map(r => ({ warehouseid: r.warehouseid, warehousename: r.warehousename }))
    : outletWarehouses;

  // Auto-select first warehouse on load
  useEffect(() => {
    if (!selectedWarehouseId && warehouseOptions.length > 0) {
      setSelectedWarehouseId(warehouseOptions[0].warehouseid);
    }
  }, [warehouseOptions, selectedWarehouseId]);

  // Populate form when warehouse selection changes
  useEffect(() => {
    if (!selectedWarehouseId) return;
    if (isAdmin && allRows.length > 0) {
      const row = allRows.find(r => r.warehouseid === selectedWarehouseId);
      if (row) {
        setForm({
          saletagkey: row.saletagkey,
          tagpricekey: row.tagpricekey,
          pricecodeone: row.pricecodeone ?? "",
          pricecodetwo: row.pricecodetwo ?? "",
          pricecodethree: row.pricecodethree ?? "",
          pricecodefour: row.pricecodefour ?? "",
          pricecodefive: row.pricecodefive ?? "",
          pricecodesix: row.pricecodesix ?? "",
          pricecodeseven: row.pricecodeseven ?? "",
          pricecodeeight: row.pricecodeeight ?? "",
          pricecodenine: row.pricecodenine ?? "",
          pricecodezero: row.pricecodezero ?? "",
          allowpcsentry: row.allowpcsentry,
          allowcarriage: row.allowcarriage,
          storepolicy: row.storepolicy ?? "",
          defaultsalestaxrate: row.defaultsalestaxrate ?? null,
        });
        setDirty(false);
      }
    } else {
      setForm(emptySettings());
      setDirty(false);
    }
  }, [selectedWarehouseId, allRows, isAdmin]);

  const set = (key: keyof SettingsFormValues, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedWarehouseId) return;
    setSaving(true);
    const result = await handleTryCatch(async () => {
      await upsertSettings({
        variables: {
          storeid: parsedStoreId,
          input: {
            warehouseid: selectedWarehouseId,
            saletagkey: form.saletagkey != null ? Number(form.saletagkey) : null,
            tagpricekey: form.tagpricekey != null ? Number(form.tagpricekey) : null,
            pricecodeone: form.pricecodeone || null,
            pricecodetwo: form.pricecodetwo || null,
            pricecodethree: form.pricecodethree || null,
            pricecodefour: form.pricecodefour || null,
            pricecodefive: form.pricecodefive || null,
            pricecodesix: form.pricecodesix || null,
            pricecodeseven: form.pricecodeseven || null,
            pricecodeeight: form.pricecodeeight || null,
            pricecodenine: form.pricecodenine || null,
            pricecodezero: form.pricecodezero || null,
            allowpcsentry: form.allowpcsentry,
            allowcarriage: form.allowcarriage,
            storepolicy: form.storepolicy || null,
            defaultsalestaxrate: form.defaultsalestaxrate != null ? Number(form.defaultsalestaxrate) : null,
          },
        },
      });
      if (isAdmin) await refetchAll();
      setDirty(false);
      return true;
    });
    setSaving(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      dispatch(showNotification({ message: "Settings saved successfully", type: NOTIFICATION_TYPES.SUCCESS }));
    }
  };

  const loading = allLoading || outletLoading;
  const selectedWarehouseName = warehouseOptions.find(w => w.warehouseid === selectedWarehouseId)?.warehousename ?? "";

  return (
    <div style={{ padding: "4px 0 32px" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex justify-content-between align-items-center w-100">
          <div className="page-title">
            <h4>Store Settings</h4>
            <h6>Configure per-warehouse price codes, sale settings, and store policy</h6>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="row mt-3">
        {/* Left: warehouse list */}
        <div className="col-lg-3 col-md-4 mb-3">
          <div className="card" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <div className="card-body p-0">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 13, color: "#475569" }}>
                Warehouses
              </div>
              {loading ? (
                <div className="p-3 text-center text-muted" style={{ fontSize: 13 }}>Loading...</div>
              ) : warehouseOptions.length === 0 ? (
                <div className="p-3 text-center text-muted" style={{ fontSize: 13 }}>No warehouses found</div>
              ) : (
                <ul className="list-unstyled mb-0">
                  {warehouseOptions.map(w => (
                    <li
                      key={w.warehouseid}
                      onClick={() => setSelectedWarehouseId(w.warehouseid)}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: 13,
                        borderLeft: selectedWarehouseId === w.warehouseid ? "3px solid #376fd0" : "3px solid transparent",
                        background: selectedWarehouseId === w.warehouseid ? "#f0f4ff" : "transparent",
                        color: selectedWarehouseId === w.warehouseid ? "#376fd0" : "#334155",
                        fontWeight: selectedWarehouseId === w.warehouseid ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {w.warehousename}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right: settings form */}
        <div className="col-lg-9 col-md-8">
          {!selectedWarehouseId ? (
            <div className="card p-4 text-center text-muted" style={{ border: "1px dashed #e2e8f0", borderRadius: 8 }}>
              Select a warehouse to view or edit its settings
            </div>
          ) : (
            <>
              <div className="card mb-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div className="card-body">
                  <h6 className="mb-3" style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                    {selectedWarehouseName} — General Settings
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Sale Tag Key</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={form.saletagkey ?? ""}
                        onChange={e => set("saletagkey", e.target.value === "" ? null : Number(e.target.value))}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Tag Price Key</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={form.tagpricekey ?? ""}
                        onChange={e => set("tagpricekey", e.target.value === "" ? null : Number(e.target.value))}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Default Sales Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max="100"
                        className="form-control form-control-sm"
                        value={form.defaultsalestaxrate ?? ""}
                        onChange={e => set("defaultsalestaxrate", e.target.value === "" ? null : Number(e.target.value))}
                        placeholder="e.g. 8.875"
                      />
                      <div className="form-text" style={{ fontSize: 11 }}>Auto-filled on new invoices when no customer rate is set</div>
                    </div>
                    <div className="col-md-4 d-flex gap-4 align-items-end pb-1">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="allowpcsentry"
                          checked={!!form.allowpcsentry}
                          onChange={e => set("allowpcsentry", e.target.checked ? 1 : 0)}
                        />
                        <label className="form-check-label" htmlFor="allowpcsentry" style={{ fontSize: 12, color: "#475569" }}>
                          Allow Pcs Entry
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="allowcarriage"
                          checked={!!form.allowcarriage}
                          onChange={e => set("allowcarriage", e.target.checked ? 1 : 0)}
                        />
                        <label className="form-check-label" htmlFor="allowcarriage" style={{ fontSize: 12, color: "#475569" }}>
                          Allow Carriage
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div className="card-body">
                  <h6 className="mb-3" style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                    Price Code Characters
                  </h6>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                    Single character assigned to each price position (1–0). Used for encoded price tags.
                  </p>
                  <div className="row g-2">
                    {PRICE_CODE_FIELDS.map(({ key, label }) => (
                      <div key={key} className="col-6 col-sm-4 col-md-2">
                        <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                          {label}
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          maxLength={1}
                          value={(form[key] as string) ?? ""}
                          onChange={e => set(key, e.target.value.slice(-1))}
                          style={{ fontWeight: 700, letterSpacing: "0.05em" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card mb-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div className="card-body">
                  <h6 className="mb-2" style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                    Store Policy
                  </h6>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                    This text prints on invoices, memos, and sales orders below the customer signature.
                  </p>
                  <textarea
                    className="form-control form-control-sm"
                    rows={5}
                    value={form.storepolicy ?? ""}
                    onChange={e => set("storepolicy", e.target.value)}
                    placeholder="Enter your store policy, return policy, or any terms..."
                    style={{ fontSize: 12, resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                {dirty && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSelectedWarehouseId(null);
                      setTimeout(() => setSelectedWarehouseId(selectedWarehouseId), 0);
                    }}
                  >
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsForm;
