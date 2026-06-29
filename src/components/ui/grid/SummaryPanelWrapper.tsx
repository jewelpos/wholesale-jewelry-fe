"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "react-feather";

interface Props {
  isCollapsed: boolean;
  onToggle: () => void;
  title?: string;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
}

const SummaryPanelWrapper: React.FC<Props> = ({
  isCollapsed,
  onToggle,
  title = "Daily Summary",
  titleRight,
  children,
}) => {
  return (
    <div className="mb-2">
      <div className="d-flex align-items-center justify-content-between mb-1 px-1">
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {isCollapsed ? title : ""}
        </span>
        <div className="d-flex align-items-center gap-2">
          {!isCollapsed && titleRight}
        <button
          type="button"
          onClick={onToggle}
          style={{
            background: "none",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 11,
            color: "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            lineHeight: 1.6,
          }}
        >
          {isCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          {isCollapsed ? "Show Summary" : "Hide Summary"}
        </button>
        </div>
      </div>
      {!isCollapsed && children}
    </div>
  );
};

export default SummaryPanelWrapper;
