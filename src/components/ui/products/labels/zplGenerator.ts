import type { LabelData, LabelTemplate, FieldPrintConfig } from "./LabelCanvas";
import { wrapDefault } from "./LabelCanvas";

const DPI = 203; // GX430T standard

const dots = (inches: number) => Math.round(inches * DPI);

/**
 * Height (in line-units) to reserve for a wrapped field before the next field starts.
 *
 * Two different estimate strategies were tried here and both still overlapped in real
 * printing: a flat per-character width ratio, then a canvas-measured word-wrap
 * simulation. Neither can fully match a specific printer's actual font-0 rendering —
 * the browser's font metrics (even measured with canvas) are still just an
 * approximation of the printer firmware's own glyph widths and internal ^FB line
 * spacing, and any mismatch shows up as an overlap since ZPL gives no feedback on how
 * many lines it actually used. So instead of guessing, this always reserves the full
 * worst-case height (the field's configured max line count) — the next field can never
 * land inside a shorter field's space, at the cost of some blank room below short text.
 * 1.15 accounts for ^FB's own default inter-line leading, which runs a bit taller than
 * the raw font height (dotH) alone.
 */
const LINE_HEIGHT_FACTOR = 1.15;

export function buildZpl(
  template: LabelTemplate,
  data: LabelData,
  fieldConfigs: FieldPrintConfig[]
): string {
  const isRattail = template.labletype === "rattail";
  const isCenter  = template.contentAlign === "center";
  const faceW  = dots(template.labelwidth  || 0.75);
  const faceH  = dots(template.labelheight || 0.5);
  const leftD  = dots(parseFloat(template.leftmargin   || "0"));
  // middlemargin is now the back-face top margin, not a fold gap. Total height is 2 × faceH.
  const backTopD = isRattail ? dots(parseFloat(template.middlemargin || "0")) : 0;
  const totalW = leftD + faceW;
  const totalH = isRattail ? faceH * 2 : faceH;
  const xBase  = leftD + 5;
  // For center mode: text spans full face width using ^FB field block with center justification
  const textBlockW = faceW - 10;

  const values: Record<string, string> = {
    itembarcodeid:    data.itembarcodeid    ?? "",
    itemcode:         data.itemcode         ?? "",
    itemdescription:  data.itemdescription  ?? "",
    itemsellprice:    data.itemsellprice ? `$${parseFloat(data.itemsellprice).toFixed(2)}` : "",
    codedprice:       data.codedprice       ?? "",
    categoryname:     data.categoryname     ?? "",
    itemtagprice:     data.itemtagprice ? `$${parseFloat(data.itemtagprice).toFixed(2)}` : "",
    itemlength:       data.itemlength       ?? "",
    itemsize:         data.itemsize         ?? "",
    itemcolor:        data.itemcolor        ?? "",
    itemmetal:        data.itemmetal        ?? "",
    itemweighttext:   data.itemweighttext   ?? "",
  };

  // Small buffer added after a field's content before the next one starts. A flat few
  // dots is negligible breathing room at a large font size and can look cramped even
  // without literal overlap, so scale it off the field's own font height instead.
  const fieldGap = (h: number) => Math.max(2, Math.round(h * 0.18));

  // Combine-with-item-code only takes effect once both the barcode and Item Code are
  // actually enabled — matches the same rule LabelCanvas.tsx uses for the browser/preview
  // path, so ZPL and preview never disagree about whether the two are merged.
  const barcodeCfg = fieldConfigs.find(c => c.key === "itembarcodeid");
  const itemCodeCfg = fieldConfigs.find(c => c.key === "itemcode");
  const combiningBarcodeAndItemCode = !!barcodeCfg?.enabled && !!barcodeCfg?.combineItemCode && !!itemCodeCfg?.enabled;

  const renderFace = (fields: FieldPrintConfig[], yBase: number, topOffset = 0): string => {
    let zpl = "";
    let y = yBase + topOffset + 4;
    const maxY = yBase + faceH - 4;
    // Item Code is dropped as its own line here — its value is folded into the
    // barcode's human-readable line instead (see combiningBarcodeAndItemCode above).
    const effectiveFields = combiningBarcodeAndItemCode ? fields.filter(f => f.key !== "itemcode") : fields;

    for (const f of [...effectiveFields].sort((a, b) => a.order - b.order)) {
      if (!f.enabled) continue;
      let val = values[f.key];
      if (!val || y >= maxY) continue;
      if (f.uppercase) val = val.toUpperCase();

      const dotH = Math.max(14, Math.round(f.fontSize * DPI / 96));

      if (f.key === "itembarcodeid") {
        const bcH = Math.min(Math.round(faceH * (isRattail ? 0.437 : 0.38)), maxY - y - dotH - 5);
        if (bcH < 8) continue;
        const bcW = Math.round(faceW * (isRattail ? 0.80 : 0.75));
        const bcX = isCenter ? leftD + Math.round((faceW - bcW) / 2) : xBase;
        // The barcode SYMBOL always encodes just the plain barcode value — only the
        // human-readable text line underneath shows the combined "barcode/itemcode".
        const belowVal = combiningBarcodeAndItemCode && values.itemcode ? `${val}/${values.itemcode}` : val;
        zpl += `^FO${bcX},${y}^BY1^BCN,${bcH},N,N,N^FD${val}^FS\n`;
        y += bcH + fieldGap(dotH);
        if (isCenter) {
          zpl += `^FO${leftD + 5},${y}^FB${textBlockW},1,,C,0^A0N,${dotH},${dotH}^FD${belowVal}^FS\n`;
        } else {
          zpl += `^FO${xBase},${y}^A0N,${dotH},${dotH}^FD${belowVal}^FS\n`;
        }
        y += dotH + fieldGap(dotH);
      } else {
        const style = f.bold ? "B" : "N";
        const safe  = val.replace(/[\^~]/g, "");
        const wrap  = f.wrap ?? wrapDefault(f.key);
        const blockW = isCenter ? textBlockW : Math.max(40, faceW - (xBase - leftD) - 4);
        const maxLines = wrap ? 4 : 1;
        const justify = isCenter ? "C" : "L";
        const foX = isCenter ? leftD + 5 : xBase;
        zpl += `^FO${foX},${y}^FB${blockW},${maxLines},0,${justify},0^A0${style},${dotH},${dotH}^FD${safe}^FS\n`;
        // Reserve the full worst-case height (see LINE_HEIGHT_FACTOR above) rather than
        // guessing how many lines this text actually uses — guarantees the next field
        // never overlaps this one, even if it leaves blank room below shorter text. The
        // extra leading only applies once there's more than one line to lead between —
        // a plain single-line field's spacing is unchanged from before.
        const perLineH = maxLines > 1 ? Math.round(dotH * LINE_HEIGHT_FACTOR) : dotH;
        y += perLineH * maxLines + fieldGap(dotH);
      }
    }
    return zpl;
  };

  const front = fieldConfigs.filter(c => c.side === "front");
  const back  = fieldConfigs.filter(c => c.side === "back");

  let zpl  = "^XA\n";
  zpl += `^PW${totalW}\n`;
  zpl += `^LL${totalH}\n`;
  zpl += renderFace(front, 0);
  if (isRattail) zpl += renderFace(back, faceH, backTopD);
  zpl += "^XZ\n";
  return zpl;
}
