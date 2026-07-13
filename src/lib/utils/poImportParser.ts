import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface RawSheet {
  name: string;
  rows: string[][];
  colCount: number;
}

export const DEFAULT_UNITS = [
  { value: 'Pc', label: 'Pc – By Piece' },
  { value: 'Wt', label: 'Wt – By Weight' },
];

export function columnLetter(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// Strip control characters (tab, ESC, other hidden chars), then trim spaces
export function cleanCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  // eslint-disable-next-line no-control-regex
  return String(raw).replace(/[\t\r\n\x00-\x1F\x7F]/g, '').trim();
}

// Parse a number from a string that may have $, €, commas, or European decimals
export function cleanNumeric(raw: unknown): number | null {
  const s = cleanCell(raw)
    .replace(/[$€£¥₹]/g, '')
    .replace(/\s/g, '');
  if (!s) return null;
  let normalized = s;
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    // "1.500,00" — dots = thousands separators, comma = decimal
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+(,\d{1,2})$/.test(s)) {
    // "1500,00" — single comma as decimal
    normalized = s.replace(',', '.');
  } else {
    // US style: strip thousands commas
    normalized = s.replace(/,(?=\d{3})/g, '');
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

async function readWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

export async function loadExcelSheets(file: File): Promise<string[]> {
  const wb = await readWorkbook(file);
  return wb.worksheets.map((ws) => ws.name);
}

export async function loadSheetData(file: File, sheetName: string): Promise<RawSheet> {
  const wb = await readWorkbook(file);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) throw new Error(`Worksheet "${sheetName}" not found`);

  const colCount = ws.columnCount || 1;
  const rows: string[][] = [];

  ws.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= colCount; c++) {
      cells.push(cleanCell(row.getCell(c).text));
    }
    rows.push(cells);
  });

  // Pad short rows to uniform width
  for (const r of rows) {
    while (r.length < colCount) r.push('');
  }

  return { name: sheetName, rows, colCount };
}

export async function parseCsvFile(file: File): Promise<RawSheet> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: false,
      encoding: '', // auto-detect via BOM
      complete(result) {
        const rawRows = result.data as string[][];
        let maxCols = 0;
        const rows = rawRows.map((row) => {
          const cleaned = row.map(cleanCell);
          if (cleaned.length > maxCols) maxCols = cleaned.length;
          return cleaned;
        });
        for (const r of rows) {
          while (r.length < maxCols) r.push('');
        }
        resolve({ name: 'CSV', rows, colCount: maxCols });
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}
