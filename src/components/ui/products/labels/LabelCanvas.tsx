"use client";

import React, { useEffect, useRef } from "react";

export interface LabelData {
  itemcode: string;
  itemdescription: string;
  itembarcodeid: string;
  itemsellprice: string;
  codedprice: string;
  categoryname: string;
}

export interface LabelTemplate {
  labelid: number;
  labelname: string;
  tagmodel?: string;
  labletype: string;
  labelwidth: number;
  labelheight: number;
  leftmargin: string;
  topmargin: string;
  middlemargin: string;
  tagprefix: string;
  tagsuffix: string;
  showbarcode: string;
  showitemcode: string;
  showdescription: string;
  showsellprice: string;
  showcodedprice: string;
  showcategory: string;
  barcodeside?: string;
  itemcodeside?: string;
  descriptionside?: string;
  sellpriceside?: string;
  codedpriceside?: string;
  categoryside?: string;
  backgroundimage?: string;
  isactive?: string;
}

export interface FieldPrintConfig {
  key: keyof LabelData;
  label: string;
  side: "front" | "back";
  enabled: boolean;
  order: number;
  fontSize: number;
  bold: boolean;
}

const DPI = 96;
const isOn = (v: string | null | undefined) => v === "1" || v === "\x01";

function formatCurrency(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  const [int, dec] = n.toFixed(2).split(".");
  return "$" + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
}

function drawBarcode(canvas: HTMLCanvasElement, text: string) {
  if (!text) return;
  try {
    const bwipjs = require("bwip-js");
    bwipjs.toCanvas(canvas, {
      bcid: "code128",
      text,
      scale: 2,
      height: 8,
      includetext: false,
      paddingwidth: 0,
      paddingheight: 0,
    });
  } catch {
    // invalid barcode — leave canvas blank
  }
}

interface ActiveField {
  key: keyof LabelData;
  fontSize: number;
  bold: boolean;
}

interface FaceProps {
  template: LabelTemplate;
  data: LabelData;
  face: "front" | "back";
  widthPx: number;
  heightPx: number;
  ml: number;
  mt: number;
  faceLabel?: string;
  fieldConfigs?: FieldPrintConfig[];
}

