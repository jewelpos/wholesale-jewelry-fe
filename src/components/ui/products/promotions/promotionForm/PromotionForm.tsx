"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_PROMOTION_QUERY } from "@/lib/graphql/query/promotions";
import { GET_ITEM_CATEGORIES_QUERY } from "@/lib/graphql/query/products";
import { CREATE_PROMOTION_MUTATION, UPDATE_PROMOTION_MUTATION } from "@/lib/graphql/mutations/promotions";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { PromotionItem } from "@/types/promotion";
import ButtonLoader from "@/components/ui/ButtonLoader";
import SelectProduct from "@/components/forms/SelectProduct";

const emptyRule = (): PromotionItem => ({
  itemid: null,
  itemcode: null,
  itemname: null,
  categoryid: null,
  pricerangemin: null,
  pricerangemax: null,
  requiredquantity: null,
  discountamount: 0,
  discounttype: "percent",
});

interface PromotionFormProps {
  promotionId?: number;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ promotionId }) => {
  const { storeId: storeIdParam, outletId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const isEdit = !!promotionId;

  const [name, setName] = useState("");
  const [startdate, setStartdate] = useState("");
  const [enddate, setEnddate] = useState("");
  const [isactive, setIsactive] = useState(1);
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<PromotionItem[]>([emptyRule()]);
  const [saving, setSaving] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(isEdit);

  const [getPromotion] = useLazyQuery(GET_PROMOTION_QUERY, { fetchPolicy: "network-only" });
  const [getCategories] = useLazyQuery(GET_ITEM_CATEGORIES_QUERY);
  const [categories, setCategories] = useState<{ categoryid: number; categoryname: string }[]>([]);

  const [createPromotion] = useMutation(CREATE_PROMOTION_MUTATION);
  const [updatePromotion] = useMutation(UPDATE_PROMOTION_MUTATION);

  useEffect(() => {
    getCategories({ variables: { storeid: parsedStoreId } }).then(r => {
      setCategories(r.data?.getItemCategories ?? []);
    });
  }, [parsedStoreId, getCategories]);

  useEffect(() => {
    if (!isEdit || !promotionId) return;
    setLoadingPromo(true);
    getPromotion({ variables: { storeid: parsedStoreId, promotionid: promotionId } }).then(r => {
      setLoadingPromo(false);
      if (r.error) {
        dispatch(showNotification({ message: `Failed to load promotion: ${r.error.message}`, type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      const p = r.data?.getPromotion;
      if (!p) {
        dispatch(showNotification({ message: "Promotion not found", type: NOTIFICATION_TYPES.ERROR }));
        return;
      }
      setName(p.promotionname ?? "");
      setStartdate(p.startdate ? p.startdate.slice(0, 10) : "");
      setEnddate(p.enddate ? p.enddate.slice(0, 10) : "");
      setIsactive(p.isactive ?? 0);
      setDescription(p.description ?? "");
      const loaded = (p.items ?? []).map((i: any) => ({ ...i }));
      setRules(loaded.length > 0 ? loaded : [emptyRule()]);
    });
  }, [isEdit, promotionId, parsedStoreId, getPromotion, dispatch]);

  const updateRule = (idx: number, field: keyof PromotionItem, value: any) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // Called when user selects a product from SelectProduct dropdown
  const handleProductSelect = (idx: number, data: any) => {
    if (!data) {
      setRules(prev => prev.map((r, i) =>
        i === idx ? { ...r, itemid: null, itemcode: null, itemname: null } : r
      ));
      return;
    }
    setRules(prev => prev.map((r, i) =>
      i === idx ? {
        ...r,
        itemid: String(data.itemid),
        itemcode: data.itemcode,
        itemname: data.itemdescription,
        // Clear category when item is selected
        categoryid: null,
      } : r
    ));
  };

  const addRule = () => {
    setRules(prev => [...prev, emptyRule()]);
  };

  const removeRule = (idx: number) => {
    setRules(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) { dispatch(showNotification({ message: "Promotion name is required", type: NOTIFICATION_TYPES.ERROR })); return; }
    if (!startdate || !enddate) { dispatch(showNotification({ message: "Start and end dates are required", type: NOTIFICATION_TYPES.ERROR })); return; }

    const cleanRules = rules
      .filter(r => r.itemid || r.categoryid)
      .map(r => ({
        promotionitemid: r.promotionitemid ?? null,
        itemid: r.itemid || null,
        categoryid: r.categoryid ? Number(r.categoryid) : null,
        pricerangemin: r.pricerangemin ? Number(r.pricerangemin) : 0,
        pricerangemax: r.pricerangemax ? Number(r.pricerangemax) : 0,
        requiredquantity: r.requiredquantity ? Number(r.requiredquantity) : 0,
        discountamount: Number(r.discountamount) || 0,
        discounttype: r.discounttype || "percent",
      }));

    setSaving(true);
    const result = await handleTryCatch(async () => {
      if (isEdit) {
        await updatePromotion({
          variables: {
            storeid: parsedStoreId,
            input: { promotionid: promotionId, promotionname: name, promotiontype: "standard", startdate, enddate, isactive, description: description || null, items: cleanRules },
          },
        });
      } else {
        await createPromotion({
          variables: {
            storeid: parsedStoreId,
            input: { promotionname: name, promotiontype: "standard", startdate, enddate, isactive, description: description || null, items: cleanRules },
          },
        });
      }
      return true;
    });
    setSaving(false);

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      dispatch(showNotification({ message: isEdit ? "Promotion updated" : "Promotion created", type: NOTIFICATION_TYPES.SUCCESS }));
      router.push(`/jw/${storeIdParam}/${outletId}/products/promotions`);
    }
  };

  return (
    <div style={{ padding: "4px 0 32px" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex justify-content-between align-items-center w-100">
          <div className="page-title">
            <h4>{isEdit ? "Edit Promotion" : "New Promotion"}</h4>
            <h6>Define discount rules by item or category with optional date range</h6>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>
            <ArrowLeft size={13} style={{ marginRight: 4 }} />Back
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card mt-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Promotion Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control form-control-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Clearance 2025" />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Start Date <span className="text-danger">*</span></label>
              <input type="date" className="form-control form-control-sm" value={startdate} onChange={e => setStartdate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>End Date <span className="text-danger">*</span></label>
              <input type="date" className="form-control form-control-sm" value={enddate} onChange={e => setEnddate(e.target.value)} />
            </div>
            <div className="col-md-9">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Description</label>
              <input type="text" className="form-control form-control-sm" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional note about this promotion" />
            </div>
            <div className="col-md-3 d-flex align-items-end pb-1">
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="isactive" checked={isactive === 1} onChange={e => setIsactive(e.target.checked ? 1 : 0)} />
                <label className="form-check-label" htmlFor="isactive" style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Active</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules card */}
      <div className="card mt-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <div className="card-body">
          <h6 style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>Discount Rules</h6>
          {loadingPromo && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b", fontSize: 13 }}>
              <span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />
              Loading promotion data...
            </div>
          )}
          {!loadingPromo && (<>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            Each rule applies a discount to a specific item or category. Search by item code, description, or barcode — or select a category.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-sm" style={{ fontSize: 12, minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ fontWeight: 600, color: "#475569", minWidth: 260 }}>Item (search by code / name / barcode)</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 150 }}>— or — Category</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 90 }}>Min Price</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 90 }}>Max Price</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 80 }}>Req Qty</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 90 }}>Discount</th>
                  <th style={{ fontWeight: 600, color: "#475569", width: 90 }}>Type</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "4px 6px" }}>
                      <SelectProduct
                        storeId={parsedStoreId}
                        hasWarehouseId={false}
                        value={rule.itemid ? Number(rule.itemid) : null}
                        initialLabel={
                          rule.itemid && (rule.itemcode || rule.itemname)
                            ? `${rule.itemcode ?? ""}${rule.itemname ? ` - ${rule.itemname}` : ""}`
                            : undefined
                        }
                        onChange={(itemid: number | null) => {
                          if (!itemid) handleProductSelect(idx, null);
                        }}
                        onChangeAdditional={(data: any) => {
                          if (data) handleProductSelect(idx, data);
                          else handleProductSelect(idx, null);
                        }}
                        disableField={!!rule.categoryid}
                        className=""
                      />
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <select
                        className="form-select form-select-sm"
                        value={rule.categoryid ?? ""}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          updateRule(idx, "categoryid", val);
                          // Clear item when category is selected
                          if (val) {
                            setRules(prev => prev.map((r, i) =>
                              i === idx ? { ...r, categoryid: val, itemid: null, itemcode: null, itemname: null } : r
                            ));
                          } else {
                            updateRule(idx, "categoryid", null);
                          }
                        }}
                        disabled={!!rule.itemid}
                      >
                        <option value="">— Any —</option>
                        {categories.map(c => <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <input type="number" className="form-control form-control-sm" value={rule.pricerangemin ?? ""} min={0} step="0.01"
                        onChange={e => updateRule(idx, "pricerangemin", e.target.value === "" ? null : Number(e.target.value))} placeholder="0" />
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <input type="number" className="form-control form-control-sm" value={rule.pricerangemax ?? ""} min={0} step="0.01"
                        onChange={e => updateRule(idx, "pricerangemax", e.target.value === "" ? null : Number(e.target.value))} placeholder="0" />
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <input type="number" className="form-control form-control-sm" value={rule.requiredquantity ?? ""} min={0} step="0.01"
                        onChange={e => updateRule(idx, "requiredquantity", e.target.value === "" ? null : Number(e.target.value))} placeholder="0" />
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <input type="number" className="form-control form-control-sm" value={rule.discountamount ?? 0} min={0} step="0.01"
                        onChange={e => updateRule(idx, "discountamount", Number(e.target.value))} />
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      <select className="form-select form-select-sm" value={rule.discounttype} onChange={e => updateRule(idx, "discounttype", e.target.value)}>
                        <option value="percent">% off</option>
                        <option value="amount">$ off</option>
                      </select>
                    </td>
                    <td style={{ padding: "4px 6px", verticalAlign: "middle" }}>
                      <button type="button" className="btn btn-sm btn-outline-danger" style={{ padding: "2px 7px" }} onClick={() => removeRule(idx)}>
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addRule}>
            <PlusCircle size={12} style={{ marginRight: 5 }} />Add Rule
          </button>
          </>)}
        </div>
      </div>

      {/* Footer */}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>Cancel</button>
        <ButtonLoader loading={saving} btnText={isEdit ? "Update Promotion" : "Create Promotion"} loadingText="Saving..." onClick={handleSave} />
      </div>
    </div>
  );
};

export default PromotionForm;
