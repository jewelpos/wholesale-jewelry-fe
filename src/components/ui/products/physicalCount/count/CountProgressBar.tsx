"use client";

import React from "react";

interface Props {
  counted: number;
  total: number;
}

const CountProgressBar = ({ counted, total }: Props) => {
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
  const color = pct === 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#6366f1";

  return (
    <div style={{ minWidth: 180 }}>
      <div className="d-flex justify-content-between mb-1" style={{ fontSize: 11, color: "#64748b" }}>
        <span>{counted} of {total} counted</span>
        <span style={{ fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, transition: "width 0.3s" }} />
      </div>
    </div>
  );
};

export default CountProgressBar;