const LabelFace: React.FC<FaceProps> = ({
  template, data, face, widthPx, heightPx, ml, mt, faceLabel, fieldConfigs,
}) => {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const isRattail = template.labletype === "rattail";
  const hasImage = !!template.backgroundimage;

  const onSide = (side: string | undefined, def: "front" | "back") =>
    isRattail ? (side || def) === face : true;

  // Build the ordered list of fields to display
  const activeFields: ActiveField[] = (() => {
    if (fieldConfigs && fieldConfigs.length > 0) {
      // Config-driven: scale fontSize to the rendered label height
      const scale = heightPx / ((template.labelheight || 1) * DPI);
      return fieldConfigs
        .filter(c => c.enabled && c.side === face)
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          key: c.key,
          fontSize: Math.max(7, Math.round(c.fontSize * scale)),
          bold: c.bold,
        }));
    }
    // Template-flag fallback
    const bfs = Math.max(7, Math.round(heightPx * 0.09));
    const fields: ActiveField[] = [];
    if (isOn(template.showbarcode)     && onSide(template.barcodeside,     "front")) fields.push({ key: "itembarcodeid",   fontSize: bfs,     bold: false });
    if (isOn(template.showitemcode)    && onSide(template.itemcodeside,    "front")) fields.push({ key: "itemcode",         fontSize: bfs,     bold: true  });
    if (isOn(template.showcodedprice)  && onSide(template.codedpriceside,  "front")) fields.push({ key: "codedprice",       fontSize: bfs + 1, bold: true  });
    if (isOn(template.showdescription) && onSide(template.descriptionside, "back"))  fields.push({ key: "itemdescription",  fontSize: bfs,     bold: false });
    if (isOn(template.showsellprice)   && onSide(template.sellpriceside,   "back"))  fields.push({ key: "itemsellprice",    fontSize: bfs + 1, bold: true  });
    if (isOn(template.showcategory)    && onSide(template.categoryside,    "back"))  fields.push({ key: "categoryname",     fontSize: bfs - 1, bold: false });
    return fields;
  })();

  const showBarcode = activeFields.some(f => f.key === "itembarcodeid") && !!data.itembarcodeid;

  useEffect(() => {
    if (barcodeRef.current && showBarcode) {
      drawBarcode(barcodeRef.current, data.itembarcodeid);
    }
  }, [showBarcode, data.itembarcodeid]);

  const renderField = (f: ActiveField) => {
    const fs = f.fontSize;
    const fw = f.bold ? 700 : 400;
    const pill: React.CSSProperties = hasImage
      ? { background: "rgba(255,255,255,0.85)", padding: "1px 5px", borderRadius: 3 }
      : {};

    switch (f.key) {
      case "itembarcodeid":
        // Skip when data is empty — avoids blank canvas occupying space
        if (!data.itembarcodeid) return null;
        return <canvas key="barcode" ref={barcodeRef} style={{ maxWidth: "100%", maxHeight: heightPx * 0.4 }} />;

      case "itemcode":
        return (
          <div key="code" style={{ fontSize: fs, fontWeight: fw, letterSpacing: "0.5px", textAlign: "center", color: "#111", ...pill }}>
            {data.itemcode}
          </div>
        );

      case "codedprice":
        if (!data.codedprice) return null;
        return (
          <div key="coded" style={{ fontSize: fs, fontWeight: fw, letterSpacing: "1px", textAlign: "center", color: "#111", ...pill }}>
            {data.codedprice}
          </div>
        );

      case "itemdescription":
        return (
          <div key="desc" style={{
            fontSize: fs, fontWeight: fw, textAlign: "center", lineHeight: 1.3,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            maxWidth: "90%", color: "#111", ...pill,
          }}>
            {data.itemdescription}
          </div>
        );

      case "itemsellprice":
        return (
          <div key="sell" style={{ fontSize: fs, fontWeight: fw, textAlign: "center", color: "#111", ...pill }}>
            {data.itemsellprice ? formatCurrency(data.itemsellprice) : ""}
          </div>
        );

      case "categoryname":
        return (
          <div key="cat" style={{ fontSize: fs, fontWeight: fw, textAlign: "center", color: "#444", ...pill }}>
            {data.categoryname}
          </div>
        );

      default:
        return null;
    }
  };

  const visibleFields = activeFields.filter(f => {
    if (f.key === "itembarcodeid") return !!data.itembarcodeid;
    if (f.key === "codedprice") return !!data.codedprice;
    return true;
  });

  const sharedContentStyle: React.CSSProperties = {
    paddingLeft: ml,
    paddingTop: mt,
    paddingRight: 4,
    paddingBottom: 4,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    overflow: "hidden",
    boxSizing: "border-box",
  };

  if (hasImage) {
    return (
      <div style={{ width: widthPx, height: heightPx, position: "relative", overflow: "hidden", background: "#fff" }}>
        <img
          src={template.backgroundimage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, ...sharedContentStyle }}>
          {faceLabel && (
            <div style={{
              position: "absolute", top: 2, left: 4,
              fontSize: 7, fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase", letterSpacing: "0.5px",
              background: "rgba(0,0,0,0.25)", padding: "1px 3px", borderRadius: 2,
            }}>
              {faceLabel}
            </div>
          )}
          {activeFields.map(renderField)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: widthPx, height: heightPx, background: "#fff", position: "relative", ...sharedContentStyle }}>
      {faceLabel && (
        <div style={{
          position: "absolute", top: 2, left: 4,
          fontSize: 7, fontWeight: 700, color: "#b0b8c4",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {faceLabel}
        </div>
      )}
      {visibleFields.length === 0 && (
        <div style={{ fontSize: 9, color: "#cbd5e1", fontStyle: "italic" }}>empty</div>
      )}
      {activeFields.map(renderField)}
    </div>
  );
};

