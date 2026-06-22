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
  fontSize: "0.65rem", letterSpacing: "0.06em",
  textTransform: "uppercase", fontWeight: 600, color: "#64748b", marginBottom: 4,
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, minWidth: 76, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </span>
    <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{value || "—"}</span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 9, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, paddingBottom: 5, borderBottom: "1px solid #dcfce7" }}>
    {children}
  </div>
);

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

  /* ── Invoice snapshot (edit/view mode) ── */
  const isEdit = disableField && savedAmount > 0;
  const paid = amountPaid ?? 0;
  const balance = amountBalance ?? savedAmount;
  const payPct = savedAmount > 0 ? Math.min(100, Math.round((paid / savedAmount) * 100)) : 0;
  const invoiceStatus =
    balance <= 0 ? { label: "Fully Paid", color: "#15803d", bg: "#dcfce7" }
    : paid > 0   ? { label: "Partially Paid", color: "#b45309", bg: "#fef9c3" }
                 : { label: "Open", color: "#dc2626", bg: "#fee2e2" };

  return (
    <>
      {/* ── HEADER STRIP ─────────────────────────────────────── */}
      <div className="card mb-3" style={{ borderLeft: "3px solid #15803d" }}>
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-4 align-items-start">

            <div>
              <div style={LABEL}>Invoice Date</div>
              <Controller
                name="veninvoicedate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    format="DD-MM-YYYY"
                    allowClear={false}
                    disabled={disableField}
                    style={{ width: 140 }}
                  />
                )}
              />
            </div>
            <div className="vr align-self-stretch" />

            <div>
              <div style={LABEL}>Warehouse</div>
              <div className="fw-semibold" style={{ fontSize: "0.9rem", paddingTop: 6, color: "#1e293b" }}>
                {warehouse?.warehousename || "—"}
              </div>
              <input type="hidden" {...register("warehouseid", { required: "Warehouse is required" })} />
            </div>
            <div className="vr align-self-stretch" />

            <div>
              <div style={LABEL}>Vendor Invoice #</div>
              <input
                type="text"
                className={`form-control form-control-sm${errors.veninvoiceno ? " is-invalid" : ""}`}
                style={{ width: 160 }}
                {...register("veninvoiceno", { required: "Vendor invoice number is required" })}
                disabled={disableField}
              />
              {errors.veninvoiceno && (
                <div className="invalid-feedback">{errors.veninvoiceno.message}</div>
              )}
            </div>
            <div className="vr align-self-stretch" />

            <div>
              <div style={LABEL}>Ref PO #</div>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: 120 }}
                {...register("refponumber")}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── MAIN TWO-PANEL BODY ────────────────────────────────── */}
      <div className="row g-3 mb-3">

        {/* LEFT — Form Fields */}
        <div className="col-lg-5 col-md-12">
          <div className="card h-100">
            <div className="card-body">

              <SectionTitle>Supplier & Invoice Details</SectionTitle>

              {/* Supplier */}
              <div className="mb-3">
                <div style={LABEL}>Supplier *</div>
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

              {/* Invoice Amount + Terms row */}
              <div className="row g-2">
                <div className="col-6">
                  <div style={LABEL}>Invoice Amount *</div>
                  <input
                    type="text"
                    className={`form-control form-control-sm${errors.veninvoicetotal ? " is-invalid" : ""}`}
                    {...register("veninvoicetotal", {
                      required: "Invoice amount is required",
                      validate: (value) =>
                        disableField && savedAmount && Number(value) < savedAmount
                          ? "Amount must be ≥ saved amount"
                          : undefined,
                    })}
                  />
                  {errors.veninvoicetotal && (
                    <div className="invalid-feedback">{errors.veninvoicetotal.message}</div>
                  )}
                </div>
                <div className="col-6">
                  <div style={LABEL}>Payment Terms</div>
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
              </div>

              {/* Invoice Snapshot — edit/view mode only */}
              {isEdit && (
                <div style={{
                  marginTop: 20, padding: "14px 16px", borderRadius: 8,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                }}>
                  <SectionTitle>Invoice Status</SectionTitle>

                  {/* Status badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      color: invoiceStatus.color, background: invoiceStatus.bg,
                    }}>
                      {invoiceStatus.label}
                    </span>
                  </div>

                  {/* Amount rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Invoice Total</span>
                      <span style={{ fontWeight: 700 }}>{fmt(savedAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Amount Paid</span>
                      <span style={{ fontWeight: 600, color: "#15803d" }}>{fmt(paid)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>Balance Due</span>
                      <span style={{ fontWeight: 700, color: balance > 0 ? "#dc2626" : "#15803d" }}>{fmt(balance)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
                      <span>Payment Progress</span>
                      <span>{payPct}%</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${payPct}%`, height: "100%", background: "#15803d", borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                    {enteredBy && (
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        <span style={{ fontWeight: 600 }}>Entered by:</span> {enteredBy}
                      </div>
                    )}
                    {lastModified && (
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        <span style={{ fontWeight: 600 }}>Last modified:</span> {fmtDate(lastModified)}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* RIGHT — Supplier Profile */}
        <div className="col-lg-7 col-md-12">
          <div className="card h-100">
            <div className="card-body">

              <SectionTitle>Supplier Profile</SectionTitle>

              {supplierLoading ? (
                <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>Loading supplier info…</div>
              ) : supplier ? (
                <div className="row g-0">

                  {/* Left sub-column: Address & Contact */}
                  <div className="col-6" style={{ paddingRight: 16 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                        {supplier.companyname}
                      </div>
                      {(supplier.supplierfname || supplier.supplierlname) && (
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {[supplier.supplierfname, supplier.supplierlname].filter(Boolean).join(" ")}
                        </div>
                      )}
                      {supplier.contactperson1 && (
                        <div style={{ fontSize: 12, color: "#64748b" }}>{supplier.contactperson1}</div>
                      )}
                    </div>

                    {supplier.address1 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={LABEL}>Address</div>
                        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                          <div>{supplier.address1}</div>
                          {supplier.address2 && <div>{supplier.address2}</div>}
                          {[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).length > 0 && (
                            <div>{[supplier.city, supplier.state, supplier.zipcode].filter(Boolean).join(", ")}</div>
                          )}
                          {supplier.country && <div>{supplier.country}</div>}
                        </div>
                      </div>
                    )}

                    <InfoRow label="Phone" value={supplier.phone1 || supplier.cellphone} />
                    {supplier.phone1 && supplier.cellphone && (
                      <InfoRow label="Mobile" value={supplier.cellphone} />
                    )}
                    {supplier.emailaddress && <InfoRow label="Email" value={supplier.emailaddress} />}
                    {supplier.webaddress && <InfoRow label="Web" value={supplier.webaddress} />}
                  </div>

                  {/* Right sub-column: Account Details */}
                  <div className="col-6" style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: 16 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={LABEL}>Account Details</div>
                      {supplier.accountno && <InfoRow label="Account #" value={supplier.accountno} />}
                      {supplier.shippimgmethod && <InfoRow label="Ship Via" value={supplier.shippimgmethod} />}
                      {(supplier.discountrate ?? 0) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, minWidth: 76, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Discount
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: "#15803d", background: "#dcfce7",
                            padding: "1px 8px", borderRadius: 20,
                          }}>
                            {supplier.discountrate}%
                          </span>
                        </div>
                      )}
                    </div>

                    {supplier.remarks && (
                      <div style={{ marginTop: 12 }}>
                        <div style={LABEL}>Remarks</div>
                        <div style={{
                          fontSize: 11, color: "#64748b", lineHeight: 1.5,
                          padding: "6px 8px", background: "#f8fafc", borderRadius: 5,
                          border: "1px solid #e2e8f0", maxHeight: 72, overflowY: "auto",
                        }}>
                          {supplier.remarks}
                        </div>
                      </div>
                    )}

                    {/* Quick stat pills — only if we're not in edit mode (those show in status card) */}
                    {!isEdit && (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={LABEL}>Status</div>
                        <span style={{
                          display: "inline-block", fontSize: 11, fontWeight: 700,
                          padding: "3px 10px", borderRadius: 20, width: "fit-content",
                          color: supplier.supplierstatus === 1 ? "#15803d" : "#dc2626",
                          background: supplier.supplierstatus === 1 ? "#dcfce7" : "#fee2e2",
                        }}>
                          {supplier.supplierstatus === 1 ? "Active" : "Inactive"}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>
                  Select a supplier to see profile details
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default SupplierInvoiceFormInputA;
