"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { Printer, Tag, Settings, ChevronRight, ChevronDown, ChevronUp } from "react-feather";
import { createPortal } from "react-dom";
import {
  GET_INVENTORY_TAG_LABELS_QUERY,
  GET_PRODUCT_SETTINGS_INFO_QUERY,
} from "@/lib/graphql/query/products";
import { ProductListType } from "@/types/product";
import LabelCanvas, { LabelData, LabelTemplate, FieldPrintConfig } from "./LabelCanvas";
import useDefaultRoute from "@/hooks/useDefaultRoute";

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

function formatCurrency(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  const [int, dec] = n.toFixed(2).split(".");
  return "$" + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
}

const isOn = (v: string | null | undefined) => v === "1" || v === "\x01";

const FIELD_DEFAULTS = [
  { key: "itembarcodeid",   label: "Barcode",      defaultSide: "front" as const, order: 1, fontSize: 7, bold: false, showKey: "showbarcode",     sideKey: "barcodeside"     },
  { key: "itemcode",        label: "Item Code",    defaultSide: "front" as const, order: 2, fontSize: 7, bold: true,  showKey: "showitemcode",    sideKey: "itemcodeside"    },
  { key: "codedprice",      label: "Coded Price",  defaultSide: "front" as const, order: 3, fontSize: 7, bold: true,  showKey: "showcodedprice",  sideKey: "codedpriceside"  },
  { key: "itemdescription", label: "Description",  defaultSide: "back"  as const, order: 1, fontSize: 7, bold: false, showKey: "showdescription", sideKey: "descriptionside" },
  { key: "itemsellprice",   label: "Sell Price",   defaultSide: "back"  as const, order: 2, fontSize: 7, bold: true,  showKey: "showsellprice",   sideKey: "sellpriceside"   },
  { key: "categoryname",    label: "Category",     defaultSide: "back"  as const, order: 3, fontSize: 7, bold: false, showKey: "showcategory",    sideKey: "categoryside"    },
] as const;

const PREVIEW_BLOCK_A: (keyof LabelData)[] = ["itembarcodeid", "codedprice"];
const PREVIEW_BLOCK_B: (keyof LabelData)[] = ["itemcode", "itemdescription", "itemsellprice", "categoryname"];

interface InlinePreviewProps {
  template: LabelTemplate;
  fields: LabelData;
  fieldConfigs: FieldPrintConfig[];
  isRattail: boolean;
}

const BarcodePreview: React.FC<{ text: string; maxW: number; numFontSize: number }> = ({ text, maxW, numFontSize }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    try {
      const bwipjs = require("bwip-js");
      bwipjs.toCanvas(ref.current, {
        bcid: "code128",
        text,
        scale: 2,
        height: 6,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
      });
    } catch { /* invalid barcode */ }
  }, [text]);

  return (
    <div>
      <canvas ref={ref} style={{ maxWidth: maxW * 0.8, width: "80%", display: "block" }} />
      <div style={{ fontSize: numFontSize, color: "#111", marginTop: 0, lineHeight: 1, letterSpacing: "0.5px" }}>{text}</div>
    </div>
  );
};

