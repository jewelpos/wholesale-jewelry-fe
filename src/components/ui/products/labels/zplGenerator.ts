import type { LabelData, LabelTemplate, FieldPrintConfig } from "./LabelCanvas";

const DPI = 203; // GX430T standard

const dots = (inches: number) => Math.round(inches * DPI);

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
  };

  const renderFace = (fields: FieldPrintConfig[], yBase: number, topOffset = 0): string => {
    let zpl = "";
    let y = yBase + topOffset + 4;
    const maxY = yBase + faceH - 4;

    for (const f of [...fields].sort((a, b) => a.order - b.order)) {
      if (!f.enabled) continue;
      const val = values[f.key];
      if (!val || y >= maxY) continue;

      const dotH = Math.max(14, Math.round(f.fontSize * DPI / 96));

      if (f.key === "itembarcodeid") {
        const bcH = Math.min(Math.round(faceH * (isRattail ? 0.437 : 0.38)), maxY - y - dotH - 5);
        if (bcH < 8) continue;
        const bcW = Math.round(faceW * (isRattail ? 0.80 : 0.75));
        const bcX = isCenter ? leftD + Math.round((faceW - bcW) / 2) : xBase;
        zpl += `^FO${bcX},${y}^BY1^BCN,${bcH},N,N,N^FD${val}^FS\n`;
        y += bcH + 2;
        if (isCenter) {
          zpl += `^FO${leftD + 5},${y}^FB${textBlockW},1,,C,0^A0N,${dotH},${dotH}^FD${val}^FS\n`;
        } else {
          zpl += `^FO${xBase},${y}^A0N,${dotH},${dotH}^FD${val}^FS\n`;
        }
        y += dotH + 3;
      } else {
        const style = f.bold ? "B" : "N";
        const safe  = val.replace(/[\^~]/g, "");
        if (isCenter) {
          zpl += `^FO${leftD + 5},${y}^FB${textBlockW},1,,C,0^A0${style},${dotH},${dotH}^FD${safe}^FS\n`;
        } else {
          zpl += `^FO${xBase},${y}^A0${style},${dotH},${dotH}^FD${safe}^FS\n`;
        }
        y += dotH + 3;
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
