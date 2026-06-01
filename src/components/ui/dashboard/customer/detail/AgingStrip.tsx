"use client";

import React from "react";

type Aging = {
  due_0_30: number | null;
  due_31_60: number | null;
  due_61_90: number | null;
  due_91_120: number | null;
  due_120_plus: number | null;
  total_due: number | null;
};

type Props = {
  aging: Aging | undefined | null;
  loading: boolean;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: number | null | undefined) => Number(v ?? 0);

const BUCKET_COLORS = [
  "#22c55e",
  "#84cc16",
  "#facc15",
  "#f97316",
  "#ef4444",
];

const AgingStrip = ({ aging, loading }: Props) => {
  const buckets = [
    { label: "0–30", value: num(aging?.due_0_30), color: BUCKET_COLORS[0] },
    { label: "31–60", value: num(aging?.due_31_60), color: BUCKET_COLORS[1] },
    { label: "61–90", value: num(aging?.due_61_90), color: BUCKET_COLORS[2] },
    { label: "91–120", value: num(aging?.due_91_120), color: BUCKET_COLORS[3] },
    { label: "120+", value: num(aging?.due_120_plus), color: BUCKET_COLORS[4] },
  ];
  const total = buckets.reduce((s, b) => s + b.value, 0);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">A/R Aging</h6>
          <div className="text-muted small">
            Total outstanding{" "}
            <span className="fw-semibold text-dark">
              {loading && !aging ? "—" : formatCurrency(total)}
            </span>
          </div>
        </div>

        {total > 0 && (
          <div
            className="d-flex rounded overflow-hidden mb-2"
            style={{ height: 12 }}
          >
            {buckets.map((b) =>
              b.value > 0 ? (
                <div
                  key={b.label}
                  style={{
                    width: `${(b.value / total) * 100}%`,
                    backgroundColor: b.color,
                  }}
                  title={`${b.label} days: ${formatCurrency(b.value)}`}
                />
              ) : null
            )}
          </div>
        )}

        <div className="row g-2 mt-2">
          {buckets.map((b) => (
            <div className="col-6 col-md" key={b.label}>
              <div className="d-flex align-items-center gap-2 small">
                <span
                  className="d-inline-block rounded-circle flex-shrink-0"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: b.color,
                  }}
                />
                <div className="d-flex flex-column">
                  <span className="text-muted">{b.label} days</span>
                  <span className="fw-semibold">{formatCurrency(b.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && total === 0 && (
          <div className="text-muted small text-center mt-2 mb-0">
            No outstanding balance.
          </div>
        )}
      </div>
    </div>
  );
};

export default AgingStrip;