const FoldGap: React.FC<{ gapPx: number }> = ({ gapPx }) => (
  <div style={{
    height: gapPx || 10,
    background: "#f8fafc",
    borderTop: "1px dashed #94a3b8",
    borderBottom: "1px dashed #94a3b8",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  }}>
    <span style={{ fontSize: 8, color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase" }}>— fold —</span>
  </div>
);

const RattailPreviewShell: React.FC<{
  widthPx: number; facePx: number; gapPx: number;
  template: LabelTemplate; data: LabelData; ml: number; mt: number;
  fieldConfigs?: FieldPrintConfig[];
}> = ({ widthPx, facePx, gapPx, template, data, ml, mt, fieldConfigs }) => {
  const loopH = Math.round(facePx * 0.22);
  const loopW = Math.round(widthPx * 0.6);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div style={{ display: "flex", alignItems: "center", width: widthPx + loopW }}>
        <svg width={loopW} height={loopH} viewBox={`0 0 ${loopW} ${loopH}`} style={{ flexShrink: 0 }}>
          <polygon
            points={`0,${loopH / 2} 18,0 ${loopW},0 ${loopW},${loopH} 18,${loopH}`}
            fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
          />
          <text x={loopW * 0.35} y={loopH / 2 + 3} fontSize="7" fill="#94a3b8" textAnchor="middle">LOOP</text>
        </svg>
        <div style={{ width: widthPx, height: loopH, borderTop: "1.5px solid #94a3b8", borderRight: "1.5px solid #94a3b8" }} />
      </div>
      <div style={{
        width: widthPx, border: "1.5px solid #94a3b8",
        borderTop: "none", borderRadius: "0 0 6px 6px",
        overflow: "hidden", background: "#fff",
      }}>
        <LabelFace template={template} data={data} face="front" widthPx={widthPx} heightPx={facePx} ml={ml} mt={mt} faceLabel="Front" fieldConfigs={fieldConfigs} />
        <FoldGap gapPx={gapPx} />
        <LabelFace template={template} data={data} face="back"  widthPx={widthPx} heightPx={facePx} ml={ml} mt={0}  faceLabel="Back"  fieldConfigs={fieldConfigs} />
      </div>
    </div>
  );
};

interface Props {
  template: LabelTemplate;
  data: LabelData;
  scale?: number;
  showFaceLabels?: boolean;
  fieldConfigs?: FieldPrintConfig[];
}

const LabelCanvas: React.FC<Props> = ({ template, data, scale = 1, showFaceLabels = false, fieldConfigs }) => {
  const isRattail = template.labletype === "rattail";
  const widthPx  = Math.round((template.labelwidth  || 2) * DPI * scale);
  const facePx   = Math.round((template.labelheight || 1) * DPI * scale);
  const gapPx    = isRattail ? Math.round(parseFloat(template.middlemargin || "0") * DPI * scale) : 0;
  const totalH   = isRattail ? facePx * 2 + gapPx : facePx;
  const ml = Math.round(parseFloat(template.leftmargin || "0") * DPI * scale);
  const mt = Math.round(parseFloat(template.topmargin  || "0") * DPI * scale);

  if (isRattail && scale > 1) {
    return (
      <RattailPreviewShell
        widthPx={widthPx} facePx={facePx} gapPx={gapPx}
        template={template} data={data} ml={ml} mt={mt}
        fieldConfigs={fieldConfigs}
      />
    );
  }

  return (
    <div className="label-item" style={{
      width: widthPx, height: totalH,
      border: "1px dashed #ccc", background: "#fff",
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <LabelFace
        template={template} data={data} face="front"
        widthPx={widthPx} heightPx={isRattail ? facePx : totalH}
        ml={ml} mt={mt}
        faceLabel={isRattail && showFaceLabels ? "Front" : undefined}
        fieldConfigs={fieldConfigs}
      />
      {isRattail && (
        <>
          <div style={{
            height: gapPx, background: "#f0f0f0",
            borderTop: "1px dashed #aaa", borderBottom: "1px dashed #aaa",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {gapPx > 8 && <span style={{ fontSize: 8, color: "#999", letterSpacing: "2px" }}>— FOLD —</span>}
          </div>
          <LabelFace
            template={template} data={data} face="back"
            widthPx={widthPx} heightPx={facePx}
            ml={ml} mt={0}
            faceLabel={showFaceLabels ? "Back" : undefined}
            fieldConfigs={fieldConfigs}
          />
        </>
      )}
    </div>
  );
};

export default LabelCanvas;
