"use client";

import React, { useRef, useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { createPortal } from "react-dom";
import { Tag, Upload, X } from "react-feather";
import {
  CREATE_INVENTORY_TAG_LABEL_MUTATION,
  UPDATE_INVENTORY_TAG_LABEL_MUTATION,
} from "@/lib/graphql/mutations/label";
import LabelCanvas, { LabelTemplate, LabelData } from "./LabelCanvas";
import api from "@/lib/axios";

interface Props {
  storeid: number;
  editLabel: LabelTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

const SAMPLE_DATA: LabelData = {
  itemcode: "RG-1234",
  itemdescription: "14K Yellow Gold Diamond Ring",
  itembarcodeid: "1234567890",
  itemsellprice: "$1,250.00",
  codedprice: "ACBDEF",
  categoryname: "Rings",
};

const DEFAULT_FORM = {
  labelname: "",
  tagmodel: "",
  labletype: "rattail",
  labelwidth: 2,
  labelheight: 1,
  leftmargin: "0.05",
  topmargin: "0.05",
  middlemargin: "0.1",
  tagprefix: "",
  tagsuffix: "",
  showbarcode: "1",
  showitemcode: "1",
  showdescription: "1",
  showsellprice: "1",
  showcodedprice: "0",
  showcategory: "0",
  barcodeside: "front",
  itemcodeside: "front",
  descriptionside: "back",
  sellpriceside: "back",
  codedpriceside: "front",
  categoryside: "back",
  backgroundimage: "",
  isactive: "1",
};

type FormState = typeof DEFAULT_FORM;

const CONTENT_FIELDS: { key: keyof FormState; showKey: keyof FormState; label: string; defaultSide: "front" | "back" }[] = [
  { key: "barcodeside",     showKey: "showbarcode",    label: "Barcode",      defaultSide: "front" },
  { key: "itemcodeside",    showKey: "showitemcode",   label: "Item Code",    defaultSide: "front" },
  { key: "codedpriceside",  showKey: "showcodedprice", label: "Coded Price",  defaultSide: "front" },
  { key: "descriptionside", showKey: "showdescription",label: "Description",  defaultSide: "back"  },
  { key: "sellpriceside",   showKey: "showsellprice",  label: "Sell Price",   defaultSide: "back"  },
  { key: "categoryside",    showKey: "showcategory",   label: "Category",     defaultSide: "back"  },
];

const LabelTemplateFormModal: React.FC<Props> = ({ storeid, editLabel, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createLabel, { loading: creating }] = useMutation(CREATE_INVENTORY_TAG_LABEL_MUTATION);
  const [updateLabel, { loading: updating }] = useMutation(UPDATE_INVENTORY_TAG_LABEL_MUTATION);
  const saving = creating || updating;

  useEffect(() => {
    if (editLabel) {
      setForm({
        labelname:       editLabel.labelname ?? "",
        tagmodel:        editLabel.tagmodel ?? "",
        labletype:       editLabel.labletype ?? "rattail",
        labelwidth:      editLabel.labelwidth ?? 2,
        labelheight:     editLabel.labelheight ?? 1,
        leftmargin:      editLabel.leftmargin ?? "0.05",
        topmargin:       editLabel.topmargin ?? "0.05",
        middlemargin:    editLabel.middlemargin ?? "0.1",
        tagprefix:       editLabel.tagprefix ?? "",
        tagsuffix:       editLabel.tagsuffix ?? "",
        showbarcode:     editLabel.showbarcode ?? "1",
        showitemcode:    editLabel.showitemcode ?? "1",
        showdescription: editLabel.showdescription ?? "1",
        showsellprice:   editLabel.showsellprice ?? "1",
        showcodedprice:  editLabel.showcodedprice ?? "0",
        showcategory:    editLabel.showcategory ?? "0",
        barcodeside:     editLabel.barcodeside ?? "front",
        itemcodeside:    editLabel.itemcodeside ?? "front",
        descriptionside: editLabel.descriptionside ?? "back",
        sellpriceside:   editLabel.sellpriceside ?? "back",
        codedpriceside:  editLabel.codedpriceside ?? "front",
        categoryside:    editLabel.categoryside ?? "back",
        backgroundimage: editLabel.backgroundimage ?? "",
        isactive:        editLabel.isactive ?? "1",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editLabel]);

  const set = (key: keyof FormState, value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleBool = (key: keyof FormState) =>
    setForm((p) => ({ ...p, [key]: p[key] === "1" ? "0" : "1" }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/store/label/upload-background-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("backgroundimage", res.data.url ?? "");
    } catch {
      setErrors((p) => ({ ...p, backgroundimage: "Image upload failed" }));
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.labelname.trim()) e.labelname = "Label name is required";
    if (!form.labelwidth || Number(form.labelwidth) <= 0) e.labelwidth = "Width must be > 0";
    if (!form.labelheight || Number(form.labelheight) <= 0) e.labelheight = "Height must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const label = {
      ...form,
      labelwidth: Number(form.labelwidth),
      labelheight: Number(form.labelheight),
    };
    try {
      if (editLabel) {
        await updateLabel({ variables: { input: { storeid, labelid: editLabel.labelid, label } } });
      } else {
        await createLabel({ variables: { input: { storeid, label } } });
      }
      onSaved();
    } catch (err: any) {
      setErrors({ global: err.message ?? "Failed to save label" });
    }
  };

  const previewTemplate: LabelTemplate = {
    labelid: 0,
    labelname: form.labelname,
    labletype: form.labletype,
    labelwidth: Number(form.labelwidth) || 2,
    labelheight: Number(form.labelheight) || 1,
    leftmargin: form.leftmargin,
    topmargin: form.topmargin,
    middlemargin: form.middlemargin,
    tagprefix: form.tagprefix,
    tagsuffix: form.tagsuffix,
    showbarcode: form.showbarcode,
    showitemcode: form.showitemcode,
    showdescription: form.showdescription,
    showsellprice: form.showsellprice,
    showcodedprice: form.showcodedprice,
    showcategory: form.showcategory,
    barcodeside: form.barcodeside,
    itemcodeside: form.itemcodeside,
    descriptionside: form.descriptionside,
    sellpriceside: form.sellpriceside,
    codedpriceside: form.codedpriceside,
    categoryside: form.categoryside,
    backgroundimage: form.backgroundimage || undefined,
  };

  const isRattail = form.labletype === "rattail";

  const section = (title: string, children: React.ReactNode) => (
    <div className="mb-3">
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #f1f5f9" }}>
        {title}
      </div>
      {children}
    </div>
  );

  const field = (label: string, children: React.ReactNode, err?: string) => (
    <div className="row g-0 align-items-center mb-2">
      <div className="col-5">
        <label style={{ fontSize: 12, color: "#475569", marginBottom: 0 }}>{label}</label>
      </div>
      <div className="col-7">
        {children}
        {err && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{err}</div>}
      </div>
    </div>
  );

  const content = (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 1000 }}>
        <div className="modal-content" style={{ borderRadius: 12, border: "none", overflow: "hidden" }}>

          {/* Accent stripe */}
          <div style={{ height: 4, background: "#6366f1" }} />

          {/* Header */}
          <div className="modal-header border-0 pb-0" style={{ padding: "18px 24px 10px" }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 40, height: 40, background: "#eef2ff", color: "#6366f1" }}>
                <Tag size={18} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 16, color: "#0f172a" }}>
                  {editLabel ? "Edit Label Template" : "New Label Template"}
                </h5>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Configure dimensions, content, and placement</div>
              </div>
            </div>
            <button type="button" onClick={onClose}
              style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: "16px 24px" }}>
            {errors.global && (
              <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{errors.global}</div>
            )}
            <div className="row g-4">

              {/* LEFT — Form */}
              <div className="col-md-6">

                {section("Basic Info", <>
                  {field("Label Name", (
                    <input className={`form-control form-control-sm ${errors.labelname ? "is-invalid" : ""}`}
                      value={form.labelname} onChange={(e) => set("labelname", e.target.value)} placeholder="e.g. Rattail 2x1" />
                  ), errors.labelname)}
                  {field("Type", (
                    <select className="form-select form-select-sm" value={form.labletype}
                      onChange={(e) => { set("labletype", e.target.value); }}>
                      <option value="rattail">Rat-tail (Front + Back)</option>
                      <option value="rectangular">Rectangular (Single face)</option>
                    </select>
                  ))}
                  {field("Model / Notes", (
                    <input className="form-control form-control-sm" value={form.tagmodel}
                      onChange={(e) => set("tagmodel", e.target.value)} placeholder="Optional model number" />
                  ))}
                  {field("Active", (
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" checked={form.isactive === "1"}
                        onChange={() => toggleBool("isactive")} />
                    </div>
                  ))}
                </>)}

                {section("Dimensions (inches)", <>
                  {field("Width", (
                    <input type="number" min="0.5" max="6" step="0.25" className={`form-control form-control-sm ${errors.labelwidth ? "is-invalid" : ""}`}
                      value={form.labelwidth} onChange={(e) => set("labelwidth", e.target.value)} />
                  ), errors.labelwidth)}
                  {field("Height (per face)", (
                    <input type="number" min="0.5" max="4" step="0.25" className={`form-control form-control-sm ${errors.labelheight ? "is-invalid" : ""}`}
                      value={form.labelheight} onChange={(e) => set("labelheight", e.target.value)} />
                  ), errors.labelheight)}
                  {field("Left Margin", (
                    <input type="number" min="0" max="0.5" step="0.01" className="form-control form-control-sm"
                      value={form.leftmargin} onChange={(e) => set("leftmargin", e.target.value)} />
                  ))}
                  {field("Top Margin", (
                    <input type="number" min="0" max="0.5" step="0.01" className="form-control form-control-sm"
                      value={form.topmargin} onChange={(e) => set("topmargin", e.target.value)} />
                  ))}
                  {isRattail && field("Fold Gap", (
                    <input type="number" min="0" max="0.5" step="0.01" className="form-control form-control-sm"
                      value={form.middlemargin} onChange={(e) => set("middlemargin", e.target.value)} />
                  ))}
                </>)}

                {section("Coded Price", <>
                  {field("Prefix", (
                    <input className="form-control form-control-sm" value={form.tagprefix}
                      onChange={(e) => set("tagprefix", e.target.value)} placeholder="e.g. $" />
                  ))}
                  {field("Suffix", (
                    <input className="form-control form-control-sm" value={form.tagsuffix}
                      onChange={(e) => set("tagsuffix", e.target.value)} placeholder="e.g. -" />
                  ))}
                </>)}

                {section("Label Background Image", <>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                    Upload a scan or photo of your blank label stock. The preview will overlay content on top of it so you can see exactly how it will print.
                  </div>
                  {form.backgroundimage ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={form.backgroundimage}
                        alt="Label background"
                        style={{ width: "100%", maxHeight: 100, objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: 6 }}
                      />
                      <button
                        type="button"
                        onClick={() => set("backgroundimage", "")}
                        style={{
                          position: "absolute", top: 4, right: 4,
                          background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%",
                          width: 22, height: 22, cursor: "pointer", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: "2px dashed #e2e8f0", borderRadius: 8, padding: "16px 12px",
                        textAlign: "center", cursor: "pointer", transition: "border-color 0.15s",
                        background: "#fafafa",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                    >
                      {imageUploading ? (
                        <div style={{ fontSize: 12, color: "#6366f1" }}>Uploading…</div>
                      ) : (
                        <>
                          <Upload size={20} color="#94a3b8" style={{ marginBottom: 4 }} />
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Click to upload</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>PNG, JPG, WEBP</div>
                        </>
                      )}
                    </div>
                  )}
                  {errors.backgroundimage && (
                    <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.backgroundimage}</div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                </>)}

              </div>

              {/* RIGHT — Content + Preview */}
              <div className="col-md-6">

                {section("Content & Placement", (
                  <div>
                    <div className="row g-0 mb-1" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <div className="col-5">Field</div>
                      <div className="col-2 text-center">Show</div>
                      {isRattail && <>
                        <div className="col-2 text-center">Front</div>
                        <div className="col-2 text-center">Back</div>
                      </>}
                    </div>
                    {CONTENT_FIELDS.map(({ key, showKey, label, defaultSide }) => {
                      const shown = form[showKey] === "1";
                      const side = (form[key] as string) ?? defaultSide;
                      return (
                        <div key={key} className="row g-0 align-items-center mb-1 py-1"
                          style={{ borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                          <div className="col-5" style={{ color: shown ? "#1e293b" : "#94a3b8", fontWeight: shown ? 500 : 400 }}>
                            {label}
                          </div>
                          <div className="col-2 text-center">
                            <div className="form-check form-switch mb-0 d-flex justify-content-center">
                              <input className="form-check-input" type="checkbox"
                                checked={shown} onChange={() => toggleBool(showKey)} />
                            </div>
                          </div>
                          {isRattail && <>
                            <div className="col-2 text-center">
                              <div className="form-check mb-0 d-flex justify-content-center">
                                <input className="form-check-input" type="radio"
                                  name={`side-${key}`} value="front"
                                  checked={side === "front"}
                                  disabled={!shown}
                                  onChange={() => set(key, "front")} />
                              </div>
                            </div>
                            <div className="col-2 text-center">
                              <div className="form-check mb-0 d-flex justify-content-center">
                                <input className="form-check-input" type="radio"
                                  name={`side-${key}`} value="back"
                                  checked={side === "back"}
                                  disabled={!shown}
                                  onChange={() => set(key, "back")} />
                              </div>
                            </div>
                          </>}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Live Preview */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>
                  Live Preview
                </div>
                <div style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                  padding: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: 160, overflowX: "auto",
                }}>
                  <LabelCanvas template={previewTemplate} data={SAMPLE_DATA} scale={2} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 6 }}>
                  Sample data · {form.labelwidth}" × {isRattail ? `${Number(form.labelheight) * 2 + Number(form.middlemargin || 0)}"` : `${form.labelheight}"`} total
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 gap-2" style={{ padding: "12px 24px" }}>
            <button className="btn btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-submit px-4" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editLabel ? "Update Template" : "Create Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
};

export default LabelTemplateFormModal;
