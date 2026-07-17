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
import { buildZpl } from "./zplGenerator";
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

const isOn = (v: unknown): boolean => v === "1" || v === "\x01" || v === 1 || v === true;

// barcodeside / itemcodeside etc. may be stored as "" in the DB — normalize to a valid face
const DEFAULT_SIDES: Record<string, "front" | "back"> = {
  itembarcodeid: "front", itemcode: "front", codedprice: "front",
  itemdescription: "back", itemsellprice: "back", categoryname: "back",
};
function normalizeSide(key: string, side: unknown): "front" | "back" {
  if (side === "front" || side === "back") return side;
  return DEFAULT_SIDES[key] ?? "front";
}
function normalizeConfigs(configs: FieldPrintConfig[]): FieldPrintConfig[] {
  return configs.map(c => ({ ...c, side: normalizeSide(c.key, c.side), fontSize: Math.max(6, c.fontSize) }));
}

// Compute display fieldConfigs for any template — used for thumbnails and the init useEffect.
// Does NOT read localStorage; caller handles that separately for the selected template.
function buildFieldConfigs(template: LabelTemplate): FieldPrintConfig[] {
  const isRattailTemplate = template.labletype === "rattail";
  if (template.fieldconfigs) {
    try {
      const raw = JSON.parse(template.fieldconfigs);
      // Support both old format (array) and new format ({ align, fields })
      const parsed: FieldPrintConfig[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.fields) ? raw.fields : raw);
      if (Array.isArray(parsed) && parsed.some(c => c.enabled)) {
        const normalized = normalizeConfigs(parsed);
        // For rectangular templates all fields render on the single front face
        return isRattailTemplate ? normalized : normalized.map(c => ({ ...c, side: "front" as const }));
      }
    } catch { /* fall through */ }
  }
  const tpl = template as unknown as Record<string, unknown>;
  const built = FIELD_DEFAULTS.map((d, i) => ({
    key: d.key as keyof LabelData,
    label: d.label,
    side: isRattailTemplate
      ? (((tpl[d.sideKey] as string) || d.defaultSide) as "front" | "back")
      : ("front" as const),
    enabled: isOn(tpl[d.showKey]),
    order: isRattailTemplate ? d.order : i + 1,
    fontSize: d.fontSize,
    bold: d.bold,
  }));
  if (built.some(c => c.enabled)) return built;
  const STANDARD: (keyof LabelData)[] = ["itembarcodeid", "itemcode", "codedprice", "itemdescription", "itemsellprice"];
  return FIELD_DEFAULTS.map((d, i) => ({
    key: d.key as keyof LabelData,
    label: d.label,
    side: isRattailTemplate ? d.defaultSide : ("front" as const),
    enabled: STANDARD.includes(d.key as keyof LabelData),
    order: isRattailTemplate ? d.order : i + 1,
    fontSize: d.fontSize,
    bold: d.bold,
  }));
}

const FIELD_DEFAULTS = [
  { key: "itembarcodeid",   label: "Barcode",      defaultSide: "front" as const, order: 1, fontSize: 8,  bold: false, showKey: "showbarcode",     sideKey: "barcodeside"     },
  { key: "itemcode",        label: "Item Code",    defaultSide: "front" as const, order: 2, fontSize: 9,  bold: true,  showKey: "showitemcode",    sideKey: "itemcodeside"    },
  { key: "codedprice",      label: "Coded Price",  defaultSide: "front" as const, order: 3, fontSize: 9,  bold: true,  showKey: "showcodedprice",  sideKey: "codedpriceside"  },
  { key: "itemdescription", label: "Description",  defaultSide: "back"  as const, order: 1, fontSize: 9,  bold: false, showKey: "showdescription", sideKey: "descriptionside" },
  { key: "itemsellprice",   label: "Tag Price",    defaultSide: "back"  as const, order: 2, fontSize: 11, bold: true,  showKey: "showsellprice",   sideKey: "sellpriceside"   },
  { key: "categoryname",    label: "Category",     defaultSide: "back"  as const, order: 3, fontSize: 8,  bold: false, showKey: "showcategory",    sideKey: "categoryside"    },
] as const;

