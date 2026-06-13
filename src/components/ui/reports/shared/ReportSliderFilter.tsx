"use client";

import React from "react";
import { Slider } from "antd";

interface Props {
  label: string;
  min: number;
  max: number;
  step?: number | null;
  marks?: Record<number, string>;
  value: [number, number] | number;
  onChange: (v: [number, number] | number) => void;
  range?: boolean;
  formatter?: (v: number) => string;
  color?: string;
}

export default function ReportSliderFilter({
  label,
  min,
  max,
  step = 1,
  marks,
  value,
  onChange,
  range = false,
  formatter,
  color = "#6366f1",
}: Props) {
  const displayValue = range && Array.isArray(value)
    ? formatter ? `${formatter(value[0])} – ${formatter(value[1])}` : `${value[0]} – ${value[1]}`
    : !range && typeof value === "number" && value > min
      ? formatter ? `≥ ${formatter(value as number)}` : `≥ ${value}`
      : null;

  return (
    <div
      style={{
        borderBottom: "1px solid #f1f5f9",
        padding: "6px 16px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#64748b",
          letterSpacing: "0.4px",
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {label}
        {displayValue && (
          <span style={{ fontWeight: 400, color: color, fontSize: 11 }}>
            {displayValue}
          </span>
        )}
      </div>
      <div style={{ paddingLeft: 6, paddingRight: 6 }}>
        <Slider
          range={range}
          min={min}
          max={max}
          step={step}
          marks={marks}
          value={value as any}
          onChange={onChange as any}
          tooltip={{
            formatter: formatter ? (v?: number) => (v !== undefined ? formatter(v) : "") : undefined,
          }}
          styles={{
            track: { backgroundColor: color },
            rail: { backgroundColor: "#e2e8f0" },
          }}
          style={{ marginBottom: marks ? 16 : 4 }}
        />
      </div>
    </div>
  );
}
