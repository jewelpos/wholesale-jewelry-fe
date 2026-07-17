"use client";

import React, { useEffect, useState } from "react";

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
  fieldconfigs?: string;
  contentAlign?: "center" | "left";
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
// Handle all truthy forms MySQL/GraphQL can return for TINYINT: string "1", binary \x01, number 1, boolean true
const isOn = (v: unknown): boolean => v === "1" || v === "\x01" || v === 1 || v === true;

function formatCurrency(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  const [int, dec] = n.toFixed(2).split(".");
  return "$" + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
}

// Renders barcode as <img> (via off-screen canvas → dataURL) so it prints reliably
const BarcodeImage: React.FC<{ text: string; maxHeight: number; fontSize?: number; maxWidthPx?: number; center?: boolean; rattail?: boolean }> = ({ text, maxHeight, fontSize = 8, maxWidthPx, center, rattail }) => {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!text) { setSrc(""); return; }
    try {
      const offscreen = document.createElement("canvas");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("bwip-js").toCanvas(offscreen, {
        bcid: "code128",
        text,
        scale: 2,
        height: rattail ? 4.6 : 4,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
      });
      setSrc(offscreen.toDataURL("image/png"));
    } catch { setSrc(""); }
  }, [text]);
  if (!src) return null;
  const imgStyle: React.CSSProperties = {
    maxWidth: maxWidthPx ? `${maxWidthPx}px` : "75%",
    maxHeight,
    display: "block",
    ...(center ? { margin: "0 auto" } : {}),
  };
  return (
    <div style={{ marginLeft: center ? 0 : -3, textAlign: center ? "center" : "left" }}>
      <img src={src} alt="" style={imgStyle} />
      <div style={{ fontSize, color: "#111", lineHeight: 1, letterSpacing: "0.5px" }}>{text}</div>
    </div>
  );
};

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
  printMode?: boolean;
  /** Explicit CSS height value to use in print mode (e.g. "1in") — overrides heightPx */
  cssHeight?: string | number;
}