const PREVIEW_BLOCK_A: (keyof LabelData)[] = ["itembarcodeid", "codedprice"];
const PREVIEW_BLOCK_B: (keyof LabelData)[] = ["itemcode", "itemdescription", "itemsellprice", "categoryname"];

interface InlinePreviewProps {
  template: LabelTemplate;
  fields: LabelData;
  fieldConfigs: FieldPrintConfig[];
  isRattail: boolean;
}

const BarcodePreview: React.FC<{ text: string; maxW: number; numFontSize: number; center?: boolean; rattail?: boolean }> = ({ text, maxW, numFontSize, center, rattail }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    try {
      const bwipjs = require("bwip-js");
      bwipjs.toCanvas(ref.current, {
        bcid: "code128",
        text,
        scale: 2,
        height: rattail ? 6.9 : 6,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
      });
    } catch { /* invalid barcode */ }
  }, [text]);

  return (
    <div style={{ marginLeft: center ? 0 : -5, textAlign: center ? "center" : "left" }}>
      <canvas ref={ref} style={{ maxWidth: maxW * (rattail ? 0.80 : 0.75), width: rattail ? "80%" : "75%", display: "block", margin: center ? "0 auto" : undefined }} />
      <div style={{ fontSize: numFontSize, color: "#111", marginTop: 0, lineHeight: 1, letterSpacing: "0.5px" }}>{text}</div>
    </div>
  );
};

