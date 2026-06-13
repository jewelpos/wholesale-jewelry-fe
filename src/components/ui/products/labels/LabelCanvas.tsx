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
}

const DPI = 96;
const isOn = (v: string | null | undefined) => v === "1" || v === "\x01";

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
    // barcode text invalid — leave canvas blank
  }
}

interface FaceProps {
  template: LabelTemplate;
  data: LabelData;
  face: "front" | "back";
  widthPx: number;
  heightPx: number;
  ml: number;
  mt: number;
}

const LabelFace: React.FC<FaceProps> = ({ template, data, face, widthPx, heightPx, ml, mt }) => {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const isRattail = template.labletype === "rattail";
  const showBarcode = isOn(template.showbarcode) && (face === "front" || !isRattail);
  const showItemCode = isOn(template.showitemcode) && (face === "front" || !isRattail);
  const showDescription = isOn(template.showdescription) && (face === "back" || !isRattail);
  const showSellPrice = isOn(template.showsellprice) && (face === "back" || !isRattail);
  const showCodedPrice = isOn(template.showcodedprice) && (face === "front" || !isRattail);
  const showCategory = isOn(template.showcategory) && (face === "back" || !isRattail);

  useEffect(() => {
    if (barcodeRef.current && showBarcode && data.itembarcodeid) {
      drawBarcode(barcodeRef.current, data.itembarcodeid);
    }
  }, [showBarcode, data.itembarcodeid]);

  const codedDisplay = data.codedprice ?? "";

  const baseFontSize = Math.max(7, Math.round(heightPx * 0.09));

  return (
    <div
      style={{
        width: widthPx,
        height: heightPx,
        paddingLeft: ml,
        paddingTop: mt,
        paddingRight: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      {showBarcode && (
        <canvas
          ref={barcodeRef}
          style={{ maxWidth: "100%", maxHeight: heightPx * 0.38 }}
        />
      )}
      {showItemCode && (
        <div style={{ fontSize: baseFontSize, fontWeight: 700, letterSpacing: "0.5px", textAlign: "center" }}>
          {data.itemcode}
        </div>
      )}
      {showDescription && (
        <div
          style={{
            fontSize: baseFontSize,
            textAlign: "center",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {data.itemdescription}
        </div>
      )}
      {showSellPrice && (
        <div style={{ fontSize: baseFontSize + 1, fontWeight: 700, textAlign: "center" }}>
          {data.itemsellprice}
        </div>
      )}
      {showCodedPrice && codedDisplay && (
        <div style={{ fontSize: baseFontSize + 1, fontWeight: 700, letterSpacing: "1px", textAlign: "center" }}>
          {codedDisplay}
        </div>
      )}
      {showCategory && (
        <div style={{ fontSize: baseFontSize - 1, color: "#555", textAlign: "center" }}>
          {data.categoryname}
        </div>
      )}
    </div>
  );
};

interface Props {
  template: LabelTemplate;
  data: LabelData;
  scale?: number;
}

const LabelCanvas: React.FC<Props> = ({ template, data, scale = 1 }) => {
  const isRattail = template.labletype === "rattail";
  const widthPx = Math.round((template.labelwidth || 2) * DPI * scale);
  const facePx = Math.round((template.labelheight || 1) * DPI * scale);
  const gapPx = isRattail ? Math.round(parseFloat(template.middlemargin || "0") * DPI * scale) : 0;
  const totalHeight = isRattail ? facePx * 2 + gapPx : facePx;
  const ml = Math.round(parseFloat(template.leftmargin || "0") * DPI * scale);
  const mt = Math.round(parseFloat(template.topmargin || "0") * DPI * scale);

  return (
    <div
      className="label-item"
      style={{
        width: widthPx,
        height: totalHeight,
        border: "1px dashed #ccc",
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LabelFace
        template={template}
        data={data}
        face="front"
        widthPx={widthPx}
        heightPx={facePx}
        ml={ml}
        mt={mt}
      />
      {isRattail && (
        <>
          <div
            style={{
              height: gapPx,
              background: "#f0f0f0",
              borderTop: "1px dashed #aaa",
              borderBottom: "1px dashed #aaa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {gapPx > 8 && (
              <span style={{ fontSize: 8, color: "#999", letterSpacing: "2px" }}>— FOLD —</span>
            )}
          </div>
          <LabelFace
            template={template}
            data={data}
            face="back"
            widthPx={widthPx}
            heightPx={facePx}
            ml={ml}
            mt={0}
          />
        </>
      )}
    </div>
  );
};

export default LabelCanvas;
