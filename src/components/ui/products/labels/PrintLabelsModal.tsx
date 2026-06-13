"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { Printer, Tag } from "react-feather";
import { createPortal } from "react-dom";
import {
  GET_INVENTORY_TAG_LABELS_QUERY,
  GET_PRODUCT_SETTINGS_INFO_QUERY,
} from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import LabelCanvas, { LabelData, LabelTemplate } from "./LabelCanvas";

interface Props {
  product: ProductListType;
  onClose: () => void;
}

function encodePrice(price: number, codechars: string): string {
  return String(Math.round(price * 100))
    .split("")
    .map((d) => codechars[parseInt(d, 10)] ?? d)
    .join("");
}

const PrintLabelsModal: React.FC<Props> = ({ product, onClose }) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const { data: labelsData, loading: labelsLoading } = useQuery(
    GET_INVENTORY_TAG_LABELS_QUERY,
    { variables: { storeid: parsedStoreId }, skip: !parsedStoreId }
  );

  const [fetchSettings] = useLazyQuery(GET_PRODUCT_SETTINGS_INFO_QUERY);

  const templates: LabelTemplate[] = useMemo(
    () => labelsData?.getInventoryTagLabels ?? [],
    [labelsData]
  );

  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [copies, setCopies] = useState(1);
  const [fields, setFields] = useState<LabelData>({
    itemcode: product.itemcode ?? "",
    itemdescription: product.itemdescription ?? "",
    itembarcodeid: String(product.itembarcodeid ?? ""),
    itemsellprice: product.itemsellprice != null ? String(product.itemsellprice) : "",
    codedprice: "",
    categoryname: product.categoryname ?? "",
  });
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [printQueued, setPrintQueued] = useState(false);
  const pageStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (templates.length && selectedLabelId === null) {
      setSelectedLabelId(templates[0].labelid);
    }
  }, [templates, selectedLabelId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.labelid === selectedLabelId) ?? null,
    [templates, selectedLabelId]
  );

  // Trigger window.print() after print content is rendered
  useEffect(() => {
    if (!printQueued || !selectedTemplate) return;

    // Inject @page size
    if (!pageStyleRef.current) {
      pageStyleRef.current = document.createElement("style");
      pageStyleRef.current.id = "label-page-style";
      document.head.appendChild(pageStyleRef.current);
    }
    const isRattail = selectedTemplate.labletype === "rattail";
    const wIn = selectedTemplate.labelwidth ?? 2;
    const hIn = selectedTemplate.labelheight ?? 1;
    const midIn = isRattail ? parseFloat(selectedTemplate.middlemargin || "0") : 0;
    const pageH = isRattail ? hIn * 2 + midIn : hIn;
    pageStyleRef.current.textContent = `@page { size: ${wIn}in ${pageH}in; margin: 0; }`;

    const timer = setTimeout(() => {
      window.print();
      setPrintQueued(false);
      if (pageStyleRef.current) pageStyleRef.current.textContent = "";
    }, 100);

    return () => clearTimeout(timer);
  }, [printQueued, selectedTemplate]);

  const handleAutoFill = async () => {
    setAutoFillLoading(true);
    try {
      const { data } = await fetchSettings({
        variables: {
          storeid: parsedStoreId,
          warehouiseid: product.itemwarehouseid ?? 0,
        },
      });
      const settings = data?.getProductSettingsInfo?.[0] ?? null;
      const codechars: string = settings?.codechars ?? "";
      const price = product.itemsellprice ?? 0;
      const rawCoded = codechars ? encodePrice(price, codechars) : String(price);
      const prefix = selectedTemplate?.tagprefix ?? "";
      const suffix = selectedTemplate?.tagsuffix ?? "";
      const coded = `${prefix}${rawCoded}${suffix}`;
      setFields({
        itemcode: product.itemcode ?? "",
        itemdescription: product.itemdescription ?? "",
        itembarcodeid: String(product.itembarcodeid ?? ""),
        itemsellprice: price != null ? String(price) : "",
        codedprice: coded,
        categoryname: product.categoryname ?? "",
      });
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedTemplate) return;
    setPrintQueued(true);
  };

  const printCopies = useMemo(
    () => Array.from({ length: printQueued ? copies : 0 }),
    [printQueued, copies]
  );

  const modalContent = (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1060 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          style={{ maxWidth: 820, width: "95vw" }}
        >
          <div className="modal-content" style={{ borderRadius: 12, border: "none", overflow: "hidden" }}>

            {/* Accent stripe */}
            <div style={{ height: 4, background: "#6366f1" }} />

            {/* Header */}
            <div className="modal-header border-0 pb-0" style={{ padding: "18px 24px 10px" }}>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 40, height: 40, background: "#eef2ff", color: "#6366f1" }}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold" style={{ fontSize: 16, color: "#0f172a" }}>Print Labels</h5>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {product.itemdescription || product.itemcode}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12, color: "#64748b", cursor: "pointer", lineHeight: 1.5,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: "16px 24px 24px" }}>
              <div className="row g-4">

                {/* LEFT: Form */}
                <div className="col-md-6">
                  {/* Template selector */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
                      Label Template
                    </div>
                    {labelsLoading ? (
                      <div style={{ height: 36, background: "#f1f5f9", borderRadius: 6 }} />
                    ) : templates.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#ef4444" }}>
                        No active label templates found in <code>inventorytaglabels</code>.
                      </div>
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={selectedLabelId ?? ""}
                        onChange={(e) => setSelectedLabelId(Number(e.target.value))}
                      >
                        {templates.map((t) => (
                          <option key={t.labelid} value={t.labelid}>
                            {t.labelname}{" "}
                            ({t.labletype === "rattail" ? "Rat-tail" : "Rectangular"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Fields */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
                      Fields
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {(
                        [
                          { key: "itemdescription", label: "Description", editable: true },
                          { key: "itemsellprice",   label: "Sell Price",  editable: true },
                          { key: "codedprice",      label: "Coded Price", editable: false },
                          { key: "itemcode",        label: "Item Code",   editable: false },
                          { key: "itembarcodeid",   label: "Barcode ID",  editable: false },
                          { key: "categoryname",    label: "Category",    editable: false },
                        ] as { key: keyof LabelData; label: string; editable: boolean }[]
                      ).map(({ key, label, editable }) => (
                        <div key={key} className="row align-items-center g-0">
                          <div className="col-5">
                            <label style={{ fontSize: 12, color: "#64748b", marginBottom: 0 }}>{label}</label>
                          </div>
                          <div className="col-7">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={fields[key]}
                              readOnly={!editable}
                              style={!editable ? { background: "#f8fafc", color: "#94a3b8" } : undefined}
                              onChange={
                                editable
                                  ? (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-cancel w-100 mb-2"
                    onClick={handleAutoFill}
                    disabled={autoFillLoading}
                  >
                    {autoFillLoading ? "Loading…" : "Auto-fill from Settings"}
                  </button>
                </div>

                {/* RIGHT: Preview + controls */}
                <div className="col-md-6 d-flex flex-column align-items-center">
                  <div
                    style={{
                      fontSize: 11, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.6px", textTransform: "uppercase",
                      marginBottom: 10, width: "100%", textAlign: "center",
                    }}
                  >
                    Live Preview
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 150,
                      width: "100%",
                      marginBottom: 16,
                      overflow: "auto",
                    }}
                  >
                    {selectedTemplate ? (
                      <LabelCanvas template={selectedTemplate} data={fields} scale={2} />
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>Select a template</div>
                    )}
                  </div>

                  {/* Copies */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span style={{ fontSize: 13, color: "#64748b" }}>Copies:</span>
                    <button
                      type="button"
                      className="btn btn-cancel"
                      style={{ padding: "2px 10px", lineHeight: 1.6 }}
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={copies}
                      onChange={(e) =>
                        setCopies(Math.max(1, Math.min(100, Number(e.target.value))))
                      }
                      style={{ width: 54, textAlign: "center", fontSize: 14, fontWeight: 600 }}
                      className="form-control form-control-sm"
                    />
                    <button
                      type="button"
                      className="btn btn-cancel"
                      style={{ padding: "2px 10px", lineHeight: 1.6 }}
                      onClick={() => setCopies((c) => Math.min(100, c + 1))}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-submit w-100"
                    onClick={handlePrint}
                    disabled={!selectedTemplate || printQueued}
                  >
                    <Printer size={14} className="me-2" />
                    {printQueued ? "Preparing…" : "Print Labels"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print area — hidden on screen, shown on @media print */}
      <div id="label-print-area">
        {selectedTemplate &&
          printCopies.map((_, i) => (
            <LabelCanvas key={i} template={selectedTemplate} data={fields} scale={1} />
          ))}
      </div>
    </>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
};

export default PrintLabelsModal;