const InlinePreview: React.FC<InlinePreviewProps> = ({ template, fields, fieldConfigs, isRattail }) => {
  const DPI = 96;
  const SCALE = 2;
  const w  = Math.round((template.labelwidth    || 2) * DPI * SCALE);
  const h  = Math.round((template.labelheight   || 1) * DPI * SCALE);
  const mlRaw = Math.round(parseFloat(template.leftmargin   || "0") * DPI * SCALE);
  const mtRaw = Math.round(parseFloat(template.topmargin    || "0") * DPI * SCALE);
  // When leftmargin >= labelwidth the template models [tail area | printable area].
  // Expand the canvas so the preview also shows the tail gap on the left and content on the right.
  const isTailLabel = mlRaw >= w;
  const totalW = isTailLabel ? w + mlRaw : w;
  const ml = isTailLabel ? mlRaw : Math.min(mlRaw, Math.floor(w * 0.08));
  const mt = Math.min(mtRaw, Math.floor(h * 0.08));
  const mgRaw = Math.round(parseFloat(template.middlemargin || "0") * DPI * SCALE);
  const mg = Math.min(mgRaw, h);
  const fontScale = h / ((template.labelheight || 1) * DPI);
  const hasImage = !!template.backgroundimage;
  const contentW = Math.max(20, totalW - ml - 4);

  const isCenter = template.contentAlign === "center";

  const renderFace = (face: "front" | "back", faceLabel?: string, faceMt?: number) => {
    const topPad = faceMt !== undefined ? faceMt : mt;
    const sorted = fieldConfigs
      .filter(c => c.enabled && (!isRattail || c.side === face || (face === "front" && c.side !== "back")))
      .sort((a, b) => a.order - b.order);
    const renderItem = (cfg: FieldPrintConfig) => {
      const value = fields[cfg.key];
      if (!value && (cfg.key === "itembarcodeid" || cfg.key === "codedprice" || cfg.key === "categoryname")) return null;
      const fs = Math.max(6, Math.round(cfg.fontSize * fontScale));
      const bg: React.CSSProperties = hasImage ? { background: "rgba(255,255,255,0.85)", padding: "1px 4px", borderRadius: 2 } : {};

      if (cfg.key === "itembarcodeid" && value) {
        return (
          <div key={cfg.key} style={{ position: "relative", width: "100%", textAlign: isCenter ? "center" : "left", ...bg }}>
            <BarcodePreview text={value} maxW={contentW} numFontSize={fs} center={isCenter} rattail={isRattail} />
          </div>
        );
      }

      const display = cfg.key === "itemsellprice" && value
        ? formatCurrency(value)
        : (value || "—");

      return (
        <div key={cfg.key} style={{
          fontSize: fs, fontWeight: cfg.bold ? 700 : 400,
          textAlign: isCenter ? "center" : "left", color: "#111",
          width: "100%", overflow: "hidden",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 0, zIndex: 2, position: "relative", width: "100%" }}>
          {items}
        </div>
      );
    };

    return (
      <div style={{
        width: totalW, height: h,
        background: "#fff",
        position: "relative",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-start", alignItems: isCenter ? "center" : "flex-start",
        gap: 2,
        paddingLeft: isCenter ? 4 : ml, paddingTop: topPad,
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, border: "1px dashed #ccc", width: totalW, margin: "0 auto" }}>
        {renderFace("front", "Front")}
        <div style={{
          width: "100%", height: 8, background: "#f0f4f8",
          borderTop: "1px dashed #94a3b8", borderBottom: "1px dashed #94a3b8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 8, color: "#94a3b8", letterSpacing: 2 }}>— fold —</span>
        </div>
        {renderFace("back", "Back", mg)}
      </div>
    );
  }

  return (
    <div style={{ border: "1px dashed #ccc", width: totalW, margin: "0 auto" }}>
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
    () => (labelsData?.getInventoryTagLabels ?? []).map((t: LabelTemplate) => {
      if (!t.fieldconfigs) return t;
      try {
        const raw = JSON.parse(t.fieldconfigs);
        if (raw && !Array.isArray(raw) && (raw.align === "center" || raw.align === "left")) {
          return { ...t, contentAlign: raw.align as "center" | "left" };
        }
      } catch { /* fall through */ }
      return t;
    }),
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
  const [zplConnection, setZplConnection] = useState<"usb" | "tcp" | "bluetooth" | "serial">("usb");
  const [printerIp, setPrinterIp] = useState("");
  const [zplPort, setZplPort] = useState("9100");
  const [zplBaud, setZplBaud] = useState("9600");
  const [zplStatus, setZplStatus] = useState<"idle" | "printing" | "ok" | "error">("idle");
  const [zplError, setZplError] = useState("");
  const pageStyleRef = useRef<HTMLStyleElement | null>(null);
  const settingsFetchedRef = useRef(false);

  // Persist ZPL connection settings across sessions
  useEffect(() => {
    const conn = localStorage.getItem("zpl_connection");
    const ip   = localStorage.getItem("zpl_ip");
    const port = localStorage.getItem("zpl_port");
    const baud = localStorage.getItem("zpl_baud");
    if (conn && ["usb","tcp","bluetooth","serial"].includes(conn)) setZplConnection(conn as typeof zplConnection);
    if (ip)   setPrinterIp(ip);
    if (port) setZplPort(port);
    if (baud) setZplBaud(baud);
  }, []);
  useEffect(() => { localStorage.setItem("zpl_connection", zplConnection); }, [zplConnection]);
  useEffect(() => { if (printerIp) localStorage.setItem("zpl_ip",   printerIp); }, [printerIp]);
  useEffect(() => { localStorage.setItem("zpl_port", zplPort); }, [zplPort]);
  useEffect(() => { localStorage.setItem("zpl_baud", zplBaud); }, [zplBaud]);

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

  // Initialize fieldConfigs: localStorage (for order/size) merged with template (for enabled state).
  // Template's enabled state always wins so that enabling a field in the template form
  // immediately takes effect here without requiring a manual "Reset".
  useEffect(() => {
    if (!selectedTemplate) return;
    const storageKey = `label_cfg_${parsedStoreId}_${selectedTemplate.labelid}`;
    const templateConfigs = buildFieldConfigs(selectedTemplate);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as FieldPrintConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          let merged = normalizeConfigs(parsed);
          if (selectedTemplate.labletype !== "rattail") {
            merged = merged.map(c => ({ ...c, side: "front" as const }));
          }
          // Template's enabled state is the source of truth; localStorage supplies order/fontSize/bold
          merged = merged.map(c => {
            const tplCfg = templateConfigs.find(t => t.key === c.key);
            return tplCfg ? { ...c, enabled: tplCfg.enabled } : c;
          });
          setFieldConfigs(merged);
          return;
        }
      }
    } catch { /* fall through */ }
    setFieldConfigs(templateConfigs);
  }, [selectedTemplate, parsedStoreId]);

  // Auto-save fieldConfigs to localStorage whenever they change
  useEffect(() => {
    if (fieldConfigs.length === 0 || !selectedLabelId) return;
    const storageKey = `label_cfg_${parsedStoreId}_${selectedLabelId}`;
    localStorage.setItem(storageKey, JSON.stringify(fieldConfigs));
  }, [fieldConfigs, selectedLabelId, parsedStoreId]);

  // Auto-calculate coded price from tag price using template prefix as cipher key (10 chars) or literal wrap
  useEffect(() => {
    if (!selectedTemplate) return;
    const price = fields.itemsellprice;
    const prefix = selectedTemplate.tagprefix || "";
    const suffix = selectedTemplate.tagsuffix || "";
    if (!price && !prefix) return;
    let coded = "";
    if (prefix.length === 10) {
      const digits = price.replace(/[^0-9]/g, "");
      coded = digits.split("").map(d => prefix[parseInt(d, 10)] ?? d).join("") + suffix;
    } else {
      const n = parseFloat(price.replace(/[^0-9.]/g, ""));
      const formatted = isNaN(n) ? price : n.toFixed(2);
      coded = prefix + formatted + suffix;
    }
    setFields(f => ({ ...f, codedprice: coded }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.itemsellprice, selectedTemplate?.tagprefix, selectedTemplate?.tagsuffix, selectedTemplate?.labelid]);

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

  // Auto-calculate coded price when tag price, template, or codechars changes
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
    const isRattailPrint = selectedTemplate.labletype === "rattail";
    const wIn    = selectedTemplate.labelwidth  ?? 2;
    const hIn    = selectedTemplate.labelheight ?? 1;
    const leftIn = parseFloat(selectedTemplate.leftmargin || "0");
    // Tail label: leftmargin ≥ labelwidth means [tail area | printable area].
    // Expand page width to cover both so the printer sees the full 2" roll width.
    const pageW  = leftIn >= wIn ? wIn + leftIn : wIn;
    const pageH  = isRattailPrint ? hIn * 2 : hIn;
    pageStyleRef.current.textContent = `@page { size: ${pageW}in ${pageH}in; margin: 0; }`;
    const timer = setTimeout(() => {
      window.print();
      setPrintQueued(false);
      if (pageStyleRef.current) pageStyleRef.current.textContent = "";
    }, 300);
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

  const handleZplPrint = async () => {
    if (!selectedTemplate) return;
    setZplStatus("printing");
    setZplError("");
    try {
      const zpl = buildZpl(selectedTemplate, fields, fieldConfigs);

      if (zplConnection === "usb") {
        // Zebra Browser Print (supports USB, and also BT/Serial if configured there)
        const deviceRes = await fetch("http://localhost:9101/default");
        if (!deviceRes.ok) throw new Error("Zebra Browser Print not running — install from zebra.com");
        const device = await deviceRes.json();
        if (!device?.uid) throw new Error("No printer found. Check Zebra Browser Print is running and a printer is connected.");
        const form = new URLSearchParams();
        form.set("device", JSON.stringify(device));
        form.set("data", zpl);
        const wr = await fetch("http://localhost:9101/write", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        if (!wr.ok) throw new Error("Browser Print write failed");

      } else if (zplConnection === "tcp") {
        if (!printerIp.trim()) throw new Error("Enter the printer IP address");
        const res = await fetch("/api/print-zpl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            printerIp: printerIp.trim(),
            printerPort: parseInt(zplPort) || 9100,
            template: selectedTemplate,
            data: fields,
            fieldConfigs,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error ?? "TCP print failed");

      } else if (zplConnection === "bluetooth") {
        if (!("bluetooth" in navigator)) throw new Error("Web Bluetooth not supported — use Chrome or Edge");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btNav = (navigator as any).bluetooth;
        const btDevice = await btNav.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            "000018f0-0000-1000-8000-00805f9b34fb", // Zebra BLE
            "49535343-fe7d-4ae5-8fa9-9fafd205e455", // TSC / Citizen BLE
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // common thermal BLE
          ],
        });
        const server = await btDevice.gatt.connect();
        // Try known service/characteristic UUIDs in order
        const serviceUuids = [
          ["000018f0-0000-1000-8000-00805f9b34fb", "00002af1-0000-1000-8000-00805f9b34fb"],
          ["49535343-fe7d-4ae5-8fa9-9fafd205e455", "49535343-8841-43f4-a8d4-ecbe34729bb3"],
          ["e7810a71-73ae-499d-8c15-faa9aef0c3f2", "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"],
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let characteristic: any = null;
        for (const [svcUuid, charUuid] of serviceUuids) {
          try {
            const svc  = await server.getPrimaryService(svcUuid);
            characteristic = await svc.getCharacteristic(charUuid);
            break;
          } catch { /* try next */ }
        }
        if (!characteristic) throw new Error("Printer Bluetooth service not found — ensure printer is on and in range");
        const bytes = new TextEncoder().encode(zpl);
        const CHUNK = 512;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          await characteristic.writeValue(bytes.slice(i, i + CHUNK));
        }

      } else if (zplConnection === "serial") {
        if (!("serial" in navigator)) throw new Error("Web Serial not supported — use Chrome or Edge");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: parseInt(zplBaud) || 9600 });
        const writer = port.writable.getWriter();
        try {
          await writer.write(new TextEncoder().encode(zpl));
        } finally {
          writer.releaseLock();
          await port.close();
        }
      }

      setZplStatus("ok");
      setTimeout(() => setZplStatus("idle"), 3000);
    } catch (err) {
      setZplError(err instanceof Error ? err.message : "Print failed");
      setZplStatus("error");
    }
  };

  const goToSettings = () => {
    onClose();
    router.push(`${basePath}/products/labels`);
  };

  const EDITABLE_FIELDS: { key: keyof LabelData; label: string }[] = [
    { key: "itemdescription", label: "Description" },
    { key: "itemsellprice",   label: "Tag Price"   },
    { key: "codedprice",      label: "Coded Price" },
    { key: "itemcode",        label: "Item Code"   },
    { key: "itembarcodeid",   label: "Barcode ID"  },
    { key: "categoryname",    label: "Category"    },
  ];

  const isRattail = selectedTemplate?.labletype === "rattail";

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
              min={6} max={24}
              value={cfg.fontSize}
              disabled={!cfg.enabled}
              onChange={e => updateField(cfg.key, { fontSize: Math.max(6, Math.min(24, Number(e.target.value))) })}
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
                              <LabelCanvas template={t} data={fields} scale={1} showFaceLabels fieldConfigs={t.labelid === selectedLabelId ? fieldConfigs : buildFieldConfigs(t)} />
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
                              localStorage.removeItem(`label_cfg_${parsedStoreId}_${selectedTemplate.labelid}`);
                              setFieldConfigs(buildFieldConfigs(selectedTemplate));
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

                    {(() => {
                      const lw = selectedTemplate.labelwidth || 2;
                      const lh = selectedTemplate.labelheight || 1;
                      const leftIn = parseFloat(selectedTemplate.leftmargin || "0");
                      const topIn  = parseFloat(selectedTemplate.topmargin  || "0");
                      const isTail = leftIn >= lw;
                      if (isTail) {
                        return (
                          <div style={{
                            width: "100%", marginBottom: 10, padding: "8px 12px",
                            background: "#eff6ff", border: "1px solid #93c5fd",
                            borderRadius: 8, fontSize: 12, color: "#1e40af", lineHeight: 1.5,
                          }}>
                            Tail label: left {leftIn}" is the loop/tail area, right {lw}" is the printable area.
                            The print canvas will be {leftIn + lw}" wide with content on the right.
                          </div>
                        );
                      }
                      const badTop = topIn >= lh * 0.9;
                      if (!badTop) return null;
                      return (
                        <div style={{
                          width: "100%", marginBottom: 10, padding: "8px 12px",
                          background: "#fef3c7", border: "1px solid #f59e0b",
                          borderRadius: 8, fontSize: 12, color: "#92400e", lineHeight: 1.5,
                        }}>
                          ⚠️ <strong>Top Margin = {selectedTemplate.topmargin}"</strong> is almost as tall as the {lh}" label face — content may be clipped.
                          Edit the template to reduce the top margin.
                        </div>
                      );
                    })()}

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

                    {/* Direct ZPL print — connection type selector */}
                    <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>
                        Direct ZPL Print
                      </div>

                      {/* Connection type tabs */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                        {(["usb","tcp","bluetooth","serial"] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => { setZplConnection(t); setZplStatus("idle"); }}
                            style={{
                              flex: 1, padding: "4px 0", fontSize: 11, fontWeight: 600,
                              border: "1px solid",
                              borderColor: zplConnection === t ? "#6366f1" : "#e2e8f0",
                              borderRadius: 5,
                              background: zplConnection === t ? "#eef2ff" : "#fff",
                              color: zplConnection === t ? "#4338ca" : "#64748b",
                              cursor: "pointer",
                              textTransform: "uppercase",
                            }}
                          >
                            {t === "tcp" ? "TCP/IP" : t}
                          </button>
                        ))}
                      </div>

                      {/* Per-connection config */}
                      {zplConnection === "usb" && (
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                          Uses <strong>Zebra Browser Print</strong> (install free from zebra.com).
                          Supports USB, and any printer configured in Browser Print.
                        </div>
                      )}
                      {zplConnection === "tcp" && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <input
                            type="text"
                            placeholder="Printer IP  e.g. 192.168.1.100"
                            value={printerIp}
                            onChange={e => { setPrinterIp(e.target.value); setZplStatus("idle"); }}
                            className="form-control form-control-sm"
                            style={{ fontSize: 12, flex: 3 }}
                          />
                          <input
                            type="text"
                            placeholder="Port"
                            value={zplPort}
                            onChange={e => { setZplPort(e.target.value); setZplStatus("idle"); }}
                            className="form-control form-control-sm"
                            style={{ fontSize: 12, flex: 1, maxWidth: 70 }}
                          />
                        </div>
                      )}
                      {zplConnection === "bluetooth" && (
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                          BLE printers only (Chrome/Edge). A device picker will open when you click Send.
                          <br/>Note: Older Bluetooth Classic printers require Zebra Browser Print — use USB tab instead.
                        </div>
                      )}
                      {zplConnection === "serial" && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>Baud rate:</span>
                          <select
                            value={zplBaud}
                            onChange={e => setZplBaud(e.target.value)}
                            className="form-select form-select-sm"
                            style={{ fontSize: 12, maxWidth: 120 }}
                          >
                            {["9600","19200","38400","57600","115200"].map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>(Chrome/Edge only — a port picker opens on Send)</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn w-100"
                        style={{
                          background: zplStatus === "ok" ? "#16a34a" : "#0f172a",
                          color: "#fff", fontWeight: 600, fontSize: 13,
                          border: "none", padding: "8px 0",
                        }}
                        onClick={handleZplPrint}
                        disabled={!selectedTemplate || zplStatus === "printing"}
                      >
                        {zplStatus === "printing" ? "Sending…"
                         : zplStatus === "ok"      ? "✓ Sent"
                         : `Send ZPL via ${zplConnection === "tcp" ? "TCP/IP" : zplConnection.toUpperCase()}`}
                      </button>

                      {zplStatus === "error" && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#dc2626", background: "#fef2f2", padding: "6px 10px", borderRadius: 6, border: "1px solid #fecaca" }}>
                          {zplError}
                        </div>
                      )}
                    </div>

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
            <LabelCanvas key={i} template={selectedTemplate} data={fields} scale={1} fieldConfigs={fieldConfigs} printMode />
          ))}
      </div>
    </>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
};

export default PrintLabelsModal;