const LabelFace: React.FC<FaceProps> = ({
  template, data, face, widthPx, heightPx, ml, mt, faceLabel, fieldConfigs, printMode = false, cssHeight,
}) => {
  const isRattail = template.labletype === "rattail";
  const isCenter = template.contentAlign === "center";
  const hasImage = !!template.backgroundimage && !printMode;

  const onSide = (side: string | undefined, def: "front" | "back") =>
    isRattail ? (side || def) === face : true;

  // Build the ordered list of fields to display
  const activeFields: ActiveField[] = (() => {
    if (fieldConfigs && fieldConfigs.length > 0) {
      // Config-driven: scale fontSize to the rendered label height
      const scale = heightPx / ((template.labelheight || 1) * DPI);
      return fieldConfigs
        .filter(c => c.enabled && (!isRattail || c.side === face || (face === "front" && c.side !== "back")))
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          key: c.key,
          fontSize: Math.max(6, Math.round(c.fontSize * scale)),
          bold: c.bold,
        }));
    }
    // Template-flag fallback
    const bfs = Math.max(9, Math.round(heightPx * 0.12));
    const fields: ActiveField[] = [];
    if (isOn(template.showbarcode)     && onSide(template.barcodeside,     "front")) fields.push({ key: "itembarcodeid",   fontSize: bfs,     bold: false });
    if (isOn(template.showitemcode)    && onSide(template.itemcodeside,    "front")) fields.push({ key: "itemcode",         fontSize: bfs,     bold: true  });
    if (isOn(template.showcodedprice)  && onSide(template.codedpriceside,  "front")) fields.push({ key: "codedprice",       fontSize: bfs + 1, bold: true  });
    if (isOn(template.showdescription) && onSide(template.descriptionside, "back"))  fields.push({ key: "itemdescription",  fontSize: bfs,     bold: false });
    if (isOn(template.showsellprice)   && onSide(template.sellpriceside,   "back"))  fields.push({ key: "itemsellprice",    fontSize: bfs + 1, bold: true  });
    if (isOn(template.showcategory)    && onSide(template.categoryside,    "back"))  fields.push({ key: "categoryname",     fontSize: bfs - 1, bold: false });
    // All show* flags are "0" (corrupted DB state from old bug) — fall back to per-face defaults
    if (fields.length === 0) {
      if (face === "front") {
        fields.push({ key: "itembarcodeid", fontSize: bfs,     bold: false });
        fields.push({ key: "itemcode",      fontSize: bfs,     bold: true  });
      } else {
        fields.push({ key: "itemdescription", fontSize: bfs,     bold: false });
        fields.push({ key: "itemsellprice",   fontSize: bfs + 1, bold: true  });
      }
    }
    return fields;
  })();

  const renderField = (f: ActiveField) => {
    const fs = f.fontSize;
    const fw = f.bold ? 700 : 400;
    const pill: React.CSSProperties = hasImage
      ? { background: "rgba(255,255,255,0.85)", padding: "1px 5px", borderRadius: 3 }
      : {};

    switch (f.key) {
      case "itembarcodeid":
        if (!data.itembarcodeid) return null;
        return <BarcodeImage key="barcode" text={data.itembarcodeid} maxHeight={isRattail ? Math.round(Math.min(heightPx * 0.3, 28) * 1.15) : Math.min(heightPx * 0.3, 28)} fontSize={fs} maxWidthPx={Math.round(widthPx * (isRattail ? 0.80 : 0.75))} center={isCenter} rattail={isRattail} />;

      case "itemcode":
        return (
          <div key="code" style={{ fontSize: fs, fontWeight: fw, letterSpacing: "0.5px", lineHeight: 1, textAlign: isCenter ? "center" : "left", width: "100%", color: "#111", ...pill }}>
            {data.itemcode}
          </div>
        );

      case "codedprice":
        if (!data.codedprice) return null;
        return (
          <div key="coded" style={{ fontSize: fs, fontWeight: fw, letterSpacing: "1px", lineHeight: 1, textAlign: isCenter ? "center" : "left", width: "100%", color: "#111", ...pill }}>
            {data.codedprice}
          </div>
        );

      case "itemdescription": {
        // Chrome's print renderer ignores display:-webkit-box, causing 0-height and invisible text.
        // In print mode use plain block + maxHeight; keep webkit clamp for the on-screen thumbnail.
        const clampStyle: React.CSSProperties = printMode
          ? { display: "block", maxHeight: `${Math.round(fs * 1.3 * 2)}px` }
          : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" };
        return (
          <div key="desc" style={{
            fontSize: fs, fontWeight: fw, textAlign: isCenter ? "center" : "left", lineHeight: 1.3,
            overflow: "hidden", width: "100%", color: "#111",
            wordBreak: "break-word",
            ...clampStyle, ...pill,
          }}>
            {data.itemdescription}
          </div>
        );
      }

      case "itemsellprice":
        return (
          <div key="sell" style={{ fontSize: fs, fontWeight: fw, lineHeight: 1, textAlign: isCenter ? "center" : "left", width: "100%", color: "#111", ...pill }}>
            {data.itemsellprice ? formatCurrency(data.itemsellprice) : ""}
          </div>
        );

      case "categoryname":
        return (
          <div key="cat" style={{ fontSize: fs, fontWeight: fw, lineHeight: 1, textAlign: isCenter ? "center" : "left", width: "100%", color: "#444", ...pill }}>
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
    paddingLeft: isCenter ? 4 : ml,
    paddingTop: mt,
    paddingRight: 4,
    paddingBottom: 4,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: isCenter ? "center" : "flex-start",
    gap: 2,
    overflow: "hidden",
    boxSizing: "border-box",
  };

  // In printMode, use cssHeight (e.g. "1in") for hard physical sizing; otherwise use heightPx.
  // clip-path:inset(0) is a compositor-level paint boundary — prevents the background image's
  // bottom edge from bleeding past the face into the next face or page.
  const faceStyle: React.CSSProperties = {
    width: printMode ? "100%" : widthPx,
    height: cssHeight !== undefined ? cssHeight : heightPx,
    overflow: "hidden",
  };

  if (hasImage) {
    return (
      <div style={{ ...faceStyle, position: "relative", background: "#fff" }}>
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
    <div style={{ ...faceStyle, background: "#fff", position: "relative", ...sharedContentStyle }}>
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
  template: LabelTemplate; data: LabelData; ml: number; mt: number; backMt: number;
  fieldConfigs?: FieldPrintConfig[];
}> = ({ widthPx, facePx, gapPx, template, data, ml, mt, backMt, fieldConfigs }) => {
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
        <LabelFace template={template} data={data} face="back"  widthPx={widthPx} heightPx={facePx} ml={ml} mt={backMt}  faceLabel="Back"  fieldConfigs={fieldConfigs} />
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
  /** When true: use CSS `in` units for physical print accuracy and suppress the dashed border */
  printMode?: boolean;
}

const LabelCanvas: React.FC<Props> = ({ template, data, scale = 1, showFaceLabels = false, fieldConfigs, printMode = false }) => {
  const isRattail = template.labletype === "rattail";
  const widthPx  = Math.round((template.labelwidth  || 2) * DPI * scale);
  const facePx   = Math.round((template.labelheight || 1) * DPI * scale);
  // middlemargin is now the back-face top margin (how far content is pushed down from the fold).
  // The fold itself has no physical gap — it's a crease, not a printed gap.
  const backMtRaw = isRattail ? Math.round(parseFloat(template.middlemargin || "0") * DPI * scale) : 0;
  const backMt    = printMode ? backMtRaw : Math.min(backMtRaw, Math.floor(facePx * 0.15));
  const gapPx     = 0; // no physical fold gap; FoldGap component uses its own min-height for the preview line
  const totalH    = isRattail ? facePx * 2 : facePx;
  const mlRaw = Math.round(parseFloat(template.leftmargin || "0") * DPI * scale);
  const mtRaw = Math.round(parseFloat(template.topmargin  || "0") * DPI * scale);

  const isTailLabel = mlRaw >= widthPx;
  // Print + tail: a wrapper div supplies marginLeft so content lands in the printable area.
  // The wrapper is outside .label-item, so it is NOT zeroed by `margin:0 !important` in print CSS.
  // Print + non-tail: small leftmargin is a valid inset within the printable area.
  // Preview: cap at 8% so oversized values don't push content off the visible canvas.
  const ml = printMode
    ? (isTailLabel ? 0 : mlRaw)
    : Math.min(mlRaw, Math.floor(widthPx * 0.08));
  const mt = printMode ? mtRaw : Math.min(mtRaw, Math.floor(facePx * 0.08));

  const wIn    = template.labelwidth  || 2;
  const leftIn = parseFloat(template.leftmargin || "0");
  const hIn    = template.labelheight || 1;
  const midIn  = parseFloat(template.middlemargin || "0");
  const totalHin = isRattail ? hIn * 2 : hIn; // fold is a crease, no extra height

  if (isRattail && scale > 1) {
    return (
      <RattailPreviewShell
        widthPx={widthPx} facePx={facePx} gapPx={gapPx}
        template={template} data={data} ml={ml} mt={mt} backMt={backMt}
        fieldConfigs={fieldConfigs}
      />
    );
  }

  const labelItem = (
    <div className="label-item" style={{
      width:      printMode ? `${wIn}in` : widthPx,
      height:     printMode ? `${totalHin}in` : totalH,
      border:     printMode ? "none" : "1px dashed #ccc",
      background: "#fff",
      overflow:   "hidden",
      display:    "flex",
      flexDirection: "column",
    }}>
      <LabelFace
        template={template} data={data} face="front"
        widthPx={widthPx} heightPx={isRattail ? facePx : totalH}
        ml={ml} mt={mt}
        faceLabel={isRattail && showFaceLabels ? "Front" : undefined}
        fieldConfigs={fieldConfigs}
        printMode={printMode}
        cssHeight={printMode ? `${hIn}in` : undefined}
      />
      {isRattail && (
        <>
          <div style={{
            height: 8,
            background: "#f0f0f0",
            borderTop: "1px dashed #aaa",
            borderBottom: "1px dashed #aaa",
            display: printMode ? "none" : "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 8, color: "#999", letterSpacing: "2px" }}>— FOLD —</span>
          </div>
          <LabelFace
            template={template} data={data} face="back"
            widthPx={widthPx} heightPx={facePx}
            ml={ml} mt={backMt}
            faceLabel={showFaceLabels ? "Back" : undefined}
            fieldConfigs={fieldConfigs}
            printMode={printMode}
            cssHeight={printMode ? `${hIn}in` : undefined}
          />
        </>
      )}
    </div>
  );

  // Tail label in print: wrapper div provides marginLeft to shift content into the printable area.
  // This wrapper is outside .label-item so it is NOT zeroed by `margin:0 !important` in print CSS.
  if (printMode && isTailLabel) {
    return <div style={{ marginLeft: `${leftIn}in` }}>{labelItem}</div>;
  }
  return labelItem;
};

export default LabelCanvas;
