"use client";

import React, { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  useWatch,
} from "react-hook-form";
import { useQuery } from "@apollo/client";
import { GET_METAL_TYPE_LIST_QUERY } from "@/lib/graphql/query/metalType";
import { GET_CURRENT_METAL_RATES_QUERY } from "@/lib/graphql/query/metalRates";
import { ProductFormType } from "@/types/product";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectItemCategory from "@/components/forms/SelectItemCategory";
import SelectSubCategory from "@/components/forms/SelectSubCategory";
import SelectMetalType from "@/components/forms/SelectMetalType";
import ProductImageUpload from "@/components/ui/products/ProductImageUpload";
import useWarehouse from "@/hooks/useWarehouse";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  DollarSign,
  FileText,
  Layers,
  Package,
  Tag,
  TrendingUp,
} from "react-feather";

/* ── helpers ───────────────────────────────────────────── */

const KARAT_RATE_FIELD: Record<string, string> = {
  "10Kt": "gold10kt_gram",
  "14Kt": "gold14kt_gram",
  "18Kt": "gold18kt_gram",
  "22Kt": "gold22kt_gram",
};

const ACCENT_MAP = {
  indigo: "#6366f1",
  green:  "#059669",
  amber:  "#f59e0b",
  violet: "#8b5cf6",
} as const;

type AccentKey = keyof typeof ACCENT_MAP;

