"use client";

import { SupplierInvoiceFormType, SupplierType } from "@/types/supplier";
import React, { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";
import useWarehouse from "@/hooks/useWarehouse";
import { useParams } from "next/navigation";
import { DatePicker } from "antd";
import dayjs from "dayjs";

interface Props {
  register: UseFormRegister<SupplierInvoiceFormType>;
  errors: FieldErrors<SupplierInvoiceFormType>;
  control: Control<SupplierInvoiceFormType>;
  trigger: UseFormTrigger<SupplierInvoiceFormType>;
  storeId: number;
  warehouseId: string;
  disableField?: boolean;
  supplier?: SupplierType | null;
  supplierLoading: boolean;
  savedAmount?: number;
  setValue: UseFormSetValue<SupplierInvoiceFormType>;
  amountPaid?: number | null;
  amountBalance?: number | null;
  enteredBy?: string | null;
  lastModified?: string | null;
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (val: string | null | undefined) => {
  if (!val) return "—";
  const n = Number(val);
  if (!isNaN(n) && n > 1_000_000_000) return dayjs(n).format("MM/DD/YYYY");
  return dayjs(val).isValid() ? dayjs(val).format("MM/DD/YYYY") : "—";
};

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#64748b",
  marginBottom: 5,
  display: "block",
};

const SECTION_HEADER: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#15803d",
  marginBottom: 14,
  paddingBottom: 8,
  borderBottom: "2px solid #dcfce7",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const SupplierInvoiceFormInputA = ({
  register,
  errors,
  control,
  trigger,
  storeId,
  disableField,
  supplier,
  supplierLoading,
  savedAmount = 0,
  setValue,
  amountPaid,
  amountBalance,
  enteredBy,
  lastModified,
}: Props) => {
  const { outletId } = useParams();
  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  const warehouse = warehouses.find((w) => w.issystem);

  useEffect(() => {
    if (outletId) fetchWarehouseByOutletId(Number(outletId));
  }, [fetchWarehouseByOutletId, outletId]);

  useEffect(() => {
    if (warehouse) setValue("warehouseid", warehouse.warehouseid.toString());
  }, [warehouse, setValue]);

  /* ── Payment status (edit/view only) ── */
  const isEdit = disableField && savedAmount > 0;
  const paid = amountPaid ?? 0;
  const balance = amountBalance ?? savedAmount;
  const payPct = savedAmount > 0 ? Math.min(100, Math.round((paid / savedAmount) * 100)) : 0;
  const statusCfg =
    balance <= 0 ? { label: "Fully Paid", color: "#15803d", bg: "#dcfce7" }
    : paid > 0   ? { label: "Partially Paid", color: "#b45309", bg: "#fef9c3" }
                 : { label: "Open / Unpaid", color: "#dc2626", bg: "#fee2e2" };

  /* ── Supplier detail pills ── */
  const supplierInfo = supplier ? [
    supplier.address1,
    [supplier.city, supplier.state, supplier.zipcode].filter(Boolean).join(", "),
    supplier.phone1 || supplier.cellphone,
    supplier.emailaddress,
  ].filter(Boolean) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — BILL FROM
          ══════════════════════════════════════════════════════════ */}
      <div className="card mb-0">
        <div className="card-body" style={{ padding: "18px 20px" }}>
          <div style={SECTION_HEADER}>
            <span style={{ width: 4, height: 14, background: "#15803d", borderRadius: 2, display: "inline-block" }} />
            Bill From
          </div>

          {/* Supplier dropdown */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Vendor / Supplier *</label>
            <Controller
              name="supplierid"
              control={control}
              rules={{ required: "Supplier is required" }}
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
            {errors.supplierid && (
              <div className="invalid-feedback d-block">{errors.supplierid.message}</div>
            )}
          </div>

          {/* Supplier info strip — appears after selection */}
          {supplierLoading && (
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 7, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 12 }}>
              Loading supplier details…
            </div>
          )}

          {!supplierLoading && supplier && (
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}>
              {/* Company name + contact */}
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#14532d", marginBottom: 2 }}>
                  {supplier.companyname}
                </div>
                {supplier.contactperson1 && (
                  <div style={{ fontSize: 11, color: "#16a34a" }}>
                    Contact: {supplier.contactperson1}
                  </div>
                )}
                {(supplier.supplierfname || supplier.supplierlname) && (
                  <div style={{ fontSize: 11, color: "#16a34a" }}>
                    {[supplier.supplierfname, supplier.supplierlname].filter(Boolean).join(" ")}
                  </div>
                )}
              </div>

              {/* Address */}
              {supplier.address1 && (
                <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.7 }}>
                  <div>{supplier.address1}</div>
                  {supplier.address2 && <div>{supplier.address2}</div>}
                  {[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).length > 0 && (
                    <div>{[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).join(", ")}</div>
                  )}
                </div>
              )}

              {/* Contact details */}
              <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.9 }}>
                {supplier.phone1 && <div>📞 {supplier.phone1}</div>}
                {supplier.cellphone && !supplier.phone1 && <div>📞 {supplier.cellphone}</div>}
                {supplier.emailaddress && <div>✉ {supplier.emailaddress}</div>}
              </div>

              {/* Account details */}
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {supplier.accountno && (
                  <div style={{ fontSize: 10, color: "#166534", fontWeight: 600 }}>
                    Acct: {supplier.accountno}
                  </div>
                )}
                {(supplier.discountrate ?? 0) > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#15803d", background: "#bbf7d0", padding: "2px 8px", borderRadius: 20 }}>
                    {supplier.discountrate}% Discount
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  color: supplier.supplierstatus === 1 ? "#15803d" : "#dc2626",
                  background: supplier.supplierstatus === 1 ? "#dcfce7" : "#fee2e2",
                }}>
                  {supplier.supplierstatus === 1 ? "● Active" : "● Inactive"}
                </span>
              </div>
            </div>
          )}

          {!supplierLoading && !supplier && (
            <div style={{
              padding: "12px 16px", background: "#f8fafc", borderRadius: 8,
              border: "1px dashed #cbd5e1", textAlign: "center",
              color: "#94a3b8", fontSize: 12,
            }}>
              Select a vendor above — their details will appear here
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — INVOICE DETAILS
          ══════════════════════════════════════════════════════════ */}
      <div className="card mb-0">
        <div className="card-body" style={{ padding: "18px 20px" }}>
          <div style={SECTION_HEADER}>
            <span style={{ width: 4, height: 14, background: "#15803d", borderRadius: 2, display: "inline-block" }} />
            Invoice Details
          </div>

          {/* Hidden warehouse */}
          <input type="hidden" {...register("warehouseid", { required: "Warehouse is required" })} />

          {/* Row 1: Invoice #, Date, Ref PO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px", marginBottom: 18 }}>
            <div>
              <label style={LABEL}>Vendor Invoice # *</label>
              <input
                type="text"
                placeholder="e.g. INV-2024-001"
                className={`form-control form-control-sm${errors.veninvoiceno ? " is-invalid" : ""}`}
                {...register("veninvoiceno", { required: "Vendor invoice number is required" })}
                disabled={disableField}
              />
              {errors.veninvoiceno && (
                <div className="invalid-feedback">{errors.veninvoiceno.message}</div>
              )}
            </div>

            <div>
              <label style={LABEL}>Invoice Date *</label>
              <Controller
                name="veninvoicedate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    format="MM/DD/YYYY"
                    allowClear={false}
                    disabled={disableField}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>

            <div>
              <label style={LABEL}>Ref PO # <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. PO-123"
                className="form-control form-control-sm"
                {...register("refponumber")}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: 18 }} />

          {/* Row 2: Amount, Terms, Warehouse */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
            <div>
              <label style={LABEL}>Invoice Amount *</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, fontWeight: 700, color: "#64748b", pointerEvents: "none",
                }}>$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  style={{ paddingLeft: 22 }}
                  className={`form-control form-control-sm${errors.veninvoicetotal ? " is-invalid" : ""}`}
                  {...register("veninvoicetotal", {
                    required: "Invoice amount is required",
                    validate: (value) =>
                      disableField && savedAmount && Number(value) < savedAmount
                        ? `Amount must be ≥ ${fmt(savedAmount)}`
                        : undefined,
                  })}
                />
              </div>
              {errors.veninvoicetotal && (
                <div className="invalid-feedback d-block">{errors.veninvoicetotal.message}</div>
              )}
            </div>

            <div>
              <label style={LABEL}>Payment Terms *</label>
              <Controller
                name="termsid"
                control={control}
                rules={{ required: "Payment terms is required" }}
                render={({ field }) => (
                  <SelectPaymentTerms
                    className={errors.termsid ? "is-invalid" : ""}
                    trigger={trigger}
                    storeId={storeId}
                    {...field}
                  />
                )}
              />
              {errors.termsid && (
                <div className="invalid-feedback d-block">{errors.termsid.message}</div>
              )}
            </div>

            <div>
              <label style={LABEL}>Receiving Warehouse</label>
              <div style={{
                height: 31, display: "flex", alignItems: "center",
                padding: "0 10px", background: "#f8fafc",
                border: "1px solid #e2e8f0", borderRadius: 5,
                fontSize: 13, color: "#475569", fontWeight: 500,
              }}>
                {warehouse?.warehousename || <span style={{ color: "#94a3b8" }}>—</span>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — PAYMENT STATUS (edit/view only)
          ══════════════════════════════════════════════════════════ */}
      {isEdit && (
        <div style={{
          borderRadius: 8,
          border: `1px solid ${statusCfg.color}40`,
          background: statusCfg.bg,
          padding: "12px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

            {/* Badge */}
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
              color: statusCfg.color, background: "#fff", border: `1px solid ${statusCfg.color}60`,
            }}>
              {statusCfg.label}
            </span>

            {/* Three stats */}
            {[
              { label: "Invoice Total", value: fmt(savedAmount), color: "#1e293b" },
              { label: "Paid", value: fmt(paid), color: "#15803d" },
              { label: "Balance Due", value: fmt(balance), color: balance > 0 ? "#dc2626" : "#15803d" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}

            {/* Progress bar */}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 4 }}>
                <span>Payment progress</span>
                <span style={{ fontWeight: 700 }}>{payPct}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.7)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${payPct}%`, height: "100%", borderRadius: 3,
                  background: balance <= 0 ? "#15803d" : paid > 0 ? "#f59e0b" : "#dc2626",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>

            {/* Metadata */}
            {(enteredBy || lastModified) && (
              <div style={{ marginLeft: "auto", fontSize: 10, color: "#64748b", textAlign: "right", lineHeight: 1.7 }}>
                {enteredBy && <div><strong>Entered by:</strong> {enteredBy}</div>}
                {lastModified && <div><strong>Modified:</strong> {fmtDate(lastModified)}</div>}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default SupplierInvoiceFormInputA;
