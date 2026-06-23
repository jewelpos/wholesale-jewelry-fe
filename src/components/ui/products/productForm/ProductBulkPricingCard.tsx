"use client";

import React from "react";
import { Trash2, PlusCircle } from "lucide-react";
import { BulkDiscountTierRow } from "@/types/promotion";

interface Props {
  tiers: BulkDiscountTierRow[];
  onChange: (tiers: BulkDiscountTierRow[]) => void;
  disabled?: boolean;
}

const emptyTier = (): BulkDiscountTierRow => ({
  minquantity: "",
  maxquantity: "",
  discountamount: "",
  discounttype: "percent",
});

const ProductBulkPricingCard: React.FC<Props> = ({ tiers, onChange, disabled = false }) => {
  const update = (idx: number, field: keyof BulkDiscountTierRow, value: any) => {
    const next = tiers.map((t, i) => (i === idx ? { ...t, [field]: value } : t));
    onChange(next);
  };

  const addRow = () => onChange([...tiers, emptyTier()]);

  const removeRow = (idx: number) => onChange(tiers.filter((_, i) => i !== idx));

  return (
    <div className="card table-list-card">
      <div className="card-body">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-1">Bulk Pricing Tiers</h4>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Set quantity-based discounts for this product. Customers buying more
              units automatically receive the matching tier discount.
            </p>
          </div>
          <div className="col-md-7">
            {tiers.length === 0 ? (
              <div
                style={{
                  border: "2px dashed #e2e8f0",
                  borderRadius: 8,
                  padding: "20px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                No tiers defined — all customers pay the standard sell price.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-sm" style={{ fontSize: 12, marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Qty from</th>
                      <th style={{ fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Qty to (0=∞)</th>
                      <th style={{ fontWeight: 600, color: "#475569" }}>Discount</th>
                      <th style={{ fontWeight: 600, color: "#475569" }}>Type</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "4px 6px" }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={tier.minquantity}
                            min={0}
                            onChange={e => update(idx, "minquantity", e.target.value)}
                            disabled={disabled}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td style={{ padding: "4px 6px" }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={tier.maxquantity}
                            min={0}
                            onChange={e => update(idx, "maxquantity", e.target.value)}
                            disabled={disabled}
                            style={{ width: 80 }}
                            placeholder="0=∞"
                          />
                        </td>
                        <td style={{ padding: "4px 6px" }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={tier.discountamount}
                            min={0}
                            step="0.01"
                            onChange={e => update(idx, "discountamount", e.target.value)}
                            disabled={disabled}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td style={{ padding: "4px 6px" }}>
                          <select
                            className="form-select form-select-sm"
                            value={tier.discounttype}
                            onChange={e => update(idx, "discounttype", e.target.value)}
                            disabled={disabled}
                            style={{ width: 90 }}
                          >
                            <option value="percent">% off</option>
                            <option value="amount">$ off</option>
                          </select>
                        </td>
                        <td style={{ padding: "4px 6px", verticalAlign: "middle" }}>
                          {!disabled && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeRow(idx)}
                              style={{ padding: "2px 7px" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!disabled && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addRow}
              >
                <PlusCircle size={13} style={{ marginRight: 5 }} />
                Add Tier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBulkPricingCard;
