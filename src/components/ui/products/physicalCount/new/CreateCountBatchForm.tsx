"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CREATE_PHYSICAL_COUNT_BATCH_MUTATION } from "@/lib/graphql/mutations/physicalcount";
import useWarehouse from "@/hooks/useWarehouse";
import useCategory from "@/hooks/useCategory";

type Scope = "ALL" | "CATEGORY" | "SUBCATEGORY" | "LOCATION";

const today = () => new Date().toISOString().split("T")[0];

const CreateCountBatchForm = () => {
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = Number(outletIdParam);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const { fetchCategoriesByStoreId, fetchSubCategoriesByStoreId, categories, subCategories } = useCategory();

  const [warehouseid, setWarehouseid] = useState<number | "">("");
  const [scope, setScope] = useState<Scope>("ALL");
  const [categoryid, setCategoryid] = useState<number | "">("");
  const [subcategoryid, setSubcategoryid] = useState<number | "">("");
  const [locationfilter, setLocationfilter] = useState("");
  const [countdate, setCountdate] = useState(today());
  const [blindcount, setBlindcount] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const [createBatch] = useMutation(CREATE_PHYSICAL_COUNT_BATCH_MUTATION);

  useEffect(() => {
    if (parsedOutletId) fetchWarehouseByOutletId(parsedOutletId);
    if (parsedStoreId) fetchCategoriesByStoreId(parsedStoreId);
  }, [parsedStoreId, parsedOutletId]);

  useEffect(() => {
    if (scope === "SUBCATEGORY" && categoryid) {
      fetchSubCategoriesByStoreId(parsedStoreId, Number(categoryid));
    }
  }, [scope, categoryid, parsedStoreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseid) {
      dispatch(showNotification({ message: "Please select a warehouse", type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setSaving(true);
    try {
      const res = await createBatch({
        variables: {
          input: {
            storeid: parsedStoreId,
            warehouseid: Number(warehouseid),
            outletid: parsedOutletId,
            scope,
            categoryid: scope === "CATEGORY" || scope === "SUBCATEGORY" ? (Number(categoryid) || null) : null,
            subcategoryid: scope === "SUBCATEGORY" ? (Number(subcategoryid) || null) : null,
            locationfilter: scope === "LOCATION" ? locationfilter : null,
            countdate,
            blindcount,
            remarks: remarks || null,
          },
        },
      });
      const result = res.data?.createPhysicalCountBatch;
      if (result?.success) {
        dispatch(showNotification({ message: result.message || "Batch created", type: NOTIFICATION_TYPES.SUCCESS }));
        const batchid = result.data?.batchid;
        const base = `/jw/${storeIdParam}/${outletIdParam}/products/physical_count`;
        router.push(batchid ? `${base}/${batchid}/count` : `${base}/list`);
      } else {
        dispatch(showNotification({ message: result?.error || "Failed to create batch", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch(showNotification({ message: msg, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="mb-0 fw-semibold">New Physical Count</h5>
          <div className="text-muted" style={{ fontSize: 12 }}>Define scope and start a count batch</div>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Count Setup</h6>
            <div className="row g-3">
              {/* Warehouse */}
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Warehouse *</label>
                <select
                  className="form-select form-select-sm"
                  value={warehouseid}
                  onChange={e => setWarehouseid(e.target.value ? Number(e.target.value) : "")}
                  required
                >
                  <option value="">Select warehouse…</option>
                  {warehouses.map(w => (
                    <option key={w.warehouseid} value={w.warehouseid}>{w.warehousename}</option>
                  ))}
                </select>
              </div>

              {/* Count Date */}
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Count Date *</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={countdate}
                  onChange={e => setCountdate(e.target.value)}
                  required
                />
              </div>

              {/* Blind Count */}
              <div className="col-md-3 d-flex align-items-end pb-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="blindcount"
                    checked={blindcount}
                    onChange={e => setBlindcount(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="blindcount" style={{ fontSize: 13 }}>
                    Blind Count
                    <div className="text-muted" style={{ fontSize: 11 }}>Hide system qty from counters</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Count Scope</h6>
            <div className="row g-2 mb-3">
              {(["ALL", "CATEGORY", "SUBCATEGORY", "LOCATION"] as Scope[]).map(s => (
                <div key={s} className="col-6 col-md-3">
                  <div
                    className={`border rounded p-2 text-center`}
                    style={{
                      cursor: "pointer",
                      backgroundColor: scope === s ? "var(--bs-primary)" : "transparent",
                      color: scope === s ? "#fff" : "inherit",
                      fontSize: 13,
                      userSelect: "none",
                    }}
                    onClick={() => { setScope(s); setCategoryid(""); setSubcategoryid(""); setLocationfilter(""); }}
                  >
                    {s === "ALL" ? "All Items" : s === "LOCATION" ? "By Location" : `By ${s.charAt(0) + s.slice(1).toLowerCase()}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Scope-specific fields */}
            {(scope === "CATEGORY" || scope === "SUBCATEGORY") && (
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Category *</label>
                  <select
                    className="form-select form-select-sm"
                    value={categoryid}
                    onChange={e => { setCategoryid(e.target.value ? Number(e.target.value) : ""); setSubcategoryid(""); }}
                    required
                  >
                    <option value="">Select category…</option>
                    {categories.map(c => (
                      <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
                    ))}
                  </select>
                </div>
                {scope === "SUBCATEGORY" && (
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Subcategory *</label>
                    <select
                      className="form-select form-select-sm"
                      value={subcategoryid}
                      onChange={e => setSubcategoryid(e.target.value ? Number(e.target.value) : "")}
                      required
                    >
                      <option value="">Select subcategory…</option>
                      {subCategories.map(sc => (
                        <option key={sc.subcategoryid} value={sc.subcategoryid}>{sc.subcategoryname}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            {scope === "LOCATION" && (
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Showcase / Location Filter *</label>
                  <input
                    className="form-control form-control-sm"
                    placeholder="e.g. Showcase A"
                    value={locationfilter}
                    onChange={e => setLocationfilter(e.target.value)}
                    required
                  />
                  <div className="form-text">Searches itemlocation field (partial match)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div className="card mb-3">
          <div className="card-body">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Remarks</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="Optional notes…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-1" />Creating…</>
            ) : (
              "Create Count Batch →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCountBatchForm;