const InlinePreview: React.FC<InlinePreviewProps> = ({ template, fields, fieldConfigs, isRattail }) => {
  const DPI = 96;
  const SCALE = 2;
  const w  = Math.round((template.labelwidth    || 2) * DPI * SCALE);
  const h  = Math.round((template.labelheight   || 1) * DPI * SCALE);
  const ml = Math.round(parseFloat(template.leftmargin   || "0") * DPI * SCALE);
  const mt = Math.round(parseFloat(template.topmargin    || "0") * DPI * SCALE);
  const mg = Math.round(parseFloat(template.middlemargin || "0") * DPI * SCALE);
  const fontScale = h / ((template.labelheight || 1) * DPI);
  const hasImage = !!template.backgroundimage;
  const contentW = w - ml - 4;

  const renderFace = (face: "front" | "back", faceLabel?: string) => {
    const sorted = fieldConfigs
      .filter(c => c.enabled && c.side === face)
      .sort((a, b) => a.order - b.order);

    const renderItem = (cfg: FieldPrintConfig) => {
      const value = fields[cfg.key];
      if (!value && (cfg.key === "itembarcodeid" || cfg.key === "codedprice" || cfg.key === "categoryname")) return null;
      const fs = Math.max(7, Math.round(cfg.fontSize * fontScale));
      const bg: React.CSSProperties = hasImage ? { background: "rgba(255,255,255,0.85)", padding: "1px 4px", borderRadius: 2 } : {};

      if (cfg.key === "itembarcodeid" && value) {
        return (
          <div key={cfg.key} style={{ position: "relative", maxWidth: contentW, ...bg }}>
            <BarcodePreview text={value} maxW={contentW} numFontSize={fs} />
          </div>
        );
      }

      const display = cfg.key === "itemsellprice" && value
        ? formatCurrency(value)
        : (value || "—");

      return (
        <div key={cfg.key} style={{
          fontSize: fs, fontWeight: cfg.bold ? 700 : 400,
          textAlign: "left", color: "#111",
          maxWidth: contentW, overflow: "hidden",
          whiteSpace: "nowrap", textOverflow: "ellipsis",
          lineHeight: 1.2, position: "relative", ...bg,
        }}>
          {display}
        </div>
      );
    };

    const blockA = sorted.filter(c => PREVIEW_BLOCK_A.includes(c.key));
    const blockB = sorted.filter(c => PREVIEW_BLOCK_B.includes(c.key));

    const renderBlock = (block: FieldPrintConfig[]) => {
      const items = block.map(cfg => renderItem(cfg));
      if (!items.some(Boolean)) return null;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, zIndex: 2, position: "relative" }}>
          {items}
        </div>
      );
    };

    return (
      <div style={{
        width: w, minHeight: h,
        background: "#fff",
        position: "relative",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-start", alignItems: "flex-start",
        gap: 2,
        paddingLeft: ml, paddingTop: face === "back" ? mg : mt,
        paddingRight: 4, paddingBottom: 4,
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        {hasImage && (
          <img src={template.backgroundimage} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block", zIndex: 0 }} />
        )}
        {faceLabel && (
          <div style={{
            position: "absolute", top: 3, left: 5, zIndex: 2,
            fontSize: 8, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>{faceLabel}</div>
        )}
        {sorted.length === 0 ? (
          <div style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic", zIndex: 2 }}>empty</div>
        ) : (
          <>
            {renderBlock(blockA)}
            {renderBlock(blockB)}
          </>
        )}
      </div>
    );
  };

  if (isRattail) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, border: "1px dashed #ccc", width: w, margin: "0 auto" }}>
        {renderFace("front", "Front")}
        <div style={{
          width: "100%", height: mg > 0 ? mg : 8, background: "#f0f4f8",
          borderTop: "1px dashed #94a3b8", borderBottom: "1px dashed #94a3b8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 8, color: "#94a3b8", letterSpacing: 2 }}>— fold —</span>
        </div>
        {renderFace("back", "Back")}
      </div>
    );
  }

  return (
    <div style={{ border: "1px dashed #ccc", width: w, margin: "0 auto" }}>
      {renderFace("front")}
    </div>
  );
};