const SectionCard = ({
  icon: Icon,
  title,
  accent = "indigo",
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  accent?: AccentKey;
  children: React.ReactNode;
}) => {
  const color = ACCENT_MAP[accent];
  return (
    <div
      className="card mb-3"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e8ecf0" }}
    >
      <div
        className="card-header d-flex align-items-center gap-2 py-2"
        style={{ background: "#f8f9ff", borderLeft: `3px solid ${color}`, borderBottom: "1px solid #f1f5f9" }}
      >
        <Icon size={14} color={color} />
        <span style={{ fontWeight: 700, fontSize: 12, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
      </div>
      <div className="card-body py-3">{children}</div>
    </div>
  );
};

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
    {children}{required && <span className="text-danger ms-1">*</span>}
  </label>
);

const FieldWrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-2 ${className}`}>{children}</div>
);

/* ── component ─────────────────────────────────────────── */

export interface ProductInformationTabProps {
  register: UseFormRegister<ProductFormType>;
  errors: FieldErrors<ProductFormType>;
  control: Control<ProductFormType>;
  trigger: UseFormTrigger<ProductFormType>;
  setValue: UseFormSetValue<ProductFormType>;
  disableField?: boolean;
  storeId: number;
  productImages: File[];
  onImagesChange: (images: File[]) => void;
  isEdit?: boolean;
  barcodeId?: string;
  marginAmount?: number;
}

const ProductInformationTab: React.FC<ProductInformationTabProps> = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  disableField = false,
  storeId,
  productImages,
  onImagesChange,
  isEdit,
  barcodeId,
  marginAmount = 0,
}) => {
  const { outletId } = useParams();
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const warehouse = warehouses.find(w => w.issystem);

  const itemStatus        = useWatch({ control, name: "itemstatus" });
  const itemAlert         = useWatch({ control, name: "itemalertwarning" });
  const profitpercent     = useWatch({ control, name: "profitpercent" });
  const itemmetal         = useWatch({ control, name: "itemmetal" });
  const itempremium       = useWatch({ control, name: "itempremium" });
  const broakerage        = useWatch({ control, name: "broakerage" });
  const itemunit          = useWatch({ control, name: "itemunit" });

  const { data: metalTypeData } = useQuery(GET_METAL_TYPE_LIST_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const { data: metalRatesData } = useQuery(GET_CURRENT_METAL_RATES_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });
  const currentRates = metalRatesData?.getCurrentMetalRates ?? null;

  // Auto-fill Metal % from the selected metal type's default percent
  useEffect(() => {
    if (!itemmetal || !metalTypeData?.getMetalTypeList) return;
    const match = metalTypeData.getMetalTypeList.find((m: any) => m.metalname === itemmetal);
    if (match?.metalpercent != null) {
      setValue("itemmetalpercent", String(match.metalpercent));
    }
  }, [itemmetal, metalTypeData, setValue]);

  // Auto-calculate sell price for Wt items when metal type, rates, premium or making charges change
  useEffect(() => {
    if ((itemunit ?? "").trim().toLowerCase() !== "wt") return;
    if (!itemmetal || !currentRates) return;
    const rateField = KARAT_RATE_FIELD[itemmetal];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goldRate = rateField ? Number((currentRates as any)[rateField] ?? 0) : 0;
    if (goldRate <= 0) return;
    const premium = Number(itempremium || 0);
    const labour  = Number(broakerage || 0);
    setValue("itemsellprice", Math.round((goldRate + premium + labour) * 100) / 100);
  }, [itemmetal, currentRates, itempremium, broakerage, itemunit, setValue]);

  useEffect(() => {
    if (outletId) fetchWarehouseByOutletId(Number(outletId));
  }, [fetchWarehouseByOutletId, outletId]);

  useEffect(() => {
    if (warehouse) setValue("itemwarehouseid", warehouse.warehouseid);
  }, [warehouse, setValue]);

  const statusStyle =
    itemStatus === "Active"
      ? { bg: "#dcfce7", text: "#166534", border: "#86efac" }
      : { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };

  return (
    <div>
      {/* ════════════════════════════════════════════════════
          CARD 1 — PRODUCT IDENTITY
      ════════════════════════════════════════════════════ */}
      <SectionCard icon={Tag} title="Product Identity" accent="indigo">
        <div className="row g-3">

          {/* ── Image only ── */}
          <div className="col-lg-3 col-md-12">
            <ProductImageUpload
              images={productImages}
              onChange={onImagesChange}
              maxImages={1}
              disabled={disableField}
            />
            {/* hidden warehouse id for form submission */}
            <input type="hidden" {...register("itemwarehouseid", { required: "Warehouse is required" })} />
          </div>

          {/* ── Identity fields ── */}
          <div className="col-lg-9 col-md-12">

            {/* Row 1: Barcode ID · Item Code · Description · Status */}
            <div className="row g-2">
              <div className="col-lg-3 col-md-6">
                <FieldWrap>
                  <Label>Barcode ID</Label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={barcodeId || ""}
                    disabled
                    readOnly
                    style={{ fontFamily: "monospace", background: "#f8fafc", color: "#64748b" }}
                  />
                </FieldWrap>
              </div>
              <div className="col-lg-3 col-md-6">
                <FieldWrap>
                  <Label required>Item Code</Label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${errors.itemcode ? "is-invalid" : ""}`}
                    {...register("itemcode", { required: "Item code is required" })}
                    disabled={isEdit}
                  />
                  {errors.itemcode && <div className="invalid-feedback">{errors.itemcode.message}</div>}
                </FieldWrap>
              </div>
              <div className="col-lg-3 col-md-6">
                <FieldWrap>
                  <Label required>Description</Label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${errors.itemdescription ? "is-invalid" : ""}`}
                    {...register("itemdescription", { required: "Item description is required" })}
                  />
                  {errors.itemdescription && <div className="invalid-feedback">{errors.itemdescription.message}</div>}
                </FieldWrap>
              </div>
              <div className="col-lg-3 col-md-6">
                <FieldWrap>
                  <Label required>Status</Label>
                  {disableField ? (
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "4px 14px",
                          borderRadius: 20,
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        {itemStatus || "Active"}
                      </span>
                    </div>
                  ) : (
                    <Controller
                      name="itemstatus"
                      control={control}
                      rules={{ required: "Status is required" }}
                      render={({ field }) => (
                        <div className="d-flex gap-2">
                          {(["Active", "Inactive"] as const).map(s => {
                            const active = field.value === s;
                            const sStyle =
                              s === "Active"
                                ? { bg: "#dcfce7", text: "#166534", border: "#86efac" }
                                : { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };
                            return (
                              <button
                                key={s}
                                type="button"
                                className="btn"
                                onClick={() => field.onChange(s)}
                                style={{
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "4px 16px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  lineHeight: "1.4",
                                  background: active ? sStyle.bg : "transparent",
                                  color: active ? sStyle.text : "#94a3b8",
                                  border: `1.5px solid ${active ? sStyle.border : "#e2e8f0"}`,
                                  transition: "all 0.15s",
                                  boxShadow: "none",
                                }}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  )}
                  {errors.itemstatus && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{errors.itemstatus.message}</div>}
                </FieldWrap>
              </div>
            </div>

            {/* Row 2: Department · Product Line */}
            <div className="row g-2">
              <div className="col-lg-6 col-md-6">
                <FieldWrap>
                  <Label required>Department</Label>
                  <Controller
                    name="itemcategoryid"
                    control={control}
                    rules={{ required: "Department is required", validate: v => v === 0 ? "Department is required" : true }}
                    render={({ field }) => (
                      <SelectItemCategory
                        className={errors.itemcategoryid ? "is-invalid" : ""}
                        trigger={trigger}
                        storeId={storeId}
                        disableField={disableField}
                        {...field}
                      />
                    )}
                  />
                  {errors.itemcategoryid && <div className="invalid-feedback d-block">{errors.itemcategoryid.message}</div>}
                </FieldWrap>
              </div>
              <div className="col-lg-6 col-md-6">
                <FieldWrap>
                  <Label required>Product Line</Label>
                  <Controller
                    name="subcategoryid"
                    control={control}
                    rules={{ required: "Product line is required", validate: v => v === 0 ? "Product line is required" : true }}
                    render={({ field }) => (
                      <SelectSubCategory
                        className={errors.subcategoryid ? "is-invalid" : ""}
                        trigger={trigger}
                        storeId={storeId}
                        disableField={disableField}
                        {...field}
                      />
                    )}
                  />
                  {errors.subcategoryid && <div className="invalid-feedback d-block">{errors.subcategoryid.message}</div>}
                </FieldWrap>
              </div>
            </div>

            {/* Row 3: Supplier · Style # · UPC # */}
            <div className="row g-2">
              <div className="col-lg-4 col-md-6">
                <FieldWrap>
                  <Label required>Supplier</Label>
                  <Controller
                    name="supplierid"
                    control={control}
                    rules={{ required: "Supplier is required", validate: v => v === 0 ? "Supplier is required" : true }}
                    render={({ field }) => (
                      <SelectSupplier
                        className={errors.supplierid ? "is-invalid" : ""}
                        trigger={trigger}
                        storeId={storeId}
                        disableField={disableField}
                        {...field}
                      />
                    )}
                  />
                  {errors.supplierid && <div className="invalid-feedback d-block">{errors.supplierid.message}</div>}
                </FieldWrap>
              </div>
              <div className="col-lg-4 col-md-6">
                <FieldWrap>
                  <Label>Supplier Style #</Label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    {...register("supplieritemcode")}
                  />
                </FieldWrap>
              </div>
              <div className="col-lg-4 col-md-6">
                <FieldWrap>
                  <Label>Supplier UPC #</Label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    {...register("supplierbarcodeid")}
                  />
                </FieldWrap>
              </div>
            </div>

          </div>
        </div>
      </SectionCard>

      {/* ════════════════════════════════════════════════════
          CARD 2 — METAL & MAKING CHARGES
      ════════════════════════════════════════════════════ */}
      <SectionCard icon={Layers} title="Metal & Making Charges" accent="violet">
        <div className="row g-2">
          <div className="col-lg-3 col-md-6">
            <FieldWrap>
              <Label>Metal Type</Label>
              <Controller
                name="itemmetal"
                control={control}
                render={({ field }) => (
                  <SelectMetalType
                    className={errors.itemmetal ? "is-invalid" : ""}
                    trigger={trigger}
                    storeId={storeId}
                    disableField={disableField}
                    {...field}
                  />
                )}
              />
            </FieldWrap>
          </div>
          <div className="col-lg-2 col-md-6">
            <FieldWrap>
              <Label>Metal %</Label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  {...register("itemmetalpercent")}
                />
                <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 13 }}>%</span>
              </div>
            </FieldWrap>
          </div>
          <div className="col-lg-2 col-md-6">
            <FieldWrap>
              <Label>Item Premium</Label>
              <input
                type="text"
                className="form-control form-control-sm"
                {...register("itempremium")}
              />
            </FieldWrap>
          </div>
          <div className="col-lg-2 col-md-6">
            <FieldWrap>
              <Label>Making Charges</Label>
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 13 }}>$</span>
                <input
                  type="text"
                  className="form-control"
                  {...register("broakerage")}
                />
              </div>
            </FieldWrap>
          </div>
        </div>
      </SectionCard>

      {/* ════════════════════════════════════════════════════
          CARD 3 — PRICING & MARGINS
      ════════════════════════════════════════════════════ */}
      <SectionCard icon={DollarSign} title="Pricing & Margins" accent="green">

        {/* Row 1: Cost → Profit % → Sell Price */}
        <div className="d-flex align-items-end gap-2 mb-2 flex-wrap">

          {/* Unit Cost */}
          <div style={{ flex: "1 1 140px", minWidth: 120 }}>
            <Label required>Unit Cost</Label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 13 }}>$</span>
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.itempurchaseprice ? "is-invalid" : ""}`}
                {...register("itempurchaseprice", { required: "Unit cost is required", valueAsNumber: true })}
              />
            </div>
            {errors.itempurchaseprice && (
              <div className="text-danger mt-1" style={{ fontSize: 11 }}>{errors.itempurchaseprice.message}</div>
            )}
          </div>

          <div className="d-none d-md-flex align-items-center" style={{ paddingBottom: 6 }}>
            <ChevronRight size={16} color="#94a3b8" />
          </div>

          {/* Profit % */}
          <div style={{ flex: "1 1 120px", minWidth: 100 }}>
            <Label>Profit %</Label>
            <div className="input-group input-group-sm">
              <input
                type="number"
                step="0.01"
                className="form-control"
                {...register("profitpercent", { valueAsNumber: true })}
              />
              <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 13 }}>%</span>
            </div>
          </div>

          <div className="d-none d-md-flex align-items-center" style={{ paddingBottom: 6 }}>
            <ChevronRight size={16} color="#94a3b8" />
          </div>

          {/* Sell Price (auto) */}
          <div style={{ flex: "1 1 150px", minWidth: 130 }}>
            <Label>
              Sell Price{" "}
              <span style={{ fontSize: 10, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginLeft: 4 }}>
                AUTO
              </span>
            </Label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ background: "#f0fdf4", fontSize: 13 }}>$</span>
              <input
                type="number"
                step="0.01"
                className="form-control"
                style={{ background: "#f0fdf4" }}
                {...register("itemsellprice", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Live margin badge */}
          {marginAmount > 0 && (
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 rounded"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", whiteSpace: "nowrap", marginBottom: 0 }}
            >
              <TrendingUp size={13} color="#166534" />
              <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                Margin ${marginAmount.toFixed(2)} &nbsp;·&nbsp; {profitpercent}%
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Tag Price · Price Code · Item Discount */}
        <div className="row g-2">
          <div className="col-lg-3 col-md-6">
            <Label>
              Tag Price{" "}
              <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginLeft: 4 }}>
                AUTO
              </span>
            </Label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ background: "#f0f9ff", fontSize: 13 }}>$</span>
              <input
                type="number"
                step="0.01"
                className="form-control"
                style={{ background: "#f0f9ff" }}
                {...register("itemtagprice", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Price Code</Label>
            <input
              type="text"
              className="form-control form-control-sm"
              {...register("itemtagpricecode")}
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Item Discount</Label>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ fontSize: 13 }}>$</span>
              <input
                type="number"
                step="0.01"
                className="form-control"
                {...register("itemdiscount", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ════════════════════════════════════════════════════
          CARD 3 — INVENTORY & SETTINGS
      ════════════════════════════════════════════════════ */}
      <SectionCard icon={Package} title="Inventory & Settings" accent="amber">

        {/* Detail fields */}
        <div className="row g-2 mb-3">
          <div className="col-lg-3 col-md-6">
            <Label>Warehouse</Label>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 6,
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              {warehouse?.warehousename || "—"}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Model #</Label>
            <input type="text" className="form-control form-control-sm" {...register("modelno")} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Manufacturer</Label>
            <input type="text" className="form-control form-control-sm" {...register("manufacturer")} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Item Location</Label>
            <input type="text" className="form-control form-control-sm" {...register("itemlocation")} />
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-lg-3 col-md-6">
            <Label>Reorder Point</Label>
            <input
              type="number"
              className="form-control form-control-sm"
              {...register("itemreorderqtypnt", { valueAsNumber: true })}
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <Label>Order Quantity</Label>
            <input
              type="number"
              className="form-control form-control-sm"
              {...register("itemreorderqty", { valueAsNumber: true })}
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <Label required>Item Unit</Label>
            <Controller
              name="itemunit"
              control={control}
              rules={{ required: "Item unit is required" }}
              render={({ field }) => (
                <div className="d-flex gap-2">
                  {([
                    { value: "Pc", label: "Pc — Piece", tooltip: "Sold by pieces (counted as individual units)" },
                    { value: "Wt", label: "Wt — Weight", tooltip: "Sold by weight (quantity entered in grams, oz, etc.)" },
                  ] as const).map(opt => {
                    const active = field.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className="btn"
                        title={opt.tooltip}
                        onClick={() => field.onChange(opt.value)}
                        style={{
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          lineHeight: "1.4",
                          background: active ? "#dbeafe" : "transparent",
                          color: active ? "#1e40af" : "#94a3b8",
                          border: `1.5px solid ${active ? "#93c5fd" : "#e2e8f0"}`,
                          transition: "all 0.15s",
                          boxShadow: "none",
                        }}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.itemunit && (
              <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                {errors.itemunit.message}
              </div>
            )}
          </div>
        </div>

        {/* Toggle switches */}
        <div className="row g-2">
          {[
            { id: "itemtaxable",    field: "itemtaxable"    as const, label: "Item Taxable"    },
            { id: "trackinventory", field: "trackinventory" as const, label: "Track Inventory" },
            { id: "itemalert",      field: "itemalertwarning" as const, label: "Item Alert"    },
          ].map(({ id, field, label }) => (
            <div className="col-lg-4 col-md-6" key={id}>
              <div
                className="d-flex align-items-center gap-2 p-3 rounded"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id={id}
                    style={{ width: 36, height: 20, cursor: "pointer" }}
                    {...register(field)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={id}
                    style={{ fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer", marginLeft: 8 }}
                  >
                    {label}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conditional alert message */}
        {!!itemAlert && (
          <div className="row mt-2">
            <div className="col-lg-6 col-md-12">
              <Label>Alert Message</Label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Enter alert message..."
                {...register("itemwarningmessage")}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ════════════════════════════════════════════════════
          CARD 4 — NOTES & DESCRIPTION
      ════════════════════════════════════════════════════ */}
      <SectionCard icon={FileText} title="Notes & Description" accent="violet">
        <div className="row g-3">
          <div className="col-lg-6 col-md-12">
            <Label>Notes</Label>
            <textarea
              className="form-control"
              rows={4}
              style={{ fontSize: 13, resize: "vertical" }}
              placeholder="Internal notes about this product..."
              {...register("itemremarks")}
            />
          </div>
          <div className="col-lg-6 col-md-12">
            <Label>Detail Description</Label>
            <textarea
              className="form-control"
              rows={4}
              style={{ fontSize: 13, resize: "vertical" }}
              placeholder="Detailed product description for listings..."
              {...register("detaileditemdescription")}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default ProductInformationTab;
