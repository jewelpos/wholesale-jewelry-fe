"use client";

import React, { useState } from "react";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { ProductFormType } from "@/types/product";
import { ChevronDown, ChevronUp } from "react-feather";

interface ProductStoneDetailsTabProps {
  register: UseFormRegister<ProductFormType>;
  errors: FieldErrors<ProductFormType>;
  control: Control<ProductFormType>;
  trigger: UseFormTrigger<ProductFormType>;
  setValue: UseFormSetValue<ProductFormType>;
  disableField?: boolean;
}

/* ── helpers ─────────────────────────────────────────── */

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
    {children}
  </label>
);

const SubSection = ({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="mb-3 pb-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
    <div
      className="d-flex align-items-center gap-2 mb-3"
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {title}
    </div>
    <div className="row g-2">{children}</div>
  </div>
);

const TextField = ({
  label,
  field,
  register,
}: {
  label: string;
  field: keyof ProductFormType;
  register: UseFormRegister<ProductFormType>;
}) => (
  <div className="col-lg-3 col-md-4 col-6">
    <Label>{label}</Label>
    <input
      type="text"
      className="form-control form-control-sm"
      {...register(field as any)}
    />
  </div>
);

const NumberField = ({
  label,
  field,
  register,
}: {
  label: string;
  field: keyof ProductFormType;
  register: UseFormRegister<ProductFormType>;
}) => (
  <div className="col-lg-3 col-md-4 col-6">
    <Label>{label}</Label>
    <input
      type="number"
      step="0.01"
      className="form-control form-control-sm"
      {...(register as any)(field, { valueAsNumber: true })}
    />
  </div>
);

const CurrencyField = ({
  label,
  field,
  register,
}: {
  label: string;
  field: keyof ProductFormType;
  register: UseFormRegister<ProductFormType>;
}) => (
  <div className="col-lg-3 col-md-4 col-6">
    <Label>{label}</Label>
    <div className="input-group input-group-sm">
      <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 12 }}>$</span>
      <input
        type="number"
        step="0.01"
        className="form-control"
        {...(register as any)(field, { valueAsNumber: true })}
      />
    </div>
  </div>
);

/* ── component ───────────────────────────────────────── */

const ProductStoneDetailsTab: React.FC<ProductStoneDetailsTabProps> = ({
  register,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="card mb-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e8ecf0" }}
    >
      {/* Collapsible header — div so fieldset:disabled doesn't block it */}
      <div
        role="button"
        className="card-header d-flex align-items-center justify-content-between py-2 px-3"
        style={{
          cursor: "pointer",
          background: open ? "#fdf4ff" : "#f8f9ff",
          borderLeft: "3px solid #a855f7",
          userSelect: "none",
        }}
        onClick={() => setOpen(v => !v)}
      >
        <div className="d-flex align-items-center gap-2">
          {/* Diamond SVG icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 9 18 21 6 21 2 9 12 2" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 12, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Stone Details
          </span>
          <span
            style={{
              fontSize: 10,
              background: "#f3e8ff",
              color: "#7c3aed",
              padding: "2px 8px",
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Optional
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
      </div>

      {open && (
        <div className="card-body py-3">

          {/* ── Sub-section 1: Identification ── */}
          <SubSection title="Identification" color="#6366f1">
            <TextField label="Laboratory"    field="dlab"     register={register} />
            <TextField label="Certificate #" field="dcerno"   register={register} />
            <TextField label="Stock #"       field="dstockno" register={register} />
            <TextField label="Shape"         field="dshape"   register={register} />
            <TextField label="Color"         field="dcolor"   register={register} />
            <TextField label="Clarity"       field="dclarity" register={register} />
            <TextField label="Quality"       field="dquality" register={register} />
            <TextField label="Size Ref"      field="dsize"    register={register} />
          </SubSection>

          {/* ── Sub-section 2: Physical Properties ── */}
          <SubSection title="Physical Properties" color="#059669">
            <NumberField label="Carat Weight"     field="dcarat"          register={register} />
            <TextField  label="Diameter"          field="ddiameter"       register={register} />
            <TextField  label="Measurement LxWxD" field="dmesurement"     register={register} />
            <NumberField label="Depth %"          field="ddepth"          register={register} />
            <NumberField label="Table %"          field="dtable"          register={register} />
            <TextField  label="Girdle"            field="dgirdle"         register={register} />
            <TextField  label="Culet"             field="dculut"          register={register} />
            <TextField  label="Polish"            field="dpolish"         register={register} />
            <TextField  label="Symmetry"          field="dsymmetry"       register={register} />
            <TextField  label="Fluorescence"      field="dflorence"       register={register} />
            <TextField  label="Polarity"          field="dpolarity"       register={register} />
            <NumberField label="Crown Height"     field="dcrownheight"    register={register} />
            <NumberField label="Crown Angle"      field="dcrownangle"     register={register} />
            <NumberField label="Pavilion Height"  field="dpavillionheight" register={register} />
            <NumberField label="Pavilion Depth"   field="dpavillionangle" register={register} />
          </SubSection>

          {/* ── Sub-section 3: Pricing ── */}
          <SubSection title="Stone Pricing" color="#f59e0b">
            <CurrencyField label="Rapaport Price"     field="drapprice"  register={register} />
            <CurrencyField label="Cost per Carat"     field="dcost"      register={register} />
            <CurrencyField label="Sell Price per Carat" field="dsaleprice" register={register} />
            <div className="col-lg-3 col-md-4 col-6">
              <Label>Price Code</Label>
              <input type="text" className="form-control form-control-sm" {...register("dpricecode")} />
            </div>
          </SubSection>

        </div>
      )}
    </div>
  );
};

export default ProductStoneDetailsTab;