const PrintLabelsModal: React.FC<Props> = ({ product, onClose }) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const { basePath } = useDefaultRoute();
  const router = useRouter();

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
    categoryname: (product.categoryname && product.categoryname !== "0") ? product.categoryname : "",
  });
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [printQueued, setPrintQueued] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState<FieldPrintConfig[]>([]);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [codechars, setCodechars] = useState("");
  const pageStyleRef = useRef<HTMLStyleElement | null>(null);
  const settingsFetchedRef = useRef(false);

  // Auto-select first template
  useEffect(() => {
    if (templates.length && selectedLabelId === null) {
      setSelectedLabelId(templates[0].labelid);
    }
  }, [templates, selectedLabelId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.labelid === selectedLabelId) ?? null,
    [templates, selectedLabelId]
  );

  // Initialize fieldConfigs: load saved settings from localStorage, fall back to template defaults
  useEffect(() => {
    if (!selectedTemplate) return;
    const storageKey = `label_cfg_${parsedStoreId}_${selectedTemplate.labelid}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as FieldPrintConfig[];
        if (parsed.length > 0) {
          setFieldConfigs(parsed);
          return;
        }
      } catch { /* fall through to defaults */ }
    }
    const isRattailTemplate = selectedTemplate.labletype === "rattail" ||
      parseFloat(selectedTemplate.middlemargin || "0") > 0;
    const tpl = selectedTemplate as unknown as Record<string, string>;
    const configs = FIELD_DEFAULTS.map((d, i) => ({
      key: d.key as keyof LabelData,
      label: d.label,
      side: isRattailTemplate ? ((tpl[d.sideKey] || d.defaultSide) as "front" | "back") : "front",
      enabled: isOn(tpl[d.showKey]),
      order: isRattailTemplate ? d.order : i + 1,
      fontSize: d.fontSize,
      bold: d.bold,
    }));
    setFieldConfigs(configs);
  }, [selectedTemplate, parsedStoreId]);

  // Auto-save fieldConfigs to localStorage whenever they change
  useEffect(() => {
    if (fieldConfigs.length === 0 || !selectedLabelId) return;
    const storageKey = `label_cfg_${parsedStoreId}_${selectedLabelId}`;
    localStorage.setItem(storageKey, JSON.stringify(fieldConfigs));
  }, [fieldConfigs, selectedLabelId, parsedStoreId]);

  // Fetch codechars once on mount
  useEffect(() => {
    if (!parsedStoreId || settingsFetchedRef.current) return;
    settingsFetchedRef.current = true;
    fetchSettings({
      variables: { storeid: parsedStoreId, warehouiseid: product.itemwarehouseid ?? 0 },
    }).then(({ data }) => {
      setCodechars(data?.getProductSettingsInfo?.[0]?.codechars ?? "");
    });
  }, [parsedStoreId, product.itemwarehouseid, fetchSettings]);

  // Auto-calculate coded price when sell price, template, or codechars changes
  useEffect(() => {
    if (!codechars || !selectedTemplate) return;
    const price = parseFloat(fields.itemsellprice);
    if (isNaN(price) || price <= 0) return;
    const prefix = selectedTemplate.tagprefix ?? "";
    const suffix = selectedTemplate.tagsuffix ?? "";
    setFields(p => ({ ...p, codedprice: `${prefix}${encodePrice(price, codechars)}${suffix}` }));
  }, [fields.itemsellprice, selectedTemplate, codechars]);

  // Inject @page size and trigger print
  useEffect(() => {
    if (!printQueued || !selectedTemplate) return;
    if (!pageStyleRef.current) {
      pageStyleRef.current = document.createElement("style");
      pageStyleRef.current.id = "label-page-style";
      document.head.appendChild(pageStyleRef.current);
    }
    const isRattail = selectedTemplate.labletype === "rattail" ||
      parseFloat(selectedTemplate.middlemargin || "0") > 0;
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
        variables: { storeid: parsedStoreId, warehouiseid: product.itemwarehouseid ?? 0 },
      });
      const settings = data?.getProductSettingsInfo?.[0] ?? null;
      const codechars: string = settings?.codechars ?? "";
      const price = product.itemsellprice ?? 0;
      const rawCoded = codechars ? encodePrice(price, codechars) : String(price);
      const prefix = selectedTemplate?.tagprefix ?? "";
      const suffix = selectedTemplate?.tagsuffix ?? "";
      setFields({
        itemcode: product.itemcode ?? "",
        itemdescription: product.itemdescription ?? "",
        itembarcodeid: String(product.itembarcodeid ?? ""),
        itemsellprice: price != null ? String(price) : "",
        codedprice: `${prefix}${rawCoded}${suffix}`,
        categoryname: (product.categoryname && product.categoryname !== "0") ? product.categoryname : "",
      });
    } finally {
      setAutoFillLoading(false);
    }
  };

  const moveField = (key: keyof LabelData, dir: "up" | "down") => {
    setFieldConfigs(prev => {
      const cfg = prev.find(c => c.key === key);
      if (!cfg) return prev;
      const faceFields = prev
        .filter(c => c.side === cfg.side)
        .sort((a, b) => a.order - b.order);
      const idx = faceFields.findIndex(c => c.key === key);
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= faceFields.length) return prev;
      const oa = faceFields[idx].order;
      const ob = faceFields[swapIdx].order;
      return prev.map(c =>
        c.key === faceFields[idx].key     ? { ...c, order: ob } :
        c.key === faceFields[swapIdx].key ? { ...c, order: oa } : c
      );
    });
  };

  const updateField = (key: keyof LabelData, patch: Partial<FieldPrintConfig>) => {
    setFieldConfigs(prev => prev.map(c => c.key === key ? { ...c, ...patch } : c));
  };

  const moveSide = (key: keyof LabelData) => {
    setFieldConfigs(prev => {
      const cfg = prev.find(c => c.key === key);
      if (!cfg) return prev;
      const newSide = cfg.side === "front" ? "back" : "front";
      const maxOrder = prev.filter(c => c.side === newSide).reduce((m, c) => Math.max(m, c.order), 0);
      return prev.map(c => c.key === key ? { ...c, side: newSide, order: maxOrder + 1 } : c);
    });
  };

  const printCopies = useMemo(
    () => Array.from({ length: printQueued ? copies : 0 }),
    [printQueued, copies]
  );

  const goToSettings = () => {
    onClose();
    router.push(`${basePath}/products/labels`);
  };

  const EDITABLE_FIELDS: { key: keyof LabelData; label: string }[] = [
    { key: "itemdescription", label: "Description" },
    { key: "itemsellprice",   label: "Sell Price"  },
    { key: "codedprice",      label: "Coded Price" },
    { key: "itemcode",        label: "Item Code"   },
    { key: "itembarcodeid",   label: "Barcode ID"  },
    { key: "categoryname",    label: "Category"    },
  ];

  const isRattail = selectedTemplate?.labletype === "rattail" ||
    parseFloat(selectedTemplate?.middlemargin || "0") > 0;

  const frontFields = fieldConfigs
    .filter(c => c.side === "front")
    .sort((a, b) => a.order - b.order);
  const backFields = fieldConfigs
    .filter(c => c.side === "back")
    .sort((a, b) => a.order - b.order);

  const renderLayoutRows = (rows: FieldPrintConfig[]) =>
    rows.map((cfg) => {
      const faceFields = fieldConfigs
        .filter(c => c.side === cfg.side)
        .sort((a, b) => a.order - b.order);
      const idx = faceFields.findIndex(c => c.key === cfg.key);
      const canUp   = idx > 0;
      const canDown = idx < faceFields.length - 1;

      return (
        <tr key={cfg.key} style={{ opacity: cfg.enabled ? 1 : 0.45 }}>
          <td style={{ padding: "2px 2px", whiteSpace: "nowrap" }}>
            <button
              type="button"
              onClick={() => moveField(cfg.key, "up")}
              disabled={!canUp}
              style={{
                background: "none", border: "none", padding: "1px 3px",
                cursor: canUp ? "pointer" : "default",
                color: canUp ? "#6366f1" : "#cbd5e1", fontSize: 9, lineHeight: 1,
              }}
            >▲</button>
            <button
              type="button"
              onClick={() => moveField(cfg.key, "down")}
              disabled={!canDown}
              style={{
                background: "none", border: "none", padding: "1px 3px",
                cursor: canDown ? "pointer" : "default",
                color: canDown ? "#6366f1" : "#cbd5e1", fontSize: 9, lineHeight: 1,
              }}
            >▼</button>
          </td>
          <td style={{ padding: "2px 4px", textAlign: "center" }}>
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={e => updateField(cfg.key, { enabled: e.target.checked })}
              style={{ cursor: "pointer" }}
            />
          </td>
          <td style={{ padding: "2px 6px", fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>
            {cfg.label}
          </td>
          <td style={{ padding: "2px 4px" }}>
            <input
              type="number"
              min={7} max={18}
              value={cfg.fontSize}
              disabled={!cfg.enabled}
              onChange={e => updateField(cfg.key, { fontSize: Math.max(7, Math.min(18, Number(e.target.value))) })}
              style={{ width: 44, fontSize: 11, textAlign: "center", padding: "1px 2px", border: "1px solid #e2e8f0", borderRadius: 4 }}
            />
          </td>
          <td style={{ padding: "2px 4px", textAlign: "center" }}>
            <button
              type="button"
              disabled={!cfg.enabled || cfg.key === "itembarcodeid"}
              onClick={() => updateField(cfg.key, { bold: !cfg.bold })}
              style={{
                fontWeight: 700, fontSize: 11,
                padding: "1px 6px",
                border: `1px solid ${cfg.bold && cfg.enabled ? "#6366f1" : "#e2e8f0"}`,
                borderRadius: 4,
                background: cfg.bold && cfg.enabled ? "#eef2ff" : "#fff",
                color: cfg.bold && cfg.enabled ? "#6366f1" : "#94a3b8",
                cursor: cfg.enabled && cfg.key !== "itembarcodeid" ? "pointer" : "default",
              }}
            >B</button>
          </td>
          {isRattail && (
            <td style={{ padding: "2px 4px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => moveSide(cfg.key)}
                title={cfg.side === "front" ? "Move to Back" : "Move to Front"}
                style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 5px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 4,
                  background: cfg.side === "front" ? "#eef2ff" : "#ecfeff",
                  color: cfg.side === "front" ? "#6366f1" : "#0891b2",
                  cursor: "pointer",
                }}
              >{cfg.side === "front" ? "→B" : "→F"}</button>
            </td>
          )}
        </tr>
      );
    });

  const modalContent = (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1060 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          style={{ maxWidth: 900, width: "96vw" }}
        >
          <div className="modal-content" style={{ borderRadius: 12, border: "none", overflow: "hidden" }}>

            <div style={{ height: 4, background: "#6366f1" }} />

            <div className="modal-header border-0 pb-0" style={{ padding: "16px 24px 10px" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 38, height: 38, background: "#eef2ff", color: "#6366f1" }}>
                  <Tag size={17} />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold" style={{ fontSize: 15, color: "#0f172a" }}>Print Labels</h5>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
                    {product.itemdescription || product.itemcode}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={goToSettings}
                  style={{
                    background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
                    padding: "4px 10px", fontSize: 12, color: "#6366f1",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Settings size={12} /> Templates
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
                    padding: "4px 10px", fontSize: 12, color: "#64748b", cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: "14px 24px 20px" }}>

              {/* Template selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
                  Select Template
                </div>
                {labelsLoading ? (
                  <div style={{ height: 110, background: "#f8fafc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Loading templates…</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div style={{ padding: "16px 20px", background: "#fef9f0", border: "1px dashed #fbbf24", borderRadius: 8, fontSize: 13 }}>
                    No active label templates.{" "}
                    <button onClick={goToSettings} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                      Create one in Templates <ChevronRight size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                    {templates.map((t) => {
                      const selected = t.labelid === selectedLabelId;
                      return (
                        <button
                          key={t.labelid}
                          type="button"
                          onClick={() => setSelectedLabelId(t.labelid)}
                          style={{
                            flexShrink: 0,
                            border: selected ? "2px solid #6366f1" : "2px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "10px 12px",
                            background: selected ? "#eef2ff" : "#fff",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s",
                            minWidth: 120,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, minHeight: 60, overflow: "hidden" }}>
                            <div style={{ transform: "scale(0.55)", transformOrigin: "center center" }}>
                              <LabelCanvas template={t} data={fields} scale={1} showFaceLabels />
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: selected ? "#4338ca" : "#334155", lineHeight: 1.3 }}>
                            {t.labelname}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                            {t.labletype === "rattail" ? "Rat-tail" : "Rectangular"}
                            {" · "}{t.labelwidth}"×{t.labelheight}"
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <div className="row g-4">

                  {/* LEFT: Fields + Field Layout */}
                  <div className="col-md-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
                      Label Fields
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {EDITABLE_FIELDS.map(({ key, label }) => (
                        <div key={key} className="row align-items-center g-0">
                          <div className="col-5">
                            <label style={{ fontSize: 12, color: "#64748b", marginBottom: 0 }}>{label}</label>
                          </div>
                          <div className="col-7">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={fields[key]}
                              onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-cancel w-100 mt-3"
                      onClick={handleAutoFill}
                      disabled={autoFillLoading}
                    >
                      {autoFillLoading ? "Loading…" : "Auto-fill from Settings"}
                    </button>

                    {/* Field Layout collapsible panel */}
                    <div style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => setLayoutOpen(o => !o)}
                        style={{
                          width: "100%", background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: layoutOpen ? "6px 6px 0 0" : 6,
                          padding: "6px 12px", fontSize: 12, fontWeight: 600,
                          color: "#475569", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}
                      >
                        <span>⊞ Field Layout</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!selectedTemplate) return;
                              const storageKey = `label_cfg_${parsedStoreId}_${selectedTemplate.labelid}`;
                              localStorage.removeItem(storageKey);
                              const isRattailTemplate = selectedTemplate.labletype === "rattail" ||
                                parseFloat(selectedTemplate.middlemargin || "0") > 0;
                              const tpl = selectedTemplate as unknown as Record<string, string>;
                              const configs = FIELD_DEFAULTS.map((d, i) => ({
                                key: d.key as keyof LabelData,
                                label: d.label,
                                side: isRattailTemplate ? ((tpl[d.sideKey] || d.defaultSide) as "front" | "back") : "front",
                                enabled: isOn(tpl[d.showKey]),
                                order: isRattailTemplate ? d.order : i + 1,
                                fontSize: d.fontSize,
                                bold: d.bold,
                              }));
                              setFieldConfigs(configs);
                            }}
                            style={{ fontSize: 10, color: "#94a3b8", textDecoration: "underline", cursor: "pointer" }}
                          >Reset</span>
                          {layoutOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </span>
                      </button>

                      {layoutOpen && fieldConfigs.length > 0 && (
                        <div style={{
                          border: "1px solid #e2e8f0", borderTop: "none",
                          borderRadius: "0 0 6px 6px", background: "#fff", overflowX: "auto",
                        }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "4px 2px", color: "#94a3b8", fontWeight: 600, textAlign: "center", width: 48 }}>Order</th>
                                <th style={{ padding: "4px 4px", color: "#94a3b8", fontWeight: 600, textAlign: "center", width: 32 }}>Show</th>
                                <th style={{ padding: "4px 6px", color: "#94a3b8", fontWeight: 600 }}>Field</th>
                                <th style={{ padding: "4px 4px", color: "#94a3b8", fontWeight: 600, textAlign: "center", width: 48 }}>Size</th>
                                <th style={{ padding: "4px 4px", color: "#94a3b8", fontWeight: 600, textAlign: "center", width: 36 }}>Bold</th>
                                {isRattail && <th style={{ padding: "4px 4px", color: "#94a3b8", fontWeight: 600, textAlign: "center", width: 36 }}>Side</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {isRattail ? (
                                <>
                                  <tr>
                                    <td colSpan={6} style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "#6366f1", background: "#eef2ff", letterSpacing: "0.5px" }}>
                                      FRONT
                                    </td>
                                  </tr>
                                  {renderLayoutRows(frontFields)}
                                  <tr>
                                    <td colSpan={6} style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "#0891b2", background: "#ecfeff", letterSpacing: "0.5px" }}>
                                      BACK
                                    </td>
                                  </tr>
                                  {renderLayoutRows(backFields)}
                                </>
                              ) : (
                                renderLayoutRows(frontFields)
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Preview + copies + print */}
                  <div className="col-md-7 d-flex flex-column align-items-center">
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10, width: "100%", textAlign: "center" }}>
                      Live Preview
                    </div>

                    <div style={{
                      background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
                      padding: 16, width: "100%", marginBottom: 16,
                    }}>
                      <InlinePreview
                        template={selectedTemplate}
                        fields={fields}
                        fieldConfigs={fieldConfigs}
                        isRattail={isRattail}
                      />
                    </div>

                    {isRattail && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, textAlign: "center" }}>
                        Rat-tail · fold at center · loop threads through item
                      </div>
                    )}

                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span style={{ fontSize: 13, color: "#64748b" }}>Copies:</span>
                      <button type="button" className="btn btn-cancel" style={{ padding: "2px 10px", lineHeight: 1.6 }}
                        onClick={() => setCopies((c) => Math.max(1, c - 1))}>−</button>
                      <input
                        type="number" min={1} max={100} value={copies}
                        onChange={(e) => setCopies(Math.max(1, Math.min(100, Number(e.target.value))))}
                        style={{ width: 54, textAlign: "center", fontSize: 14, fontWeight: 600 }}
                        className="form-control form-control-sm"
                      />
                      <button type="button" className="btn btn-cancel" style={{ padding: "2px 10px", lineHeight: 1.6 }}
                        onClick={() => setCopies((c) => Math.min(100, c + 1))}>+</button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-submit w-100"
                      onClick={() => setPrintQueued(true)}
                      disabled={!selectedTemplate || printQueued}
                    >
                      <Printer size={14} className="me-2" />
                      {printQueued ? "Preparing…" : `Print ${copies} Label${copies > 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print area — hidden on screen */}
      <div id="label-print-area">
        {selectedTemplate &&
          printCopies.map((_, i) => (
            <LabelCanvas key={i} template={selectedTemplate} data={fields} scale={1} fieldConfigs={fieldConfigs} />
          ))}
      </div>
    </>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
};

export default PrintLabelsModal;
